import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const PAID_COOKIE_NAME = "aide_paid";

export function hasPaidCookieValue(value?: string | null) {
  return value === "1";
}

export async function hasPaidAccessServer() {
  const store = await cookies();
  return hasPaidCookieValue(store.get(PAID_COOKIE_NAME)?.value);
}

export function hasPaidAccessRequest(request: Request | NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const found = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PAID_COOKIE_NAME}=`));

  const value = found?.split("=").at(1) ?? null;
  return hasPaidCookieValue(value);
}

export const paidCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
