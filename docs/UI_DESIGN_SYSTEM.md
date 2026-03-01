# UI design system

This document locks the cultural UI requirements for the product. All host dashboard and guest-facing UI must follow it.

## Design philosophy

- **Warm, celebratory, communal, elegant, structured, confident.** Not corporate. Not sterile. Not minimalist tech.
- The product is a **refined private event experience platform** (Partiful-like for our kind of events). AI is invisible plumbing; do not call it an “AI assistant” in copy. Use “Event messages”, “Event help line”, or “Event concierge” only if needed.

## Color system

| Role | Hex | Usage |
|------|-----|--------|
| Primary (Deep Royal Green) | `#0F3D2E` | Headings, primary buttons outline, key UI elements, nav |
| Accent Gold | `#C8A951` | Primary CTA buttons, VIP/metric highlights, hover accents, step indicators |
| Background (Warm Ivory) | `#F8F4EC` | Page background, card backgrounds |
| Optional Burgundy | `#6A1E2D` | Optional accent (e.g. alerts, secondary emphasis) |
| Optional Royal Blue | `#1F3C88` | Optional accent (e.g. links, secondary actions) |
| Foreground | `#1a1a1a` | Body text |
| Muted | Dark gray (e.g. `#4a4a4a`) | Secondary text |

Avoid sterile gray systems. Prefer warm neutrals and the palette above.

## Typography

- **Headings**: Playfair Display or Cormorant Garamond. Readable, medium weight. Use for hero, section titles, card titles.
- **Body**: Inter or Source Sans Pro. Minimum 16px for body text. Medium weight where appropriate.
- High legibility; clear hierarchy. No light gray on white for important text.

## Host dashboard UX

- **Above-the-fold**: Confirmed count, Pending count, Segment breakdown, Escalations (count or list), Broadcast button. Use **gold highlight** for VIP/headline metrics.
- **Segment visualization**: Distinct color-coded segments (not CRM-like tagging). Each segment has a clear label and count.
- **Trust signals**: Delivery status visible, broadcast logs, escalation history, clear accountability.
- **Mobile-first**: Full mobile dashboard, thumb-friendly controls, responsive layout, no tiny buttons.

## Guest experience

- **Event details page** (if provided): Large event title, date/time centered, **“Open in Google Maps”** button (uses stored `venue_maps_url`), clean layout, no clutter, warm tone. No guest login required.
- **WhatsApp tone**: Respectful, slightly formal, warm. Not emoji-heavy, not robotic.

## Microinteractions

- Smooth transitions on buttons and links.
- **Gold hover accents** on primary actions and key links.
- Clear confirmation feedback after actions (e.g. “Broadcast queued”, “Guest added”).
- Clear escalation acknowledgement (e.g. “This has been passed to the RSVP lead”).

## Accessibility

- Minimum 16px body text.
- High contrast: avoid low-contrast gray on white for critical content.
- Clear hierarchy (heading levels, spacing).
- Focus states for keyboard and assistive tech.

## Brand positioning

- Private event platform: refined, prestigious, culturally aware.
- Not a chatbot product. Not an “AI tool.” The value is hosted, calm, organized events with WhatsApp-native communication and delegated routing.

## Implementation notes

- Use Tailwind with CSS variables or theme extension for the palette (e.g. `--primary: #0F3D2E`, `--accent-gold: #C8A951`, `--background: #F8F4EC`).
- Load Playfair Display and Cormorant Garamond for headings; Inter or Source Sans 3 for body (e.g. via Next.js `next/font/google`).
- Buttons: primary CTA = gold background, primary text; secondary = primary (green) border and text, hover fill.
- Cards: warm ivory or white with subtle border (e.g. primary/10); no cold grays.
