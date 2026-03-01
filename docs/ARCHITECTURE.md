# Architecture

## Overview

The app is a WhatsApp-native private event platform: hosts create events, define segments and roles, add guests, and send invites/broadcasts. Guests interact mainly via WhatsApp; an event concierge (AI-backed) answers FAQs from event knowledge and escalates to delegates when needed. All outbound and inbound messages are queued and processed by background jobs triggered by Vercel Cron.

## High-level flows

### 1. Inbound WhatsApp → queue → AI decision → outbound send

1. **Twilio receives an inbound WhatsApp (or SMS) message** and POSTs to `POST /api/webhooks/twilio/whatsapp/inbound` (public, rate-limited).
2. **Webhook handler** validates the request (Twilio signature optional but recommended), normalizes the sender phone to E.164, and **pushes a job onto the Redis queue `queue:process_inbound`** with payload e.g. `{ eventId?, phone_e164, body, twilioMessageSid, channel }`. The webhook returns 200 quickly so Twilio does not retry.
3. **Cron** runs every minute and calls `POST /api/jobs/process-inbound`. The job handler **pops N items** from `queue:process_inbound`, and for each:
   - **Identity resolution**: Map `phone_e164` to a guest (and segment) for an event. If multiple events, use conversation state or heuristics to disambiguate; if unknown, follow unknown-guest flow (e.g. ask name or instruct to contact host).
   - **Intent classification** (OpenAI): Structured JSON with intent (RSVP, VENUE, TIME, DRESS_CODE, PARKING, PLUS_ONE, SCHEDULE, CONTACT, EMERGENCY, OTHER), confidence, suggested_action (ANSWER, CLARIFY, ESCALATE), escalation_target.
   - **Context retrieval**: Load event facts (name, venue_maps_url, start_time, dress_code, notes) and segment-scoped knowledge_items (FACT, FAQ, POLICY). If pgvector is enabled, optionally retrieve top-K knowledge_items by embedding similarity.
   - **Response generation** (OpenAI): Only from retrieved context; output final_reply, needs_escalation, escalation_summary.
   - **Confidence gating and deterministic escalation**: EMERGENCY → SECURITY immediately; low confidence → CLARIFY (one question) or ESCALATE by category; PLUS_ONE beyond policy → RSVP; other sensitive/unclear → escalate with summary.
   - **Conversation memory**: Update lightweight per-guest state (Redis or DB) to avoid loops.
   - **Automation**: If intent is RSVP and message indicates yes/no/maybe, update guest rsvp_status; if plus_one and allowed, update plus_one_count; else escalate.
   - **Outbound reply**: Enqueue a send job on `queue:send` with the reply text and channel (WhatsApp/SMS). Optionally create an **escalation** record (reason, summary, routed_to_role, status OPEN) and notify delegate (e.g. enqueue a send to the role’s phone or send email — implementation-specific).
4. **Cron** runs every minute and calls `POST /api/jobs/send-outbound`. The handler **pops N items** from `queue:send`, and for each calls Twilio (WhatsApp or SMS) or Resend (email), records the message in `messages` with status QUEUED → SENT, and sets `statusCallback` so Twilio can report delivery.
5. **Twilio status callback**: When delivery status changes, Twilio POSTs to `POST /api/webhooks/twilio/status`. The handler updates the `messages` row (e.g. status → DELIVERED or FAILED) by `twilio_message_sid`.

### 2. Cron job processing

- **process-inbound** (every minute): Consumes `queue:process_inbound`; identity → intent → retrieval → response → gating → escalation → enqueue send; persist messages and escalations.
- **send-outbound** (every minute): Consumes `queue:send`; call Twilio/Resend; insert/update `messages`; set status callback for Twilio.
- **process-broadcasts** (every 2–5 minutes): Consumes `queue:broadcast`; for each broadcast job (event_id, segment_ids, body, channel), expand recipients from `guests` by segment; enqueue one send job per recipient on `queue:send`.

All job routes must be protected (e.g. `CRON_SECRET` in header or query) so only the scheduler can invoke them.

### 3. Escalation routing

- Escalations are stored in `escalations` (event_id, guest_id, reason, summary, routed_to_role, status).
- EMERGENCY → SECURITY; PLUS_ONE policy → RSVP; other categories → RSVP / LOGISTICS / SECURITY / HOST per intent and config.
- Delegates receive a **summarized** escalation (not raw message spam). Implementation can be: send WhatsApp/SMS to the role’s phone from `event_roles` with the summary, or an in-dashboard view only; MVP can do both (dashboard + optional outbound to delegate phone).

### 4. Broadcast flow

- Host composes a broadcast in the dashboard: selects event, segments, body, channel (WhatsApp preferred).
- `POST /api/events/:id/broadcast` creates a **broadcast job** and pushes to `queue:broadcast` with { event_id, segment_ids, body, channel }.
- **process-broadcasts** job expands segment_ids to guest list (event_id + segment_id in list), then for each guest enqueues a send job on `queue:send` with the same body and channel. Sends are then processed by **send-outbound**.

### 5. Logging and metrics

- **Messages**: Every inbound and outbound message is stored in `messages` (event_id, guest_phone_e164, direction, channel, body, twilio_message_sid, status, created_at). Status is updated via Twilio status callback.
- **Escalations**: All escalations are stored with summary and routed_to_role; status OPEN/RESOLVED.
- **Sentry**: Errors and breadcrumbs (e.g. “Inbound received”, “Escalation created”) for debugging. No secrets in breadcrumbs.
- **Trust signals**: Dashboard shows delivery status, broadcast history, and escalation history so hosts have accountability.

## Data flow summary

- **Host** → Dashboard (Clerk) → Create event, segments, roles, guests, knowledge_items, broadcast → APIs write to Supabase and push to Redis where needed.
- **Guest** → WhatsApp → Twilio → Webhook → queue:process_inbound → Cron → AI + DB → queue:send → Cron → Twilio → Guest.
- **Twilio** → Status callback → Webhook → Update `messages.status`.
- **Cron** → process-inbound, send-outbound, process-broadcasts → Redis queues + Supabase + Twilio/Resend.

## Queue payloads (reference)

- **queue:process_inbound**: `{ eventId?, phone_e164, body, twilioMessageSid?, channel }`
- **queue:send**: `{ event_id, guest_phone_e164, channel, body, message_type? }` (and optionally message row id for status updates)
- **queue:broadcast**: `{ event_id, segment_ids[], body, channel }`
