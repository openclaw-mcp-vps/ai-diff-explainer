import crypto from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

const DATA_FILE = path.join(process.cwd(), "data", "purchases.json");

export type PurchaseRecord = {
  orderId: string;
  eventName: string;
  email?: string;
  createdAt: string;
};

type PurchaseStore = {
  purchases: PurchaseRecord[];
};

async function ensureStore(): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    const initial: PurchaseStore = { purchases: [] };
    await writeFile(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readStore(): Promise<PurchaseStore> {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as PurchaseStore;
    if (!Array.isArray(parsed.purchases)) {
      return { purchases: [] };
    }
    return parsed;
  } catch {
    return { purchases: [] };
  }
}

async function writeStore(store: PurchaseStore): Promise<void> {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function getCheckoutUrl() {
  const raw = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID?.trim();
  if (!raw) return null;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return `https://checkout.lemonsqueezy.com/buy/${raw}`;
}

function withRedirectParams(url: string, successUrl: string, cancelUrl?: string) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("checkout[success_url]", successUrl);
    if (cancelUrl) {
      parsed.searchParams.set("checkout[cancel_url]", cancelUrl);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function createCheckoutUrl(options: { successUrl: string; cancelUrl?: string }) {
  const fallback = getCheckoutUrl();

  const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
  const variantId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey || !storeId || !variantId) {
    return fallback ? withRedirectParams(fallback, options.successUrl, options.cancelUrl) : null;
  }

  lemonSqueezySetup({ apiKey });

  const checkout = (await createCheckout(Number(storeId), Number(variantId), {
    checkoutOptions: {
      embed: true,
      media: false,
      logo: false,
    },
    checkoutData: {
      custom: {
        source: "ai-diff-explainer",
      },
    },
  })) as unknown as {
    data?: {
      data?: {
        attributes?: {
          url?: string;
        };
      };
    };
    error?: unknown;
  };

  const checkoutUrl = checkout.data?.data?.attributes?.url ?? fallback;
  if (!checkoutUrl) {
    return null;
  }

  return withRedirectParams(checkoutUrl, options.successUrl, options.cancelUrl);
}

export function verifyLemonSignature(rawBody: string, signature?: string | null) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const incoming = Buffer.from(signature, "utf8");
  const computed = Buffer.from(digest, "utf8");

  if (incoming.length !== computed.length) return false;
  return crypto.timingSafeEqual(incoming, computed);
}

export async function recordPurchase(record: PurchaseRecord) {
  const store = await readStore();
  const exists = store.purchases.some((item) => item.orderId === record.orderId);
  if (!exists) {
    store.purchases.push(record);
    await writeStore(store);
  }
}

export async function hasRecordedPurchase(orderId?: string | null) {
  if (!orderId) return false;
  const store = await readStore();
  return store.purchases.some((item) => item.orderId === orderId);
}

export function extractOrderId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as {
    data?: { id?: string; attributes?: { order_id?: number | string } };
    meta?: { custom_data?: { order_id?: string } };
  };

  const attrOrderId = data.data?.attributes?.order_id;
  if (typeof attrOrderId === "number") return String(attrOrderId);
  if (typeof attrOrderId === "string" && attrOrderId.length > 0) return attrOrderId;

  const dataId = data.data?.id;
  if (typeof dataId === "string" && dataId.length > 0) return dataId;

  const customOrderId = data.meta?.custom_data?.order_id;
  if (typeof customOrderId === "string" && customOrderId.length > 0) return customOrderId;

  return null;
}

export function extractEventName(payload: unknown) {
  if (!payload || typeof payload !== "object") return "unknown";
  const data = payload as { meta?: { event_name?: string } };
  return data.meta?.event_name ?? "unknown";
}

export function extractBuyerEmail(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as {
    data?: {
      attributes?: {
        user_email?: string;
        customer_email?: string;
      };
    };
  };

  return data.data?.attributes?.user_email ?? data.data?.attributes?.customer_email;
}
