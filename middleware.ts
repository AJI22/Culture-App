/**
 * Global middleware: Clerk auth. Protects /app and /api/events/* so only signed-in hosts can access.
 * Does NOT protect /api/webhooks/* (Twilio) or /api/jobs/* (cron uses CRON_SECRET in the route).
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/api/events(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req) && !req.nextUrl.pathname.startsWith("/api/webhooks")) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ico|woff2?|map)).*)",
    "/(api|trpc)(.*)",
  ],
};
