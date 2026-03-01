# Culture App — Refined private event platform

A WhatsApp-native private event platform for large, tiered cultural gatherings (e.g. Nigerian/African diaspora). Hosts create events, define segments (2–6), assign roles (RSVP, Logistics, Security), add guests, and send invites and broadcasts via WhatsApp (with SMS/email fallback). Guests interact via WhatsApp; an event concierge answers FAQs from event knowledge and escalates to delegates with summaries.

**Positioning:** A refined private event experience platform (Partiful-like for our kind of events). AI is invisible plumbing—never called an “AI assistant” in the UI.

## Tech stack

- **Frontend & backend:** Next.js (App Router), TypeScript
- **Auth:** Clerk
- **Database & storage:** Supabase (Postgres, Storage, pgvector)
- **Messaging:** Twilio (WhatsApp + SMS), Resend (email)
- **Queues & rate limiting:** Upstash Redis
- **AI:** OpenAI (intent, response generation, summarization, optional embeddings)
- **Errors/tracing:** Sentry
- **Phone normalization:** libphonenumber-js
- **Hosting & cron:** Vercel + Vercel Cron
- **Maps:** Google Maps link only (“Open in Google Maps” button)—no maps SDK

## Repository structure

- `/app` — Next.js App Router (landing, sign-in, dashboard, event pages)
- `/app/api` — API routes (events, segments, roles, guests, broadcast, webhooks, cron jobs)
- `/lib` — Clients (Supabase, Twilio, Resend, OpenAI, Upstash, phone) and WhatsApp engine
- `/components` — Reusable UI (optional; dashboard uses inline components)
- `/docs` — Vendor setup guides and architecture
- `/supabase/migrations` — SQL migrations

## Documentation

Vendor-specific setup (required env vars, step-by-step, webhooks, cron):

- [Clerk](/docs/CLERK_SETUP.md)
- [Supabase (Postgres + Storage + pgvector)](/docs/SUPABASE_SETUP.md)
- [Twilio (WhatsApp + SMS + webhooks)](/docs/TWILIO_SETUP.md)
- [Resend](/docs/RESEND_SETUP.md)
- [Upstash (Redis + rate limiting + queues)](/docs/UPSTASH_SETUP.md)
- [Sentry](/docs/SENTRY_SETUP.md)
- [OpenAI](/docs/OPENAI_SETUP.md)
- [Vercel (deploy + env + cron)](/docs/VERCEL_SETUP.md)

Other docs:

- [Architecture](/docs/ARCHITECTURE.md) — Flows: inbound → queue → AI → outbound; cron; escalation; broadcast; logging
- [UI design system](/docs/UI_DESIGN_SYSTEM.md) — Colors, fonts, tone, mobile-first, trust signals

Secrets are not managed by the app; use env vars only. See `.env.example` and each vendor doc for placeholders and instructions.

---

## How to run locally

1. **Clone and install**
   ```bash
   cd cultureapp
   npm install
   ```

2. **Environment variables**  
   Copy `.env.example` to `.env.local` and fill in values (placeholders are fine for a dry run; see `/docs` for each service):
   - Clerk (sign-in/sign-up and dashboard protection)
   - Supabase (DB + optional storage)
   - Twilio (WhatsApp sandbox + SMS for sends and webhooks)
   - Resend (email fallback)
   - Upstash Redis (queues + webhook rate limiting)
   - OpenAI (intent + responses + optional embeddings)
   - `CRON_SECRET` (for local cron simulation; e.g. `openssl rand -hex 32`)

3. **Database**  
   Apply migrations (see [Supabase setup](/docs/SUPABASE_SETUP.md)):
   - Enable pgvector in the Supabase project.
   - Run the SQL in `supabase/migrations/20250301000001_initial_schema.sql` (e.g. in Supabase SQL Editor or via `supabase db push` if linked).

4. **Run the app**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). You’ll see the **landing page** → “Sign in to create your event” → Clerk sign-in → after sign-in you’re redirected to **/app** (dashboard). From there you can create events, add segments (2–6), roles, guests (manual or paste numbers), and broadcast.  
   If you run or build without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (valid `pk_...`), the app still builds and runs but sign-in will not work until Clerk is configured.

5. **Webhooks (Twilio)**  
   For inbound WhatsApp/SMS and status callbacks, expose your dev server (e.g. ngrok) and set the Twilio webhook URLs to your tunnel (see [Twilio setup](/docs/TWILIO_SETUP.md)).

6. **Cron (background jobs)**  
   Locally, Vercel Cron doesn’t run. Either:
   - Call the job endpoints manually with the same secret you set in `CRON_SECRET`:
     - `POST /api/jobs/process-inbound` (Header: `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`)
     - `POST /api/jobs/send-outbound`
     - `POST /api/jobs/process-broadcasts`
   - Or use a scheduler (e.g. cron on your machine or a small script) that POSTs to these URLs with the secret.

---

## Deploy to Vercel

1. **Connect repo**  
   Import the project in the Vercel dashboard (root = repo root).

2. **Environment variables**  
   In Project → Settings → Environment Variables, add every variable from `.env.example` and from each vendor doc (Clerk, Supabase, Twilio, Resend, Upstash, OpenAI, Sentry, `CRON_SECRET`). Use the same names.

3. **Cron**  
   `vercel.json` defines three crons. See [Vercel setup](/docs/VERCEL_SETUP.md) for the exact schedule and how to secure job routes with `CRON_SECRET` (header or query).

4. **After first deploy**
   - Set Twilio inbound webhook and status callback URLs to your Vercel domain (e.g. `https://your-app.vercel.app/api/webhooks/twilio/whatsapp/inbound` and `.../api/webhooks/twilio/status`).
   - Add your production domain in Clerk.
   - Optionally set `NEXT_PUBLIC_APP_URL` to your Vercel URL so status callbacks use the correct base URL.

5. **Build**
   ```bash
   npm run build
   ```
   Fix any build errors (missing env may cause warnings; ensure required vars are set in Vercel).

---

## Flow summary

- **Landing** (`/`) → marketing, “Sign in to create your event” → Clerk sign-in → **Dashboard** (`/app`).
- **Dashboard** → Create event → Add segments (2–6) → Add roles → Add guests (manual or paste numbers) → Broadcast by segment.
- **Guests** → Receive invites/broadcasts via WhatsApp (or SMS/email). Reply on WhatsApp → Twilio webhook → inbound queue → cron processes: identity → intent → retrieval → response → escalation when needed → outbound queue → cron sends via Twilio/Resend; status callback updates message status.
- **Trust** → Delivery status, broadcast logs, escalation history in the dashboard.

No payments, seating maps, vendor management, marketplace, social feed, or ticketing in this MVP.
