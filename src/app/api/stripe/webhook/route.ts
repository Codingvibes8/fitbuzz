import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe, getTierForPriceId, type PaidTier } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function syncSubscription(subscriptionId: string, fallbackUserId?: string | null, fallbackTier?: string | null) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.fitbuzz_user_id || fallbackUserId;
  const metadataTier = subscription.metadata.fitbuzz_tier || fallbackTier;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = metadataTier === "pro" || metadataTier === "elite"
    ? metadataTier
    : priceId ? getTierForPriceId(priceId) : null;

  if (!userId || !tier) throw new Error("Stripe subscription is missing FitBuzz account metadata.");

  const paidAccess = ["active", "trialing", "past_due"].includes(subscription.status);
  const { error } = await createAdminClient().from("subscriptions").upsert({
    user_id: userId,
    tier: (paidAccess ? tier : "free") as PaidTier | "free",
    status: subscription.status,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) throw error;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "subscription" && typeof session.subscription === "string") {
        await syncSubscription(session.subscription, session.metadata?.fitbuzz_user_id ?? session.client_reference_id, session.metadata?.fitbuzz_tier);
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription.id);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Unable to sync Stripe subscription", error);
    return NextResponse.json({ error: "Subscription sync failed." }, { status: 500 });
  }
}