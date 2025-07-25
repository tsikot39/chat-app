import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages and static assets
        if (
          req.nextUrl.pathname.startsWith("/auth/") ||
          req.nextUrl.pathname.startsWith("/_next/") ||
          req.nextUrl.pathname.startsWith("/api/auth") ||
          req.nextUrl.pathname === "/favicon.ico" ||
          req.nextUrl.pathname.startsWith("/favicon") ||
          req.nextUrl.pathname.startsWith("/icon-") ||
          req.nextUrl.pathname.startsWith("/manifest.json")
        ) {
          return true;
        }

        // Allow access to the home page (landing page)
        if (req.nextUrl.pathname === "/") {
          return true;
        }

        // For other protected pages, require authentication
        return !!token?.email;
      },
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon|manifest).*)"],
};
