import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { pushToQueue, QUEUE_BROADCAST } from "@/lib/redis";

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
    const { segment_ids, body: messageBody, channel } = body;
    if (!messageBody || !segment_ids?.length)
      return NextResponse.json(
        { error: "body and segment_ids (array) required" },
        { status: 400 }
      );

    const ch = (channel ?? "WHATSAPP").toUpperCase();
    if (!["WHATSAPP", "SMS", "EMAIL"].includes(ch))
      return NextResponse.json({ error: "channel must be WHATSAPP, SMS, or EMAIL" }, { status: 400 });

    await pushToQueue(QUEUE_BROADCAST, {
      event_id: eventId,
      segment_ids,
      body: messageBody,
      channel: ch,
    });

    return NextResponse.json({ ok: true, message: "Broadcast queued" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Broadcast failed" },
      { status: 500 }
    );
  }
}
