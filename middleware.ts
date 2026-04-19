import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PAID_COOKIE_NAME, hasPaidCookieValue } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const paidCookie = request.cookies.get(PAID_COOKIE_NAME)?.value;
  const hasAccess = hasPaidCookieValue(paidCookie);

  if (hasAccess) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/analyze-pr")) {
    return NextResponse.json(
      { error: "Payment required. Complete checkout first." },
      { status: 402 },
    );
  }

  const redirectUrl = new URL("/#pricing", request.url);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/analyze-pr"],
};
