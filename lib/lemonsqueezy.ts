import crypto from "node:crypto";
import { normalizeEmail } from "@/lib/database";

const SIGNATURE_TOLERANCE_SECONDS = 300;

type StripeCheckoutSession = {
  id?: string;
  object?: string;
  customer_email?: string | null;
  customer_details?: {
    email?: string | null;
  };
  amount_total?: number | null;
  currency?: string | null;
  payment_link?: string | null;
};

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
};

function secureCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifyStripeWebhookSignature({
  payload,
  signatureHeader,
  secret,
}: {
  payload: string;
  signatureHeader: string;
  secret: string;
}) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2)
    .trim();
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3).trim())
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampNumber = Number.parseInt(timestamp, 10);
  if (Number.isNaN(timestampNumber)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNumber) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return signatures.some((signature) => secureCompare(signature, expected));
}

export function parseStripeWebhookEvent(payload: string): StripeWebhookEvent {
  const parsed = JSON.parse(payload) as Partial<StripeWebhookEvent>;

  if (
    typeof parsed.id !== "string" ||
    typeof parsed.type !== "string" ||
    typeof parsed.data !== "object" ||
    parsed.data === null ||
    typeof parsed.data.object !== "object" ||
    parsed.data.object === null
  ) {
    throw new Error("Invalid webhook payload shape.");
  }

  return parsed as StripeWebhookEvent;
}

export function extractCheckoutPurchase(event: StripeWebhookEvent) {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return null;
  }

  const session = event.data.object;
  const email = session.customer_details?.email ?? session.customer_email;

  if (!email) {
    return null;
  }

  return {
    email: normalizeEmail(email),
    amountTotal: typeof session.amount_total === "number" ? session.amount_total : null,
    currency: typeof session.currency === "string" ? session.currency : null,
    sessionId: typeof session.id === "string" ? session.id : null,
    paymentLinkId:
      typeof session.payment_link === "string" ? session.payment_link : null,
  };
}
