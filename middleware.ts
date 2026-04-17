import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/verification",
  "/stays",
  "/pricing-availability",
  "/transfers",
  "/transfer-pricing-scheduling",
  "/wallet-payouts",
  "/notifications",
  "/reports",
  "/settings",
];

const PARTNER_SESSION_COOKIE = "tm_partner_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.get(PARTNER_SESSION_COOKIE)?.value === "1";
  if (hasSessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/verification/:path*",
    "/stays/:path*",
    "/pricing-availability/:path*",
    "/transfers/:path*",
    "/transfer-pricing-scheduling/:path*",
    "/wallet-payouts/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
