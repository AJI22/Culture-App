/**
 * Bulk guest import. Two modes:
 * 1) entries: array of { name?, phone } (e.g. from a contact-import flow).
 * 2) pasted_numbers: string — one number per line or comma/semicolon separated; optional "Name +123..." format.
 * No CSV file upload. Phones normalized to E.164; duplicates by phone deduped per event.
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phone";

async function ensureHost(eventId: string, userId: string) {
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("host_user_id", userId)
    .single();
  if (!data) throw new Error("Forbidden");
}

/**
 * Import guests: contact import approach or paste numbers parsing.
 * Body: { segment_id, entries: Array<{ name?, phone }> } or { segment_id, pasted_numbers: string }
 * pasted_numbers: one per line or comma/semicolon separated; name can be "Name +123..." or just "+123..."
 * We do NOT support CSV file upload.
 */
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
    const { segment_id, entries, pasted_numbers } = body;
    if (!segment_id) return NextResponse.json({ error: "segment_id required" }, { status: 400 });

    let toInsert: { name: string; phone_e164: string }[] = [];

    /** Mode 1: entries array (e.g. from contact picker). Mode 2: pasted_numbers string (see file comment). */
    if (entries && Array.isArray(entries)) {
      for (const e of entries) {
        const phone = e.phone ?? e.Phone ?? e.phone_e164;
        if (!phone) continue;
        const e164 = normalizePhone(String(phone));
        if (!e164) continue;
        const name = (e.name ?? e.Name ?? "Guest").toString().trim() || "Guest";
        toInsert.push({ name, phone_e164: e164 });
      }
    } else if (typeof pasted_numbers === "string") {
      const lines = pasted_numbers
        .split(/[\n,;]+/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      for (const line of lines) {
        const match = line.match(/^(.+?)\s*[\s+](\+?[\d\s-]+)$/);
        const name = match ? match[1].trim() : "Guest";
        const phoneRaw = match ? match[2].replace(/\s/g, "") : line;
        const e164 = normalizePhone(phoneRaw);
        if (!e164) continue;
        toInsert.push({ name: name || "Guest", phone_e164: e164 });
      }
    } else {
      return NextResponse.json(
        { error: "entries (array of {name, phone}) or pasted_numbers (string) required" },
        { status: 400 }
      );
    }

    const unique = Array.from(
      new Map(toInsert.map((g) => [g.phone_e164, g])).values()
    );
    const rows = unique.map((g) => ({
      event_id: eventId,
      segment_id,
      name: g.name,
      phone_e164: g.phone_e164,
      plus_one_allowed: 0,
    }));

    if (rows.length === 0)
      return NextResponse.json({ error: "No valid guests to import" }, { status: 400 });

    const { data, error } = await supabase
      .from("guests")
      .upsert(rows, { onConflict: "event_id,phone_e164" })
      .select("id");

    if (error) throw error;
    return NextResponse.json({ imported: data?.length ?? rows.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
