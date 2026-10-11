// Temporary diagnostic: verifies Stripe price config matches the hard-coded plan config.
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const envPath = path.resolve(process.cwd(), ".env.local");
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const key = env.STRIPE_SECRET_KEY || "";
console.log("STRIPE_SECRET_KEY present:", Boolean(key), "prefix:", key.slice(0, 8));
console.log("STRIPE_PRO_PRICE_ID:", env.STRIPE_PRO_PRICE_ID);
console.log("STRIPE_ELITE_PRICE_ID:", env.STRIPE_ELITE_PRICE_ID);
console.log("APP_URL:", JSON.stringify(env.APP_URL));

const stripe = new Stripe(key);
const expected = { pro: 999, elite: 2499 };
for (const [tier, priceId] of Object.entries({ pro: env.STRIPE_PRO_PRICE_ID, elite: env.STRIPE_ELITE_PRICE_ID })) {
  try {
    const p = await stripe.prices.retrieve(priceId);
    console.log(`\n${tier.toUpperCase()} price ${priceId}:`);
    console.log("  active:", p.active);
    console.log("  currency:", p.currency);
    console.log("  unit_amount:", p.unit_amount, "expected:", expected[tier]);
    console.log("  interval:", p.recurring?.interval, "interval_count:", p.recurring?.interval_count);
    const ok = p.active && p.currency === "gbp" && p.unit_amount === expected[tier] && p.recurring?.interval === "month" && p.recurring.interval_count === 1;
    console.log("  PASSES route validation:", ok);
  } catch (e) {
    console.log(`\n${tier.toUpperCase()} price ${priceId}: REQUEST FAILED ->`, e.message);
  }
}
