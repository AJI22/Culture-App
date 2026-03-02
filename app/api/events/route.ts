/**
 * Events API: create and list events for the signed-in host.
 * Protected by Clerk; host_user_id is set from auth(). Used by dashboard /app and /app/events/new.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

/** Create a new event. Body: name, start_time (required); venue_maps_url, dress_code, notes, cover_image_url (optional). */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, start_time, venue_maps_url, dress_code, notes, cover_image_url } = body;
    if (!name || !start_time)
      return NextResponse.json(
        { error: "name and start_time required" },
        { status: 400 }
      );

    const { data, error } = await supabase
      .from("events")
      .insert({
        host_user_id: userId,
        name,
        start_time: new Date(start_time).toISOString(),
        venue_maps_url: venue_maps_url ?? null,
        dress_code: dress_code ?? null,
        notes: notes ?? null,
        cover_image_url: cover_image_url ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create event failed" },
      { status: 500 }
    );
  }
}

/** List all events for the signed-in host (most recent first). */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("host_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "List events failed" },
      { status: 500 }
    );
  }
}
