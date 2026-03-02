/**
 * Single event API: fetch one event by id. Caller must be the host (ensureHost).
 * Used by event detail page and API consumers that need full event record.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

/** Verify the signed-in user is the host of this event; throw Forbidden otherwise. */
async function ensureHost(eventId: string, userId: string) {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_user_id", userId)
    .single();
  if (!data) throw new Error("Forbidden");
}

/** Get event by id. Returns 404 if not found or not host. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: eventId } = await params;
    await ensureHost(eventId, userId);

    const { data: event, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error || !event) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(event);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 }
    );
  }
}
