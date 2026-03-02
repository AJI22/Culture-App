/**
 * Event detail page (route: /app/events/[id]). Server component: loads event, segments, guests, escalations, roles
 * for the signed-in host, then renders EventDashboard with above-the-fold counts (confirmed, pending).
 * Redirects to /app if not host or event not found.
 */
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EventDashboard from "./EventDashboard";

async function getEvent(id: string, userId: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("host_user_id", userId)
    .single();
  return data;
}

async function getSegments(eventId: string) {
  const { data } = await supabase
    .from("segments")
    .select("*")
    .eq("event_id", eventId)
    .order("name");
  return data ?? [];
}

async function getGuests(eventId: string) {
  const { data } = await supabase
    .from("guests")
    .select("*")
    .eq("event_id", eventId);
  return data ?? [];
}

async function getEscalations(eventId: string) {
  const { data } = await supabase
    .from("escalations")
    .select("*")
    .eq("event_id", eventId)
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

async function getRoles(eventId: string) {
  const { data } = await supabase
    .from("event_roles")
    .select("*")
    .eq("event_id", eventId);
  return data ?? [];
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;

  const [event, segments, guests, escalations, roles] = await Promise.all([
    getEvent(id, userId),
    getSegments(id),
    getGuests(id),
    getEscalations(id),
    getRoles(id),
  ]);

  if (!event) redirect("/app");

  const confirmed = guests.filter((g: { rsvp_status: string }) => g.rsvp_status === "YES").length;
  const pending = guests.filter((g: { rsvp_status: string }) => g.rsvp_status === "INVITED").length;

  return (
    <div className="min-h-screen bg-[#F8F4EC]">
      <header className="border-b border-[#0F3D2E]/15 bg-white/60 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/app"
            className="text-lg font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            ← Back to events
          </Link>
        </div>
      </header>

      <EventDashboard
        event={event}
        segments={segments}
        guests={guests}
        escalations={escalations}
        roles={roles}
        confirmedCount={confirmed}
        pendingCount={pending}
      />
    </div>
  );
}
