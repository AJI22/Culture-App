# Vercel setup (deploy, env vars, cron)

The app is deployed on Vercel. Background work is done by Vercel Cron invoking Next.js API routes.

## 1. Connect the repository

1. Go to [https://vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New** → **Project** and import the repo (e.g. `cultureapp`).
3. Set the root directory to the project root (where `package.json` and `next.config.ts` are).
4. Do not deploy yet until env vars are set (or deploy once to get the URL, then add env and redeploy).

## 2. Environment variables

In **Project → Settings → Environment Variables**, add every variable required by the app. Use the same names as in the README and in each vendor doc. Summary:

| Variable | Required | Notes |
|----------|----------|--------|
| Clerk | Yes | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`; optional redirect URLs |
| Supabase | Yes | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Twilio | Yes | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_SMS_FROM` |
| Resend | Yes | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Upstash | Yes | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| OpenAI | Yes | `OPENAI_API_KEY` |
| Sentry | Optional | `NEXT_PUBLIC_SENTRY_DSN`; for releases: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` |
| Cron auth | Yes | `CRON_SECRET` (see below) |

Set them for **Production** (and optionally Preview/Development if you use Vercel for those).

## 3. Cron secret (required for job routes)

Cron endpoints must be called only by Vercel Cron (or your own scheduler), not by the public. Use a shared secret:

1. Generate a random string (e.g. `openssl rand -hex 32`) and set it as `CRON_SECRET` in Vercel env.
2. In **vercel.json** (or the config you use for cron), you cannot pass custom headers from Vercel Cron; the recommended approach is to use **Vercel Cron’s built-in auth** or pass the secret in a header. Vercel Cron can send a request with a secret in the **Authorization** header or a custom header (e.g. `x-cron-secret`). Your job routes must verify this header and reject requests without the correct `CRON_SECRET`.
3. Document in this file: “Job routes expect `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`.” Configure the cron to send that header if your plan supports it. (Vercel Cron on Pro plan allows custom headers — verify in Vercel docs for your plan.)

If Vercel Cron cannot send custom headers, alternatives: (a) protect the route with a long random path (e.g. `/api/jobs/process-inbound?key=<CRON_SECRET>`) and validate the query param server-side, or (b) run a separate cron service that sends the header. For this doc we assume a header or query param with `CRON_SECRET` is validated by the app.

## 4. Vercel Cron configuration

Define cron jobs in **vercel.json** at the project root:

```json
{
  "crons": [
    {
      "path": "/api/jobs/process-inbound",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/jobs/send-outbound",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/jobs/process-broadcasts",
      "schedule": "*/3 * * * *"
    }
  ]
}
```

- **process-inbound**: every minute (`* * * * *`).
- **send-outbound**: every minute.
- **process-broadcasts**: every 2–5 minutes; example uses every 3 minutes (`*/3 * * * *`).

Vercel will POST to these paths on the schedule. Your routes must return 200 for success and verify the cron secret (header or query) so only the scheduler can run them.

## 5. Exact schedule summary

| Endpoint | Schedule (cron expr) | Description |
|----------|----------------------|-------------|
| `/api/jobs/process-inbound` | `* * * * *` | Every minute |
| `/api/jobs/send-outbound` | `* * * * *` | Every minute |
| `/api/jobs/process-broadcasts` | `*/3 * * * *` | Every 3 minutes (or `*/2` / `*/5` as needed) |

## 6. Webhook URLs after deploy

After the first deploy, note your production URL (e.g. `https://cultureapp.vercel.app`). Then:

- Set Twilio inbound webhook to: `https://<your-domain>/api/webhooks/twilio/whatsapp/inbound`
- Set Twilio status callback when sending: `https://<your-domain>/api/webhooks/twilio/status`
- Update Clerk **Domains** with your production URL.

## 7. Checklist

- [ ] Project connected to repo and deployed
- [ ] All env vars set (Clerk, Supabase, Twilio, Resend, Upstash, OpenAI, Sentry, CRON_SECRET)
- [ ] `vercel.json` contains the three crons with the schedules above
- [ ] Job routes validate CRON_SECRET (header or query)
- [ ] Twilio webhooks and Clerk domains updated to production URL
