import { NextResponse } from "next/server";
import { getAppUrl, getPaidPlan, getStripe, isTrustedAppOrigin, type PaidTier } from "@/lib/billing/stripe";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to choose a plan." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 });
  }
  const tier = body && typeof body === "object" && "tier" in body ? body.tier : null;
  if (tier !== "pro" && tier !== "elite") {
    return NextResponse.json({ error: "Choose a valid paid plan." }, { status: 400 });
  }

  const plan = getPaidPlan(tier as PaidTier);
  if (!plan.priceId) return NextResponse.json({ error: "This plan is not configured for checkout." }, { status: 503 });

  let stripe;
  let appUrl: string;
  try {
    stripe = getStripe();
    appUrl = getAppUrl();
  } catch {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }
  if (!isTrustedAppOrigin(request.headers.get("origin"), appUrl)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data: existing, error: subscriptionError } = await admin
      .from("subscriptions")
      .select("status, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (subscriptionError) {
      console.error("Supabase subscription lookup failed", subscriptionError);
      return NextResponse.json({ error: "Billing storage is unavailable. Check the server-side Supabase secret key." }, { status: 503 });
    }

    if (existing?.stripe_subscription_id && !["canceled", "incomplete_expired"].includes(existing.status)) {
      return NextResponse.json({ error: "Manage your existing subscription from the billing portal." }, { status: 409 });
    }

    const price = await stripe.prices.retrieve(plan.priceId);
    if (!price.active || price.currency !== "gbp" || price.unit_amount !== plan.amount || price.recurring?.interval !== "month" || price.recurring.interval_count !== 1) {
      return NextResponse.json({ error: "The Stripe price must be active and match the monthly GBP plan." }, { status: 503 });
    }

    const metadata = { fitbuzz_user_id: user.id, fitbuzz_tier: tier };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: plan.priceId, quantity: 1 }],
      ...(existing?.stripe_customer_id ? { customer: existing.stripe_customer_id } : { customer_email: user.email ?? undefined }),
      client_reference_id: user.id,
      metadata,
      subscription_data: { metadata },
      success_url: `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
    });

    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", error);
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }
}