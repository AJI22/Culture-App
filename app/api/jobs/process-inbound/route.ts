import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getRedis, QUEUE_PROCESS_INBOUND, QUEUE_SEND } from "@/lib/redis";
import { normalizePhone } from "@/lib/phone";
import {
  classifyIntent,
  generateResponse,
  summarizeForEscalation,
  type IntentType,
} from "@/lib/whatsapp-engine";
import type { EscalationRole } from "@/lib/db-types";

const CRON_SECRET = process.env.CRON_SECRET;
const BATCH_SIZE = 10;

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
  const processed: string[] = [];

  for (let i = 0; i < BATCH_SIZE; i++) {
    const raw = await redis.rpop(QUEUE_PROCESS_INBOUND);
    if (!raw) break;
    let payload: { phone_e164: string; body: string; twilioMessageSid?: string; channel: string };
    try {
      payload = JSON.parse(raw as string);
    } catch {
      continue;
    }

    const { phone_e164, body, twilioMessageSid, channel } = payload;
    const normalized = normalizePhone(phone_e164) ?? phone_e164;

    try {
      const { data: guests } = await supabase
        .from("guests")
        .select("id, event_id, segment_id, name, plus_one_allowed, plus_one_count, rsvp_status")
        .eq("phone_e164", normalized);

      type GuestRow = { id: string; event_id: string; segment_id: string; name: string; plus_one_allowed: number; plus_one_count: number; rsvp_status: string };
      let eventId: string | null = null;
      let guest: GuestRow | null = null;
      if (guests && guests.length === 1) {
        guest = guests[0] as GuestRow;
        eventId = guest.event_id;
      } else if (guests && guests.length > 1) {
        const convKey = `conv:${normalized}`;
        const lastEvent = await redis.get(convKey);
        const match = guests.find((g) => g.event_id === lastEvent);
        guest = (match ?? guests[0]) as GuestRow;
        eventId = guest.event_id;
        await redis.set(convKey, eventId, { ex: 60 * 60 * 24 * 7 });
      }

      if (!eventId || !guest) {
        const reply =
          "We couldn't find your invitation for this number. Please contact the host directly.";
        await redis.lpush(
          QUEUE_SEND,
          JSON.stringify({
            event_id: null,
            guest_phone_e164: normalized,
            channel: channel === "WHATSAPP" ? "whatsapp" : "sms",
            body: reply,
          })
        );
        processed.push(normalized);
        continue;
      }

      const { data: event } = await supabase
        .from("events")
        .select("id, name, start_time, venue_maps_url, dress_code, notes")
        .eq("id", eventId)
        .single();
      if (!event) continue;

      const eventContext = `Event: ${event.name}, start: ${event.start_time}, venue: ${event.venue_maps_url ?? "N/A"}, dress: ${event.dress_code ?? "N/A"}`;

      const { data: knowledge } = await supabase
        .from("knowledge_items")
        .select("type, title, content")
        .eq("event_id", eventId);
      const contextParts = [eventContext];
      knowledge?.forEach((k) => {
        contextParts.push(`[${k.type}] ${k.title}: ${k.content}`);
      });
      const retrievedContext = contextParts.join("\n\n");

      const intent = await classifyIntent(body, eventContext);

      if (intent.intent === "EMERGENCY") {
        intent.suggested_action = "ESCALATE";
        intent.escalation_target = "SECURITY";
      }

      let reply: string;
      let needsEscalation = false;
      let escalationSummary: string | undefined;
      let escalationTarget: EscalationRole | undefined;

      if (intent.suggested_action === "ESCALATE" || (intent.confidence < 0.6 && intent.intent !== "OTHER")) {
        needsEscalation = true;
        escalationTarget = intent.escalation_target ?? "HOST";
        escalationSummary = await summarizeForEscalation(body, intent.intent, escalationTarget);
        reply =
          "Thank you for your message. This has been passed to the right person, who will get back to you shortly.";
      } else {
        const gen = await generateResponse(body, intent, retrievedContext);
        reply = gen.final_reply;
        if (gen.needs_escalation && gen.escalation_summary) {
          needsEscalation = true;
          escalationSummary = gen.escalation_summary;
          escalationTarget = (intent.escalation_target ?? "HOST") as EscalationRole;
        }
      }

      if (intent.intent === "RSVP" && intent.confidence >= 0.7) {
        const lower = body.toLowerCase();
        let newStatus: "YES" | "NO" | "MAYBE" | null = null;
        if (/\b(yes|coming|attend|will be there)\b/.test(lower)) newStatus = "YES";
        else if (/\b(no|can't|cannot|won't)\b/.test(lower)) newStatus = "NO";
        else if (/\b(maybe|unsure)\b/.test(lower)) newStatus = "MAYBE";
        if (newStatus && guest)
          await supabase.from("guests").update({ rsvp_status: newStatus }).eq("id", guest.id);
      }

      if (needsEscalation && escalationTarget && escalationSummary) {
        await supabase.from("escalations").insert({
          event_id: eventId,
          guest_id: guest?.id ?? null,
          reason: intent.intent,
          summary: escalationSummary,
          routed_to_role: escalationTarget,
          status: "OPEN",
        });
      }

      await supabase.from("messages").insert({
        event_id: eventId,
        guest_phone_e164: normalized,
        direction: "IN",
        channel,
        body,
        twilio_message_sid: twilioMessageSid ?? null,
        status: "DELIVERED",
      });

      await redis.lpush(
        QUEUE_SEND,
        JSON.stringify({
          event_id: eventId,
          guest_phone_e164: normalized,
          channel: channel === "WHATSAPP" ? "whatsapp" : "sms",
          body: reply,
        })
      );
      processed.push(normalized);
    } catch (e) {
      console.error("process-inbound error", e);
    }
  }

  return NextResponse.json({ processed: processed.length });
}
