/**
 * Public landing page (route: /). No auth required.
 * Markets the product and directs users to sign-in to create events. Design: docs/UI_DESIGN_SYSTEM.md.
 */
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F4EC]">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1
            className="font-heading text-4xl font-semibold tracking-tight text-[#0F3D2E] sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Refined private events, the way we gather
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-[#1a1a1a] sm:text-xl">
            A private event platform built for large, tiered gatherings. Send
            beautiful invites over WhatsApp, track RSVPs, and keep your event
            calm—without losing your attention to endless DMs.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/sign-in"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C8A951] px-6 py-3 text-base font-medium text-[#0F3D2E] shadow-sm transition hover:bg-[#b89848] focus:outline-none focus:ring-2 focus:ring-[#C8A951] focus:ring-offset-2"
            >
              Sign in to create your event
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#0F3D2E] px-6 py-3 text-base font-medium text-[#0F3D2E] transition hover:bg-[#0F3D2E] hover:text-[#F8F4EC]"
            >
              See how it works
            </a>
          </div>
        </div>
      </header>

      {/* Feature cards */}
      <section className="border-t border-[#0F3D2E]/10 bg-white/40 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2
            className="font-heading text-3xl font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Everything you need for a hosted experience
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Beautiful invites",
                desc: "Send tiered invites via WhatsApp with a clear, warm tone—guests feel hosted, not spammed.",
              },
              {
                title: "Tiered guest groups",
                desc: "Family, VIP, Friends, General—organize segments that match how you think about your guest list.",
              },
              {
                title: "RSVP tracking",
                desc: "See who said yes, no, or maybe at a glance. Plus-ones and delivery status in one place.",
              },
              {
                title: "Broadcast updates",
                desc: "Send updates to specific segments so the right people get the right message at the right time.",
              },
              {
                title: "Delegated routing",
                desc: "RSVP, Logistics, and Security leads get summarized escalations—not a flood of raw messages.",
              },
              {
                title: "Trust and accountability",
                desc: "Delivery status, broadcast logs, and escalation history so you stay in control.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-[#0F3D2E]/15 bg-[#F8F4EC]/80 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-[#0F3D2E]">
                  {f.title}
                </h3>
                <p className="mt-2 text-base text-[#1a1a1a]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[#0F3D2E]/10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2
            className="font-heading text-3xl font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            How it works
          </h2>
          <ol className="mt-10 space-y-8">
            {[
              {
                step: "1",
                title: "Invite",
                desc: "Create your event, define segments (e.g. Family, VIP, Friends), and add guests. Invites go out via WhatsApp—with SMS or email fallback if needed.",
              },
              {
                step: "2",
                title: "RSVP",
                desc: "Guests reply on WhatsApp. You see confirmed, pending, and no in one dashboard. Plus-ones are tracked per your policy.",
              },
              {
                step: "3",
                title: "Updates",
                desc: "Send broadcast updates to specific segments. Only the right people get each message—no group-chat noise.",
              },
              {
                step: "4",
                title: "Event day calm",
                desc: "Venue, time, dress code, and FAQs are answered via your event help line. Escalations go to your delegates with clear summaries, so you stay present.",
              },
            ].map((s) => (
              <li key={s.step} className="flex gap-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C8A951] text-lg font-semibold text-[#0F3D2E]">
                  {s.step}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-[#0F3D2E]">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-base text-[#1a1a1a]">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Designed for our kind of events */}
      <section className="border-t border-[#0F3D2E]/10 bg-[#0F3D2E]/5 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2
            className="font-heading text-3xl font-semibold text-[#0F3D2E]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Designed for our kind of events
          </h2>
          <p className="mt-4 max-w-3xl text-lg text-[#1a1a1a]">
            Large gatherings with guests across countries, WhatsApp as the main
            thread, and a host who deserves to enjoy the day. We built this for
            tiered cultural events where family, VIPs, and friends need different
            touchpoints—and where you need one place to see who’s in, who’s
            pending, and who needs a nudge—without drowning in messages.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#0F3D2E]/10 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Link
            href="/sign-in"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#C8A951] px-8 py-3 text-base font-medium text-[#0F3D2E] shadow-sm transition hover:bg-[#b89848]"
          >
            Sign in to create your event
          </Link>
        </div>
      </section>
    </div>
  );
}
