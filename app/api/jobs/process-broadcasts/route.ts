/**
 * Process-broadcasts cron job: consumes queue:broadcast, expands recipients by segment, enqueues one send job per guest.
 * Called by Vercel Cron every 2–5 min (e.g. */3 * * * *). Secured with CRON_SECRET. Does not send directly —
 * send-outbound job does the actual Twilio/Resend send. See docs/ARCHITECTURE.md and docs/VERCEL_SETUP.md.
 */
import { NextResponse } from "next/server";
import { getRedis, QUEUE_BROADCAST, QUEUE_SEND } from "@/lib/redis";
import { supabase } from "@/lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 5;

function verifyCron(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("key");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : secret;
  if (!CRON_SECRET || token !== CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(req: Request) {
  const err = verifyCron(req);
  if (err) return err;

  const redis = getRedis();
  let processed = 0;

  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.rpop(QUEUE_BROADCAST);
    if (!raw) break;
    let payload: { event_id: string; segment_ids: string[]; body: string; channel: string };
    try {
      payload = JSON.parse(raw as string);
    } catch {
      continue;
    }

    const { event_id, segment_ids, body, channel } = payload;
    const ch = channel === "EMAIL" ? "EMAIL" : channel === "SMS" ? "sms" : "whatsapp";

    /** All guests in the selected segments (may appear in multiple segments — dedupe by phone). */
    const { data: guests } = await supabase
      .from("guests")
      .select("phone_e164")
      .eq("event_id", event_id)
      .in("segment_id", segment_ids);

    if (!guests?.length) {
      processed++;
      continue;
    }

    const seen = new Set<string>();
    for (const g of guests) {
      if (seen.has(g.phone_e164)) continue;
      seen.add(g.phone_e164);
      await redis.lpush(
        QUEUE_SEND,
        JSON.stringify({
          event_id,
          guest_phone_e164: g.phone_e164,
          channel: ch,
          body,
        })
      );
    }
    processed++;
  }

  return NextResponse.json({ processed });
}
