/**
 * Resend client for email delivery (invite/broadcast fallback when WhatsApp/SMS not used).
 * See docs/RESEND_SETUP.md for API key and verified domain.
 */
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;
const fromName = process.env.RESEND_FROM_NAME || "Event Invites";

const resend = apiKey ? new Resend(apiKey) : null;

export function getResendClient(): Resend {
  if (!resend) throw new Error("Resend not configured: RESEND_API_KEY missing");
  return resend;
}

/** Format "Display Name <email>" for the from header; required by Resend. */
export function getFromAddress(): string {
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL not set");
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}

/** Send a single transactional email (e.g. broadcast with channel EMAIL). */
export async function sendEmail(to: string, subject: string, html: string) {
  const client = getResendClient();
  return client.emails.send({
    from: getFromAddress(),
    to: [to],
    subject,
    html,
  });
}
