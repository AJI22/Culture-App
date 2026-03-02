"use client";

/**
 * Event dashboard: single-event view for hosts. Shows above-the-fold metrics (confirmed, pending, escalations),
 * segment breakdown, open escalations, roles, guests, and modals for broadcast, add guest, import, add segment, add FAQ.
 * Uses design tokens from docs/UI_DESIGN_SYSTEM.md. All mutations go through /api/events/[id]/... routes.
 */
import { useState } from "react";
import Link from "next/link";

/** Optional segment name → Tailwind classes for color-coded segment badges (see UI_DESIGN_SYSTEM). */
const SEGMENT_COLORS: Record<string, string> = {
  Family: "bg-[#6A1E2D]/20 text-[#6A1E2D]",
  VIP: "bg-[#C8A951]/30 text-[#0F3D2E]",
  Friends: "bg-[#1F3C88]/20 text-[#1F3C88]",
  General: "bg-[#0F3D2E]/15 text-[#0F3D2E]",
};

function segmentColor(name: string) {
  return SEGMENT_COLORS[name] ?? "bg-[#0F3D2E]/15 text-[#0F3D2E]";
}

export default function EventDashboard({
  event,
  segments,
  guests,
  escalations,
  roles,
  confirmedCount,
  pendingCount,
}: {
  event: { id: string; name: string; start_time: string; venue_maps_url?: string | null };
  segments: { id: string; name: string }[];
  guests: { id: string; segment_id: string; name: string; phone_e164: string; rsvp_status: string }[];
  escalations: { id: string; summary: string; routed_to_role: string; status: string }[];
  roles: { id: string; role: string; phone_e164: string; display_name?: string | null }[];
  confirmedCount: number;
  pendingCount: number;
}) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSegments, setBroadcastSegments] = useState<string[]>([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualSegment, setManualSegment] = useState("");
  const [manualPlusOne, setManualPlusOne] = useState(0);
  const [manualLoading, setManualLoading] = useState(false);
  const [pastedNumbers, setPastedNumbers] = useState("");
  const [importSegment, setImportSegment] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [knowledge, setKnowledge] = useState<{ id: string; type: string; title: string; content: string }[]>([]);
  const [knowType, setKnowType] = useState("FAQ");
  const [knowTitle, setKnowTitle] = useState("");
  const [knowContent, setKnowContent] = useState("");
  const [knowLoading, setKnowLoading] = useState(false);

  const segmentCounts = segments.map((s) => ({
    ...s,
    count: guests.filter((g) => g.segment_id === s.id).length,
  }));

  async function handleBroadcast() {
    if (!broadcastBody.trim() || broadcastSegments.length === 0) return;
    setBroadcastLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_ids: broadcastSegments,
          body: broadcastBody,
          channel: "WHATSAPP",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setBroadcastOpen(false);
      setBroadcastBody("");
      setBroadcastSegments([]);
      alert("Broadcast queued. Recipients will receive it shortly.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to send broadcast");
    } finally {
      setBroadcastLoading(false);
    }
  }

  async function handleAddGuest() {
    if (!manualName.trim() || !manualPhone.trim() || !manualSegment) return;
    setManualLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/guests/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          phone: manualPhone,
          segment_id: manualSegment,
          plus_one_allowed: manualPlusOne,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAddGuestOpen(false);
      setManualName("");
      setManualPhone("");
      setManualSegment("");
      setManualPlusOne(0);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add guest");
    } finally {
      setManualLoading(false);
    }
  }

  async function loadKnowledge() {
    try {
      const res = await fetch(`/api/events/${event.id}/knowledge`);
      const data = await res.json();
      if (Array.isArray(data)) setKnowledge(data);
    } catch {
      setKnowledge([]);
    }
  }

  async function handleAddKnowledge() {
    if (!knowTitle.trim() || !knowContent.trim()) return;
    setKnowLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: knowType, title: knowTitle, content: knowContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setKnowTitle("");
      setKnowContent("");
      loadKnowledge();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setKnowLoading(false);
    }
  }

  async function handleAddSegment() {
    if (!newSegmentName.trim() || segments.length >= 6) return;
    setSegmentLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/segments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSegmentName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setNewSegmentName("");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add segment");
    } finally {
      setSegmentLoading(false);
    }
  }

  async function handleImport() {
    if (!pastedNumbers.trim() || !importSegment) return;
    setImportLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/guests/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment_id: importSegment,
          pasted_numbers: pastedNumbers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setImportOpen(false);
      setPastedNumbers("");
      setImportSegment("");
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to import");
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1
        className="text-2xl font-semibold text-[#0F3D2E]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        {event.name}
      </h1>
      <p className="mt-1 text-[#4a4a4a]">
        {new Date(event.start_time).toLocaleString()}
      </p>

      {/* Above-the-fold: metrics + broadcast */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#C8A951]/40 bg-[#C8A951]/10 p-4">
          <p className="text-sm font-medium text-[#0F3D2E]">Confirmed</p>
          <p className="text-2xl font-semibold text-[#0F3D2E]">{confirmedCount}</p>
        </div>
        <div className="rounded-xl border border-[#0F3D2E]/15 bg-white/80 p-4">
          <p className="text-sm font-medium text-[#0F3D2E]">Pending</p>
          <p className="text-2xl font-semibold text-[#0F3D2E]">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-[#0F3D2E]/15 bg-white/80 p-4">
          <p className="text-sm font-medium text-[#0F3D2E]">Escalations</p>
          <p className="text-2xl font-semibold text-[#0F3D2E]">{escalations.length}</p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            className="w-full rounded-lg bg-[#C8A951] py-3 font-medium text-[#0F3D2E] transition hover:bg-[#b89848]"
          >
            Broadcast update
          </button>
        </div>
      </div>

      {/* Segment breakdown */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0F3D2E]">Segments</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {segmentCounts.map((s) => (
            <span
              key={s.id}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${segmentColor(s.name)}`}
            >
              {s.name}: {s.count}
            </span>
          ))}
          {segments.length < 6 && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddSegment(); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="New segment name"
                className="rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={segmentLoading || !newSegmentName.trim()}
                className="rounded-lg bg-[#0F3D2E] px-3 py-1.5 text-sm font-medium text-[#F8F4EC] disabled:opacity-70"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Escalations */}
      {escalations.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-[#0F3D2E]">Open escalations</h2>
          <ul className="mt-3 space-y-2">
            {escalations.map((e) => (
              <li
                key={e.id}
                className="rounded-lg border border-[#0F3D2E]/15 bg-white/80 p-3 text-sm"
              >
                <p className="text-[#1a1a1a]">{e.summary}</p>
                <p className="mt-1 text-[#4a4a4a]">Routed to: {e.routed_to_role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Roles */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0F3D2E]">Roles</h2>
        <p className="mt-1 text-sm text-[#4a4a4a]">
          RSVP, Logistics, Security leads receive summarized escalations.
        </p>
        <ul className="mt-3 space-y-2">
          {roles.map((r) => (
            <li key={r.id} className="rounded-lg border border-[#0F3D2E]/15 bg-white/80 p-3 text-sm">
              <span className="font-medium text-[#0F3D2E]">{r.role}</span>
              {r.display_name && <span> — {r.display_name}</span>}
              <span className="text-[#4a4a4a]"> {r.phone_e164}</span>
            </li>
          ))}
        </ul>
        <Link
          href={`/app/events/${event.id}/roles`}
          className="mt-2 inline-block text-sm font-medium text-[#0F3D2E] hover:text-[#C8A951]"
        >
          Manage roles →
        </Link>
      </section>

      {/* Guests */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0F3D2E]">Guests</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAddGuestOpen(true)}
            className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-[#F8F4EC]"
          >
            Add guest
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-[#F8F4EC]"
          >
            Import (paste numbers)
          </button>
        </div>
        <p className="mt-2 text-sm text-[#4a4a4a]">
          One number per line or comma-separated. Optional: &quot;Name +123...&quot;
        </p>
        <ul className="mt-4 space-y-2">
          {guests.slice(0, 30).map((g) => (
            <li key={g.id} className="flex justify-between rounded-lg border border-[#0F3D2E]/10 bg-white/60 px-3 py-2 text-sm">
              <span className="font-medium text-[#1a1a1a]">{g.name}</span>
              <span className="text-[#4a4a4a]">{g.rsvp_status}</span>
            </li>
          ))}
        </ul>
        {guests.length > 30 && (
          <p className="mt-2 text-sm text-[#4a4a4a]">+{guests.length - 30} more</p>
        )}
      </section>

      {/* Broadcast modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#F8F4EC] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0F3D2E]">Broadcast update</h3>
            <p className="mt-1 text-sm text-[#4a4a4a]">Select segments and enter message (WhatsApp).</p>
            <div className="mt-4 space-y-2">
              {segments.map((s) => (
                <label key={s.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={broadcastSegments.includes(s.id)}
                    onChange={(e) =>
                      setBroadcastSegments((prev) =>
                        e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                      )
                    }
                  />
                  <span className="text-[#1a1a1a]">{s.name}</span>
                </label>
              ))}
            </div>
            <textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              rows={4}
              placeholder="Your message..."
              className="mt-4 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={broadcastLoading || !broadcastBody.trim() || broadcastSegments.length === 0}
                className="rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-medium text-[#0F3D2E] disabled:opacity-70"
              >
                {broadcastLoading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add guest modal */}
      {addGuestOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#F8F4EC] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0F3D2E]">Add guest</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Name</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Phone (E.164 or with country code)</label>
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Segment</label>
                <select
                  value={manualSegment}
                  onChange={(e) => setManualSegment(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
                >
                  <option value="">Select</option>
                  {segments.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Plus-ones allowed</label>
                <input
                  type="number"
                  min={0}
                  value={manualPlusOne}
                  onChange={(e) => setManualPlusOne(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAddGuestOpen(false)}
                className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddGuest}
                disabled={manualLoading || !manualName.trim() || !manualPhone.trim() || !manualSegment}
                className="rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-medium text-[#0F3D2E] disabled:opacity-70"
              >
                {manualLoading ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge modal */}
      {knowledgeOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#F8F4EC] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0F3D2E]">Add FAQ / fact / policy</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Type</label>
                <select value={knowType} onChange={(e) => setKnowType(e.target.value)} className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2">
                  <option value="FAQ">FAQ</option>
                  <option value="FACT">FACT</option>
                  <option value="POLICY">POLICY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Title</label>
                <input type="text" value={knowTitle} onChange={(e) => setKnowTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0F3D2E]">Content</label>
                <textarea value={knowContent} onChange={(e) => setKnowContent(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setKnowledgeOpen(false)} className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E]">Cancel</button>
              <button type="button" onClick={handleAddKnowledge} disabled={knowLoading || !knowTitle.trim() || !knowContent.trim()} className="rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-medium text-[#0F3D2E] disabled:opacity-70">{knowLoading ? "Adding…" : "Add"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {importOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#F8F4EC] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#0F3D2E]">Import guests</h3>
            <p className="mt-1 text-sm text-[#4a4a4a]">Paste numbers (one per line or comma/semicolon). Optional: &quot;Name +123...&quot;</p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0F3D2E]">Segment</label>
              <select
                value={importSegment}
                onChange={(e) => setImportSegment(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
              >
                <option value="">Select</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <textarea
              value={pastedNumbers}
              onChange={(e) => setPastedNumbers(e.target.value)}
              rows={6}
              placeholder="+2348012345678&#10;Jane +2348098765432&#10;..."
              className="mt-3 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importLoading || !pastedNumbers.trim() || !importSegment}
                className="rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-medium text-[#0F3D2E] disabled:opacity-70"
              >
                {importLoading ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge / FAQs */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[#0F3D2E]">Event FAQs &amp; facts</h2>
        <p className="mt-1 text-sm text-[#4a4a4a]">These are used to answer guest questions on WhatsApp.</p>
        <button
          type="button"
          onClick={() => { setKnowledgeOpen(true); loadKnowledge(); }}
          className="mt-2 rounded-lg border-2 border-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-[#F8F4EC]"
        >
          Add FAQ / fact / policy
        </button>
        {knowledge.length > 0 && (
          <ul className="mt-3 space-y-2">
            {knowledge.slice(0, 10).map((k) => (
              <li key={k.id} className="rounded-lg border border-[#0F3D2E]/10 bg-white/60 px-3 py-2 text-sm">
                <span className="font-medium text-[#0F3D2E]">[{k.type}] {k.title}</span>
                <p className="mt-1 text-[#4a4a4a]">{k.content.length > 80 ? `${k.content.slice(0, 80)}…` : k.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Open in Google Maps */}
      {event.venue_maps_url && (
        <div className="mt-8">
          <a
            href={event.venue_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg bg-[#0F3D2E] px-4 py-2 text-sm font-medium text-[#F8F4EC] hover:bg-[#0F3D2E]/90"
          >
            Open in Google Maps
          </a>
        </div>
      )}
    </main>
  );
}
