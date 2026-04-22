import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ACCESS_COOKIE_NAME = "ai_diff_access";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

export type PurchaseRecord = {
  email: string;
  stripeEventId: string;
  purchasedAt: string;
  amountTotal: number | null;
  currency: string | null;
  sessionId: string | null;
  paymentLinkId: string | null;
};

export type UsageRecord = {
  email: string;
  prUrl: string;
  repository: string;
  analyzedAt: string;
};

type DataStore = {
  purchases: PurchaseRecord[];
  usage: UsageRecord[];
};

const DEFAULT_STORE: DataStore = {
  purchases: [],
  usage: [],
};

function ensureStoreFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

function readStore(): DataStore {
  ensureStoreFile();

  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DataStore>;

    return {
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      usage: Array.isArray(parsed.usage) ? parsed.usage : [],
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function writeStore(store: DataStore) {
  ensureStoreFile();

  const tempPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tempPath, STORE_PATH);
}

function secureCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function getAccessSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "dev-secret-change-before-prod";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hasPaidEmail(email: string) {
  const normalized = normalizeEmail(email);
  const store = readStore();

  return store.purchases.some((purchase) => purchase.email === normalized);
}

export function recordStripePurchase({
  email,
  stripeEventId,
  amountTotal,
  currency,
  sessionId,
  paymentLinkId,
}: {
  email: string;
  stripeEventId: string;
  amountTotal: number | null;
  currency: string | null;
  sessionId: string | null;
  paymentLinkId: string | null;
}) {
  const normalized = normalizeEmail(email);
  const store = readStore();

  if (store.purchases.some((purchase) => purchase.stripeEventId === stripeEventId)) {
    return false;
  }

  store.purchases.push({
    email: normalized,
    stripeEventId,
    purchasedAt: new Date().toISOString(),
    amountTotal,
    currency,
    sessionId,
    paymentLinkId,
  });

  writeStore(store);
  return true;
}

export function recordAnalysisUsage({
  email,
  prUrl,
  repository,
}: {
  email: string;
  prUrl: string;
  repository: string;
}) {
  const normalized = normalizeEmail(email);
  const store = readStore();

  store.usage.push({
    email: normalized,
    prUrl,
    repository,
    analyzedAt: new Date().toISOString(),
  });

  writeStore(store);
}

export function getUsageCount(email: string) {
  const normalized = normalizeEmail(email);
  const store = readStore();

  return store.usage.filter((item) => item.email === normalized).length;
}

export function createAccessToken(email: string) {
  const normalized = normalizeEmail(email);
  const expiresAt = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS;
  const payload = `${normalized}|${expiresAt}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", getAccessSecret())
    .update(encoded)
    .digest("hex");

  return `${encoded}.${signature}`;
}

export function verifyAccessToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAccessSecret())
    .update(encoded)
    .digest("hex");

  if (!secureCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const [email, expiresAtRaw] = decoded.split("|");
    const expiresAt = Number.parseInt(expiresAtRaw ?? "", 10);

    if (!email || Number.isNaN(expiresAt)) {
      return null;
    }

    if (expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      email,
      expiresAt,
    };
  } catch {
    return null;
  }
}
