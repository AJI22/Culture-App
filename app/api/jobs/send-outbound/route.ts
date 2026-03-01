import { NextResponse } from "next/server";
import { getRedis, QUEUE_SEND } from "@/lib/redis";
import { sendWhatsApp, sendSms } from "@/lib/twilio";
import { sendEmail } from "@/lib/resend";
import { supabase } from "@/lib/supabase";

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 20;
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3000";

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
  const statusCallback = `${BASE_URL}/api/webhooks/twilio/status`;
  let sent = 0;

  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.rpop(QUEUE_SEND);
    if (!raw) break;
    let payload: {
      event_id: string | null;
      guest_phone_e164: string;
      channel: string;
      body: string;
    };
    try {
      payload = JSON.parse(raw as string);
    } catch {
      continue;
    }

    const { event_id, guest_phone_e164, channel, body } = payload;
    try {
      const { data: msgRow } = await supabase
        .from("messages")
        .insert({
          event_id: event_id ?? null,
          guest_phone_e164,
          direction: "OUT",
          channel: channel === "whatsapp" ? "WHATSAPP" : channel === "sms" ? "SMS" : "EMAIL",
          body,
          status: "QUEUED",
        })
        .select("id")
        .single();

      let sid: string | undefined;
      if (channel === "whatsapp") {
        const res = await sendWhatsApp(guest_phone_e164, body, statusCallback);
        sid = res.sid;
      } else if (channel === "sms") {
        const res = await sendSms(guest_phone_e164, body, statusCallback);
        sid = res.sid;
      } else if (channel === "EMAIL") {
        await sendEmail(guest_phone_e164, "Event update", body);
        if (msgRow?.id)
          await supabase.from("messages").update({ status: "SENT" }).eq("id", msgRow.id);
        sent++;
        continue;
      }

      if (msgRow?.id && sid)
        await supabase
          .from("messages")
          .update({ twilio_message_sid: sid, status: "SENT" })
          .eq("id", msgRow.id);
      sent++;
    } catch (e) {
      console.error("send-outbound error", e);
      if (payload.event_id) {
        await supabase.from("messages").insert({
          event_id: payload.event_id,
          guest_phone_e164,
          direction: "OUT",
          channel: payload.channel === "whatsapp" ? "WHATSAPP" : "SMS",
          body,
          status: "FAILED",
        });
      }
    }
  }

  return NextResponse.json({ sent });
}
