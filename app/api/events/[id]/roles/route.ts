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

const ROLES = ["HOST", "RSVP", "LOGISTICS", "SECURITY"] as const;

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
    const { role, phone, display_name } = body;
    if (!role || !phone) return NextResponse.json({ error: "role and phone required" }, { status: 400 });
    if (!ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

    const phone_e164 = normalizePhoneOrThrow(phone);

    const { data, error } = await supabase
      .from("event_roles")
      .insert({ event_id: eventId, role, phone_e164, display_name: display_name ?? null })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create role failed" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: eventId } = await params;
    await ensureHost(eventId, userId);

    const { data, error } = await supabase
      .from("event_roles")
      .select("*")
      .eq("event_id", eventId);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "List roles failed" },
      { status: 500 }
    );
  }
}
