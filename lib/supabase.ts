/**
 * Supabase client for database (Postgres) and storage.
 * Uses the service role key for server-side access (bypasses RLS).
 * See docs/SUPABASE_SETUP.md for env vars and migration instructions.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceKey) {
  console.warn(
    "Supabase URL or service role key missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
}

/** Singleton client. Placeholder URL/key used at build time when env is missing. */
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder",
  { auth: { persistSession: false } }
);
