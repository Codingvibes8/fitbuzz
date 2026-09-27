import { NextResponse } from "next/server";
import { getAppUrl, getStripe, isTrustedAppOrigin } from "@/lib/billing/stripe";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });

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
    const { data: subscription, error } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error("Supabase subscription lookup failed", error);
      return NextResponse.json({ error: "Billing storage is unavailable. Check the server-side Supabase secret key." }, { status: 503 });
    }
    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ error: "No Stripe billing account is linked yet." }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${appUrl}/?billing=return`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Unable to create Stripe Billing Portal session", error);
    return NextResponse.json({ error: "Could not open billing management. Please try again." }, { status: 500 });
  }
}