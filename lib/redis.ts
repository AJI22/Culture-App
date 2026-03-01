import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis =
  url && token ? new Redis({ url, token }) : (null as Redis | null);

export function getRedis(): Redis {
  if (!redis) throw new Error("Upstash Redis not configured");
  return redis;
}

export const QUEUE_SEND = "queue:send";
export const QUEUE_PROCESS_INBOUND = "queue:process_inbound";
export const QUEUE_BROADCAST = "queue:broadcast";

export async function pushToQueue<T>(queueKey: string, payload: T): Promise<void> {
  const r = getRedis();
  await r.lpush(queueKey, JSON.stringify(payload));
}

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
