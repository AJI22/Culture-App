/**
 * Knowledge items API: FAQs, facts, and policies per event.
 * Used by the WhatsApp intelligence engine to answer guest questions; only answers from this context (no hallucination).
 * Types: FACT, FAQ, POLICY. Optional: embedding for pgvector similarity search (not set here).
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

async function ensureHost(eventId: string, userId: string) {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_user_id", userId)
    .single();
  if (!data) throw new Error("Forbidden");
}

const TYPES = ["FACT", "FAQ", "POLICY"] as const;

/** Create a knowledge item. Body: type, title, content. */
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
    const { type, title, content } = body;
    if (!type || !title || !content)
      return NextResponse.json(
        { error: "type, title, content required" },
        { status: 400 }
      );
    if (!TYPES.includes(type))
      return NextResponse.json({ error: "type must be FACT, FAQ, or POLICY" }, { status: 400 });

    const { data, error } = await supabase
      .from("knowledge_items")
      .insert({ event_id: eventId, type, title, content })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create knowledge item failed" },
      { status: 500 }
    );
  }
}

/** List all knowledge items for the event (newest first). */
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
      .from("knowledge_items")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "List knowledge failed" },
      { status: 500 }
    );
  }
}
