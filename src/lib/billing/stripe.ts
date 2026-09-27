import Stripe from "stripe";
import type { SubscriptionTier } from "@/lib/types/subscription";

export type PaidTier = Exclude<SubscriptionTier, "free">;

const planConfig: Record<PaidTier, { priceId: string | undefined; amount: number }> = {
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID, amount: 999 },
  elite: { priceId: process.env.STRIPE_ELITE_PRICE_ID, amount: 2499 },
};

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured.");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getPaidPlan(tier: PaidTier) {
  return planConfig[tier];
}

export function getTierForPriceId(priceId: string): PaidTier | null {
  if (priceId === planConfig.pro.priceId) return "pro";
  if (priceId === planConfig.elite.priceId) return "elite";
  return null;
}

const LOCAL_APP_URL = "http://localhost:3000";

/**
 * Resolves the app's public origin.
 *
 * Priority:
 * 1. `APP_URL` from the environment (local `.env.local` or the hosting provider's env vars).
 * 2. Vercel's automatically injected deployment URLs (`VERCEL_PROJECT_PRODUCTION_URL`,
 *    then the per-deployment `VERCEL_URL`) so production works even when `APP_URL` is unset
 *    in the Vercel dashboard.
 * 3. `http://localhost:3000` for local development.
 */
function resolveAppUrl() {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured;

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  return LOCAL_APP_URL;
}

export function getAppUrl() {
  const appUrl = resolveAppUrl();
  const parsedUrl = new URL(appUrl);
  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  return parsedUrl.origin;
}

export function isTrustedAppOrigin(origin: string | null, appUrl: string) {
  if (!origin) return false;
  try {
    return new URL(origin).origin === appUrl;
  } catch {
    return false;
  }
}