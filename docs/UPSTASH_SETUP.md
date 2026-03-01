# Upstash setup (Redis + rate limiting + queues)

Upstash Redis is used for: (1) queues (`queue:send`, `queue:process_inbound`, `queue:broadcast`), (2) rate limiting on public webhook endpoints, and (3) optional lightweight conversation state.

## 1. Create an Upstash account

1. Go to [https://console.upstash.com](https://console.upstash.com) and sign up (e.g. with GitHub or email).
2. Log in to the Upstash Console.

## 2. Create a Redis database

1. In the console click **Create Database** (or **Redis** → **Create** — verify in console UI).
2. Set:
   - **Name**: e.g. `cultureapp`
   - **Region**: choose one close to your Vercel region (e.g. same as your serverless functions).
   - **Type**: Standard (or as needed for your plan).
3. Create the database and wait for it to be ready.

## 3. Get REST URL and token

1. Open the database and go to the **REST API** or **Details** tab.
2. You will see:
   - **UPSTASH_REDIS_REST_URL** (e.g. `https://xxxxx.upstash.io`)
   - **UPSTASH_REDIS_REST_TOKEN** (long string)

These are used by the Upstash Redis REST client (no TCP connection needed), which works well with serverless.

## 4. Environment variables

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `UPSTASH_REDIS_REST_URL` | Redis REST endpoint | Database → REST API / Details |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token | Database → REST API / Details |

## 5. Rate limiting (Upstash Ratelimit)

The app uses `@upstash/ratelimit` with the same Redis database to limit requests to public webhook endpoints (e.g. Twilio inbound). This protects against abuse and ensures Twilio webhooks don’t get overwhelmed.

- No separate Upstash product is required; rate limiting uses the same Redis instance.
- Configuration (limits per identifier, window) is in the app code (e.g. 100 requests per 60 seconds per IP or per webhook path — adjust as needed).

## 6. Queues (implementation detail)

The app implements three logical queues using Redis lists or streams:

- **queue:send** – outbound message jobs (Twilio/Resend send).
- **queue:process_inbound** – inbound message processing (AI + escalation + reply).
- **queue:broadcast** – broadcast jobs (expand by segment, then enqueue send jobs).

Cron workers (Vercel Cron) call the job API routes, which pop from these queues and process. Exact key names and payload format are in the code; ensure no other system uses the same key names if you share Redis.

## 7. Optional: conversation state

Lightweight per-guest conversation state (e.g. last intent, last escalation) can be stored in Redis with short TTL keys (e.g. `conv:{event_id}:{phone_e164}`). Same Redis instance; keys are documented in the implementation.

## Checklist

- [ ] Upstash account created
- [ ] Redis database created in a suitable region
- [ ] `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set in env
- [ ] Rate limiting and queue keys are only used by this app (or namespaced)
