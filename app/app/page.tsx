import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function getEvents(userId: string) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("host_user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AppDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const events = await getEvents(userId);

  return (
    <div className="min-h-screen bg-[#F8F4EC]">
      <header className="border-b border-[#0F3D2E]/15 bg-white/60 px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-lg font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Event platform
          </Link>
          <Link
            href="/app/events/new"
            className="rounded-lg bg-[#C8A951] px-4 py-2 text-sm font-medium text-[#0F3D2E] transition hover:bg-[#b89848]"
          >
            Create Event
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1
          className="text-2xl font-semibold text-[#0F3D2E]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Your events
        </h1>

        {events.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#0F3D2E]/15 bg-white/80 p-8 text-center">
            <p className="text-[#1a1a1a]">You don’t have any events yet.</p>
            <Link
              href="/app/events/new"
              className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C8A951] px-6 py-3 text-base font-medium text-[#0F3D2E]"
            >
              Create your first event
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev: { id: string; name: string; start_time: string }) => (
              <li key={ev.id}>
                <Link
                  href={`/app/events/${ev.id}`}
                  className="block rounded-xl border border-[#0F3D2E]/15 bg-white/80 p-6 shadow-sm transition hover:border-[#C8A951]/50 hover:shadow"
                >
                  <h2 className="font-semibold text-[#0F3D2E]">{ev.name}</h2>
                  <p className="mt-1 text-sm text-[#4a4a4a]">
                    {new Date(ev.start_time).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
