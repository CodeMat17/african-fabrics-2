// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
]);

const allowedRoles = ["admin", "tailor", "beader", "consultant", "fitting_officer", "qc_officer"];

export default clerkMiddleware(async (auth, req) => {
  // Protect all dashboard routes
  if (isProtectedRoute(req)) {
    const { sessionClaims, userId } = await auth();

    // If not signed in, redirect to sign-in
    if (!sessionClaims || !userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Get user role from metadata
    const userRole = sessionClaims?.metadata?.role as string;

    // If user doesn't have an allowed role, redirect to home
    if (!allowedRoles.includes(userRole)) {
      const homeUrl = new URL("/", req.url);
      return NextResponse.redirect(homeUrl);
    }

    // Special admin route protection
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      if (userRole !== "admin") {
        const dashboardUrl = new URL("/dashboard", req.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // Role-specific route restrictions
    // const path = req.nextUrl.pathname;
    
    // Tailors can only access tailoring-related pages
    // if (userRole === "tailor" && !path.startsWith("/dashboard/tailoring")) {
    //   const tailoringUrl = new URL("/dashboard/tailoring-queue", req.url);
    //   return NextResponse.redirect(tailoringUrl);
    // }
    
    // Beaders can only access beading-related pages
    // if (userRole === "beader" && !path.startsWith("/dashboard/beading")) {
    //   const beadingUrl = new URL("/dashboard/beading-queue", req.url);
    //   return NextResponse.redirect(beadingUrl);
    // }
    
    // QC officers can only access QC-related pages
    // if (userRole === "qc_officer" && !path.startsWith("/dashboard/qc")) {
    //   const qcUrl = new URL("/dashboard/qc-queue", req.url);
    //   return NextResponse.redirect(qcUrl);
    // }
    
    // Fitting officers can only access fitting-related pages
    // if (userRole === "fitting_officer" && !path.startsWith("/dashboard/fitting")) {
    //   const fittingUrl = new URL("/dashboard/fitting-queue", req.url);
    //   return NextResponse.redirect(fittingUrl);
    // }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};