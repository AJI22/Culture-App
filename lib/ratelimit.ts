/**
 * Rate limiting for public webhook endpoints (Twilio inbound + status callback).
 * Protects against abuse; uses same Upstash Redis as queues. Returns null if Redis not configured.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

/** 100 requests per 60 seconds per identifier (e.g. IP). Applied in webhook route handlers. */
export function getWebhookRatelimit() {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: false,
  });
}
