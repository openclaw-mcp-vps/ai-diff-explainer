import { NextResponse } from "next/server";
import { recordStripePurchase } from "@/lib/database";
import {
  extractCheckoutPurchase,
  parseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET environment variable." },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get("stripe-signature");
  if (!signatureHeader) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const isValid = verifyStripeWebhookSignature({
    payload,
    signatureHeader,
    secret: webhookSecret,
  });

  if (!isValid) {
    return NextResponse.json(
      { error: "Stripe webhook signature verification failed." },
      { status: 400 }
    );
  }

  try {
    const event = parseStripeWebhookEvent(payload);
    const purchase = extractCheckoutPurchase(event);

    if (purchase) {
      recordStripePurchase({
        email: purchase.email,
        stripeEventId: event.id,
        amountTotal: purchase.amountTotal,
        currency: purchase.currency,
        sessionId: purchase.sessionId,
        paymentLinkId: purchase.paymentLinkId,
      });
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Webhook payload parsing failed." },
      { status: 400 }
    );
  }
}
