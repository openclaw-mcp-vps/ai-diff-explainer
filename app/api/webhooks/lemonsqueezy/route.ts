import { NextResponse } from "next/server";
import { PAID_COOKIE_NAME, paidCookieOptions } from "@/lib/auth";
import {
  extractBuyerEmail,
  extractEventName,
  extractOrderId,
  hasRecordedPurchase,
  recordPurchase,
  verifyLemonSignature,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkoutState = url.searchParams.get("checkout");
  const orderId = url.searchParams.get("order_id");

  if (checkoutState !== "success") {
    return NextResponse.redirect(new URL("/#pricing", request.url));
  }

  if (orderId) {
    const isKnownOrder = await hasRecordedPurchase(orderId);
    if (!isKnownOrder) {
      return NextResponse.redirect(new URL("/?payment=pending", request.url));
    }
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(PAID_COOKIE_NAME, "1", paidCookieOptions);
  return response;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventName = extractEventName(payload);
  const orderId = extractOrderId(payload);
  const email = extractBuyerEmail(payload);

  if (orderId) {
    await recordPurchase({
      orderId,
      eventName,
      email,
      createdAt: new Date().toISOString(),
    });
  }

  return Response.json({ ok: true });
}
