"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function RolesPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [roles, setRoles] = useState<{ id: string; role: string; phone_e164: string; display_name: string | null }[]>([]);
  const [role, setRole] = useState("RSVP");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/events/${id}/roles`)
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => setRoles([]));
  }, [id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !phone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, phone: phone.trim(), display_name: displayName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPhone("");
      setDisplayName("");
      setRoles((prev) => [...prev, { id: data.id, role, phone_e164: phone.trim(), display_name: displayName.trim() || null }]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!id) return null;

  return (
    <div className="min-h-screen bg-[#F8F4EC]">
      <header className="border-b border-[#0F3D2E]/15 bg-white/60 px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <Link href={`/app/events/${id}`} className="text-lg font-semibold text-[#0F3D2E]">
            ← Back to event
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#0F3D2E]" style={{ fontFamily: "var(--font-playfair), serif" }}>
          Manage roles
        </h1>
        <p className="mt-1 text-[#4a4a4a]">Assign RSVP, Logistics, Security, or Host delegates with their phone numbers.</p>

        <form onSubmit={handleAdd} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0F3D2E]">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
            >
              <option value="HOST">HOST</option>
              <option value="RSVP">RSVP</option>
              <option value="LOGISTICS">LOGISTICS</option>
              <option value="SECURITY">SECURITY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F3D2E]">Phone (E.164)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0F3D2E]">Display name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#0F3D2E]/25 bg-white px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#C8A951] px-4 py-2 font-medium text-[#0F3D2E] disabled:opacity-70"
          >
            {loading ? "Adding…" : "Add role"}
          </button>
        </form>

        <ul className="mt-8 space-y-2">
          {roles.map((r) => (
            <li key={r.id} className="rounded-lg border border-[#0F3D2E]/15 bg-white/80 p-3">
              <span className="font-medium text-[#0F3D2E]">{r.role}</span>
              {r.display_name && <span> — {r.display_name}</span>}
              <span className="text-[#4a4a4a]"> {r.phone_e164}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
