import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)", "/api/events(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect host dashboard and event admin APIs (not webhooks - those are public)
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
