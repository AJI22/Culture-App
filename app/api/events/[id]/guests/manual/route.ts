/**
 * Manual guest add: one guest at a time. Body: name, phone, segment_id (required); plus_one_allowed (optional).
 * Phone is normalized to E.164. Upserts on (event_id, phone_e164) so duplicate phones update the row.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { normalizePhoneOrThrow } from "@/lib/phone";

async function ensureHost(eventId: string, userId: string) {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_user_id", userId)
    .single();
  if (!data) throw new Error("Forbidden");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: eventId } = await params;
    await ensureHost(eventId, userId);

    const body = await req.json();
    const { name, phone, segment_id, plus_one_allowed } = body;
    if (!name || !phone || !segment_id)
      return NextResponse.json(
        { error: "name, phone, segment_id required" },
        { status: 400 }
      );

    const phone_e164 = normalizePhoneOrThrow(phone);

    const { data, error } = await supabase
      .from("guests")
      .upsert(
        {
          event_id: eventId,
          segment_id,
          name,
          phone_e164,
          plus_one_allowed: plus_one_allowed ?? 0,
        },
        { onConflict: "event_id,phone_e164" }
      )
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Add guest failed" },
      { status: 500 }
    );
  }
}
