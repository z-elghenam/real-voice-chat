import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/",
  "/room(.*)",
  "/api/rooms(.*)",
  "/api/stream/token(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:css|js|png|jpg|jpeg|gif|svg|ico|woff2?)).*)"],
};
