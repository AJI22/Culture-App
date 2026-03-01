# Sentry setup (errors, tracing, breadcrumbs)

Sentry is used for error reporting, optional performance tracing, and log breadcrumbs so you can debug production issues.

## 1. Create a Sentry account and project

1. Go to [https://sentry.io](https://sentry.io) and sign up or sign in.
2. Create a new project and choose **Next.js** as the platform.
3. Sentry will show a **DSN** (Data Source Name), e.g. `https://xxxx@xxxx.ingest.sentry.io/xxxx`. This is the client key used by the frontend and backend.

## 2. Environment variables

| Variable | Description | Where to find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (public; used by client and server) | Project Settings → Client Keys (DSN) |
| `SENTRY_ORG` | Sentry organization slug | URL or Organization Settings |
| `SENTRY_PROJECT` | Sentry project slug | Project Settings |
| `SENTRY_AUTH_TOKEN` | Auth token for uploads (source maps, etc.) | Settings → Auth Tokens (create with project:releases scope) |

For local development you can set only `NEXT_PUBLIC_SENTRY_DSN`; the rest are needed for release uploads and optional server-side options.

## 3. Next.js integration

The app uses `@sentry/nextjs`. Typical setup:

- **sentry.client.config.ts** – initializes Sentry in the browser (errors, breadcrumbs).
- **sentry.server.config.ts** – initializes Sentry for server-side (API routes, server components).
- **sentry.edge.config.ts** – optional; for Edge runtime if you use it.
- **next.config.ts** – Sentry webpack plugin for source maps and release injection (with `SENTRY_AUTH_TOKEN` and org/project).

Build and deploy will upload source maps if `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are set.

## 4. What is captured

- **Errors**: Unhandled exceptions and `captureException()` calls.
- **Breadcrumbs**: Key actions (e.g. “Inbound message received”, “Escalation created”) so you can see the path to an error. Do not overcomplicate; only log useful steps.
- **Tracing**: Optional; can be enabled for API routes and page loads. Start with errors + breadcrumbs if you want to keep the MVP simple.

## 5. Required settings in Sentry (verify in UI)

- **Project → Settings → Inbound Filters**: Adjust if you want to filter out certain errors or environments.
- **Alerts**: Optional; create alerts for new issues or error rate spikes.
- **Release tracking**: Enabled when you set release in the SDK (e.g. from `VERCEL_GIT_COMMIT_SHA`); requires auth token and build-time env for source maps.

## 6. Checklist

- [ ] Sentry account and Next.js project created
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in env
- [ ] Optional: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` set for source maps and releases
- [ ] sentry.client.config.ts and sentry.server.config.ts (and edge if used) in place
- [ ] next.config.ts wrapped with Sentry plugin as per Sentry Next.js docs
