import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACCESS_COOKIE_NAME,
  createAccessToken,
  hasPaidEmail,
  normalizeEmail,
} from "@/lib/database";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const rawPayload = await request.json().catch(() => null);
  const payload = requestSchema.safeParse(rawPayload);

  if (!payload.success) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }

  const normalizedEmail = normalizeEmail(payload.data.email);
  if (!hasPaidEmail(normalizedEmail)) {
    return NextResponse.json(
      {
        error:
          "We do not have a completed payment for this email yet. If you just paid, wait a few seconds and try again.",
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({ ok: true, email: normalizedEmail });
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: createAccessToken(normalizedEmail),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
