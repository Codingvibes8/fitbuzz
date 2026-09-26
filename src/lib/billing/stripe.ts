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

export function getAppUrl() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is not configured.");
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