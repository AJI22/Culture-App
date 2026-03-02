-- Culture App: initial schema
-- Apply in Supabase SQL Editor (or via supabase db push after linking). See docs/SUPABASE_SETUP.md.
-- Prerequisite: enable pgvector in the project (Database → Extensions, or: CREATE EXTENSION IF NOT EXISTS vector;).

-- Events: one row per event; host_user_id = Clerk user id
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  venue_maps_url TEXT,
  dress_code TEXT,
  notes TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Segments per event (2-6 per event)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(event_id, name)
);

-- Roles: HOST, RSVP, LOGISTICS, SECURITY with phone
CREATE TABLE IF NOT EXISTS event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('HOST','RSVP','LOGISTICS','SECURITY')),
  phone_e164 TEXT NOT NULL,
  display_name TEXT
);

-- Guests: per event + segment, E.164, RSVP, plus-one
CREATE TYPE rsvp_status_enum AS ENUM ('INVITED','YES','NO','MAYBE');

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  rsvp_status rsvp_status_enum NOT NULL DEFAULT 'INVITED',
  plus_one_allowed INT NOT NULL DEFAULT 0,
  plus_one_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_guests_event_phone ON guests(event_id, phone_e164);

-- Knowledge: FACT, FAQ, POLICY; optional embedding for vector search
CREATE TYPE knowledge_type_enum AS ENUM ('FACT','FAQ','POLICY');

CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type knowledge_type_enum NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension; adjust if using different model
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_event ON knowledge_items(event_id);

-- Optional: vector similarity index (pgvector)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Messages: inbound/outbound log
CREATE TYPE message_direction_enum AS ENUM ('IN','OUT');
CREATE TYPE message_channel_enum AS ENUM ('WHATSAPP','SMS','EMAIL');
CREATE TYPE message_status_enum AS ENUM ('QUEUED','SENT','DELIVERED','FAILED');

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_phone_e164 TEXT NOT NULL,
  direction message_direction_enum NOT NULL,
  channel message_channel_enum NOT NULL,
  body TEXT NOT NULL,
  twilio_message_sid TEXT,
  status message_status_enum NOT NULL DEFAULT 'QUEUED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_event ON messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_twilio_sid ON messages(twilio_message_sid) WHERE twilio_message_sid IS NOT NULL;

-- Escalations: routed to role with summary
CREATE TYPE escalation_role_enum AS ENUM ('RSVP','LOGISTICS','SECURITY','HOST');
CREATE TYPE escalation_status_enum AS ENUM ('OPEN','RESOLVED');

CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
  reason TEXT,
  summary TEXT NOT NULL,
  routed_to_role escalation_role_enum NOT NULL,
  status escalation_status_enum NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalations_event ON escalations(event_id);
