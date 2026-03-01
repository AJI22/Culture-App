"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [venueMapsUrl, setVenueMapsUrl] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          start_time: startTime,
          venue_maps_url: venueMapsUrl || undefined,
          dress_code: dressCode || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create event");
      router.push(`/app/events/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F4EC]">
      <header className="border-b border-[#0F3D2E]/15 bg-white/60 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/app"
            className="text-lg font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1
          className="text-2xl font-semibold text-[#0F3D2E]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Create event
        </h1>
        <p className="mt-1 text-[#4a4a4a]">Set up in under five minutes.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#0F3D2E]">
              Event name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-[#0F3D2E]">
              Date & time *
            </label>
            <input
              id="start_time"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
          </div>
          <div>
            <label htmlFor="venue" className="block text-sm font-medium text-[#0F3D2E]">
              Google Maps link (for &quot;Open in Google Maps&quot;)
            </label>
            <input
              id="venue"
              type="url"
              placeholder="https://maps.google.com/..."
              value={venueMapsUrl}
              onChange={(e) => setVenueMapsUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
          </div>
          <div>
            <label htmlFor="dress" className="block text-sm font-medium text-[#0F3D2E]">
              Dress code
            </label>
            <input
              id="dress"
              type="text"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[#0F3D2E]">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2 text-[#1a1a1a]"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#C8A951] px-6 py-2.5 font-medium text-[#0F3D2E] transition hover:bg-[#b89848] disabled:opacity-70"
            >
              {loading ? "Creating…" : "Create event"}
            </button>
            <Link
              href="/app"
              className="rounded-lg border-2 border-[#0F3D2E] px-6 py-2.5 font-medium text-[#0F3D2E] transition hover:bg-[#0F3D2E] hover:text-[#F8F4EC]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
