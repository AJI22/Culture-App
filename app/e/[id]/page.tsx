import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function GuestEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: event } = await supabase
    .from("events")
    .select("id, name, start_time, venue_maps_url, dress_code, notes")
    .eq("id", id)
    .single();

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-[#F8F4EC] px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <h1
          className="text-3xl font-semibold text-[#0F3D2E]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {event.name}
        </h1>
        <p className="mt-4 text-xl text-[#1a1a1a]">
          {new Date(event.start_time).toLocaleString()}
        </p>
        {event.dress_code && (
          <p className="mt-2 text-[#4a4a4a]">Dress: {event.dress_code}</p>
        )}
        {event.venue_maps_url && (
          <a
            href={event.venue_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C8A951] px-6 py-3 text-base font-medium text-[#0F3D2E]"
          >
            Open in Google Maps
          </a>
        )}
        {event.notes && (
          <p className="mt-6 text-left text-[#1a1a1a]">{event.notes}</p>
        )}
      </div>
    </div>
  );
}
