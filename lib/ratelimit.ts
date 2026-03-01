import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export function getWebhookRatelimit() {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: false,
  });
}
