import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getWebhookRatelimit } from "@/lib/ratelimit";

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
    const messageSid = form.get("MessageSid")?.toString();
    const status = form.get("MessageStatus")?.toString();
    if (!messageSid) return NextResponse.json({ error: "MessageSid required" }, { status: 400 });

    const map: Record<string, string> = {
      delivered: "DELIVERED",
      failed: "FAILED",
      sent: "SENT",
      undelivered: "FAILED",
    };
    const dbStatus = map[status?.toLowerCase() ?? ""] ?? "SENT";

    const { error } = await supabase
      .from("messages")
      .update({ status: dbStatus })
      .eq("twilio_message_sid", messageSid);

    if (error) throw error;
  } catch (e) {
    console.error("Twilio status webhook error", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
