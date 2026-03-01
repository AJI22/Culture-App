export type RsvpStatus = "INVITED" | "YES" | "NO" | "MAYBE";
export type KnowledgeType = "FACT" | "FAQ" | "POLICY";
export type MessageDirection = "IN" | "OUT";
export type MessageChannel = "WHATSAPP" | "SMS" | "EMAIL";
export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
export type EventRoleType = "HOST" | "RSVP" | "LOGISTICS" | "SECURITY";
export type EscalationRole = "RSVP" | "LOGISTICS" | "SECURITY" | "HOST";
export type EscalationStatus = "OPEN" | "RESOLVED";

export interface Event {
  id: string;
  host_user_id: string;
  name: string;
  start_time: string;
  venue_maps_url: string | null;
  dress_code: string | null;
  notes: string | null;
  cover_image_url: string | null;
  created_at: string;
}

export interface Segment {
  id: string;
  event_id: string;
  name: string;
}

export interface EventRole {
  id: string;
  event_id: string;
  role: EventRoleType;
  phone_e164: string;
  display_name: string | null;
}

export interface Guest {
  id: string;
  event_id: string;
  segment_id: string;
  name: string;
  phone_e164: string;
  rsvp_status: RsvpStatus;
  plus_one_allowed: number;
  plus_one_count: number;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  event_id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  embedding: number[] | null;
  created_at: string;
}

export interface Message {
  id: string;
  event_id: string;
  guest_phone_e164: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string;
  twilio_message_sid: string | null;
  status: MessageStatus;
  created_at: string;
}

export interface Escalation {
  id: string;
  event_id: string;
  guest_id: string | null;
  reason: string | null;
  summary: string;
  routed_to_role: EscalationRole;
  status: EscalationStatus;
  created_at: string;
}
