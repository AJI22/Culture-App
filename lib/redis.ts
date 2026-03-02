/**
 * Upstash Redis client for queues and optional conversation state.
 * Queues: queue:send (outbound messages), queue:process_inbound (inbound to process),
 * queue:broadcast (broadcast jobs). Cron jobs pop from these; see docs/ARCHITECTURE.md.
 * See docs/UPSTASH_SETUP.md for env vars.
 */
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  url && token ? new Redis({ url, token }) : (null as Redis | null);

export function getRedis(): Redis {
  if (!redis) throw new Error("Upstash Redis not configured");
  return redis;
}

/** Outbound message jobs (Twilio/Resend); consumed by send-outbound cron. */
export const QUEUE_SEND = "queue:send";
/** Inbound message jobs; consumed by process-inbound cron (AI + escalation). */
export const QUEUE_PROCESS_INBOUND = "queue:process_inbound";
/** Broadcast jobs (expand by segment, then enqueue send); consumed by process-broadcasts cron. */
export const QUEUE_BROADCAST = "queue:broadcast";

/** Push a job to the left of the list (LIFO for same-key; we consume from right). */
export async function pushToQueue<T>(queueKey: string, payload: T): Promise<void> {
  const r = getRedis();
  await r.lpush(queueKey, JSON.stringify(payload));
}

/** Pop one job from the right. Returns null if queue empty or payload invalid. */
export async function popFromQueue<T>(queueKey: string): Promise<T | null> {
  const r = getRedis();
  const raw = await r.rpop(queueKey);
  if (raw == null) return null;
  try {
    return JSON.parse(raw as string) as T;
  } catch {
    return null;
  }
}

/** Pop up to n jobs from the right. Used by cron to process a batch. */
export async function popNFromQueue<T>(
  queueKey: string,
  n: number
): Promise<T[]> {
  const r = getRedis();
  const results: T[] = [];
  for (let i = 0; i < n; i++) {
    const raw = await r.rpop(queueKey);
    if (raw == null) break;
    try {
      results.push(JSON.parse(raw as string) as T);
    } catch {
      /* skip malformed */
    }
  }
  return results;
}
