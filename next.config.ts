/**
 * Next.js config. Wrapped with Sentry for source maps and error tracking (see docs/SENTRY_SETUP.md).
 * Cron is defined in vercel.json; job routes are secured with CRON_SECRET.
 */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});
