import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentFailedEmail } from "@/lib/emails/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const admin = createAdminClient();

    const { data: subscriptions, error } = await admin
      .from("subscriptions")
      .select("user_id, tier, stripe_customer_id, stripe_subscription_id, status")
      .in("status", ["past_due", "unpaid"])
      .not("stripe_customer_id", "is", null);

    if (error) {
      console.error("Failed to fetch past_due subscriptions:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No failed payments" });
    }

    const results = [];

    for (const sub of subscriptions) {
      try {
        const { data: user } = await admin.auth.admin.getUserById(sub.user_id);
        if (!user?.user?.email) continue;

        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id!);
        const attemptNumber = (stripeSubscription as any).status_details?.past_due_retry_attempts || 1;

        const planName = sub.tier === "pro" ? "Pro" : "Elite";

        const billingPortalSession = await stripe.billingPortal.sessions.create({
          customer: sub.stripe_customer_id!,
          return_url: `${process.env.APP_URL}/?billing=return`,
        });

        const result = await sendPaymentFailedEmail({
          userName: user.user.email.split("@")[0],
          planName,
          retryUrl: billingPortalSession.url,
          attemptNumber,
        });

        results.push({ userId: sub.user_id, success: result.success, error: result.error });
      } catch (error) {
        console.error(`Failed to send payment failed email for ${sub.user_id}:`, error);
        results.push({ userId: sub.user_id, success: false, error: "Failed to send" });
      }
    }

    return NextResponse.json({ sent: results.filter(r => r.success).length, results });
  } catch (error) {
    console.error("Payment failed cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}