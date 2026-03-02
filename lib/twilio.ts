/**
 * Twilio client for WhatsApp and SMS.
 * Used for outbound invites, broadcasts, and bot replies; inbound handled via webhooks.
 * See docs/TWILIO_SETUP.md for sandbox/production setup and webhook URLs.
 */
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const smsFrom = process.env.TWILIO_SMS_FROM;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export type OutboundChannel = "whatsapp" | "sms";

export function getTwilioClient() {
  if (!client) throw new Error("Twilio not configured: missing credentials");
  return client;
}

export function getWhatsAppFrom(): string {
  if (!whatsappFrom) throw new Error("TWILIO_WHATSAPP_FROM not set");
  return whatsappFrom;
}

export function getSmsFrom(): string {
  if (!smsFrom) throw new Error("TWILIO_SMS_FROM not set");
  return smsFrom;
}

/** Resolve the "from" number for a given channel (WhatsApp vs SMS). */
export function getFromForChannel(channel: OutboundChannel): string {
  return channel === "whatsapp" ? getWhatsAppFrom() : getSmsFrom();
}

/** Send WhatsApp message. To number must be E.164; Twilio expects whatsapp:+... for WhatsApp API. */
export async function sendWhatsApp(
  toE164: string,
  body: string,
  statusCallback?: string
) {
  const c = getTwilioClient();
  const from = getWhatsAppFrom();
  const to = from.startsWith("whatsapp:") ? `whatsapp:${toE164}` : toE164;
  return c.messages.create({
    from,
    to: to.startsWith("whatsapp:") ? to : `whatsapp:${to}`,
    body,
    statusCallback,
  });
}

/** Send SMS. To and from are E.164. */
export async function sendSms(
  toE164: string,
  body: string,
  statusCallback?: string
) {
  const c = getTwilioClient();
  return c.messages.create({
    from: getSmsFrom(),
    to: toE164,
    body,
    statusCallback,
  });
}
