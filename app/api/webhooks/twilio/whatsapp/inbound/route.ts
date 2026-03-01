import { NextResponse } from "next/server";
import { pushToQueue, QUEUE_PROCESS_INBOUND } from "@/lib/redis";
import { getWebhookRatelimit } from "@/lib/ratelimit";
import { normalizePhone } from "@/lib/phone";

const BATCH_SIZE = 50;

export async function POST(req: Request) {
  const ratelimit = getWebhookRatelimit();
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success)
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const form = await req.formData();
    const fromRaw = form.get("From")?.toString() ?? "";
    const body = form.get("Body")?.toString() ?? "";
    const messageSid = form.get("MessageSid")?.toString();
    const to = form.get("To")?.toString() ?? "";

    const isWhatsApp = fromRaw.includes("whatsapp:") || to.includes("whatsapp:");
    const channel = isWhatsApp ? "WHATSAPP" : "SMS";
    const phoneRaw = fromRaw.replace("whatsapp:", "").trim();
    const phone_e164 = normalizePhone(phoneRaw) ?? phoneRaw;

    await pushToQueue(QUEUE_PROCESS_INBOUND, {
      phone_e164,
      body,
      twilioMessageSid: messageSid ?? undefined,
      channel,
    });
  } catch (e) {
    console.error("Twilio inbound webhook error", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
