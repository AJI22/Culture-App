# Supabase setup (Postgres + Storage + pgvector)

Supabase provides the database (Postgres), file storage for event images, and pgvector for optional embedding-based retrieval.

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**, choose your organization, and set:
   - **Name**: e.g. `cultureapp`
   - **Database password**: store this securely (you need it for direct DB access).
   - **Region**: choose the one closest to your users or Vercel region.
3. Wait for the project to be provisioned.

## 2. Get API keys and URL

1. In the project dashboard, go to **Settings → API** (or **Project Settings → API**).
2. Note:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`) → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used in browser if needed)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; full access; never expose to client)

For this app, server-side code uses the **service_role** key to bypass RLS and perform host-authorized actions. The anon key can be used if you add RLS later.

## 3. Environment variables

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon public key | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Settings → API → service_role |

## 4. Enable pgvector (for embeddings)

1. In Supabase dashboard, go to **Database → Extensions**.
2. Search for **vector** (pgvector) and enable it.
3. If you don’t see it, run in **SQL Editor**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## 5. Apply database migrations

Schema is in the repo under `supabase/migrations/` (or `db/migrations/`).

1. **Option A – Supabase CLI (recommended for repeatable deploys)**  
   - Install Supabase CLI and link the project:
     ```bash
     supabase link --project-ref YOUR_PROJECT_REF
     ```
   - Project ref is in the project URL: `https://YOUR_PROJECT_REF.supabase.co`.
   - Run migrations:
     ```bash
     supabase db push
     ```
   - Or run each migration file manually in **SQL Editor** if you prefer.

2. **Option B – Manual in SQL Editor**  
   - Open **SQL Editor** in the dashboard.
   - Run each migration file in order (by timestamp/name).
   - Ensure the `vector` extension is enabled before running migrations that create `vector` columns.

## 6. Storage bucket for event images

1. Go to **Storage** in the Supabase dashboard.
2. Create a bucket, e.g. `event-covers`.
3. Set visibility:
   - **Public** if event cover images should be viewable via URL without auth.
   - Or **Private** and generate signed URLs in the app (implementation must then use signed URLs).
4. (Optional) Under **Policies**, add a policy that allows:
   - **Insert/Update**: only your backend (service_role) or authenticated users you define.
   - **Select**: public read if bucket is public, or signed URL only if private.

Document the bucket name in your app (e.g. `EVENT_COVERS_BUCKET=event-covers`) if you use an env var for it.

## 7. Schema overview (from migrations)

- **events** – event details, `host_user_id` (Clerk user id), venue_maps_url, etc.
- **segments** – per-event segments (e.g. Family, VIP).
- **event_roles** – HOST, RSVP, LOGISTICS, SECURITY with phone numbers.
- **guests** – per event/segment, phone_e164, rsvp_status, plus_one.
- **knowledge_items** – FACT / FAQ / POLICY, optional embedding for vector search.
- **messages** – inbound/outbound message log (channel, status, twilio_sid).
- **escalations** – routed to RSVP/LOGISTICS/SECURITY/HOST with summary and status.

Details are in the migration files.

## Checklist

- [ ] Supabase project created
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] pgvector extension enabled
- [ ] All migrations applied in order
- [ ] Storage bucket created for event covers (and policies set if needed)
