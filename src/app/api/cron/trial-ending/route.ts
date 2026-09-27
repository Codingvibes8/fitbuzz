import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialEndingEmail } from "@/lib/emails/service";
import { getAppUrl } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const today = new Date();

    const { data: subscriptions, error } = await admin
      .from("subscriptions")
      .select("user_id, tier, trial_end, stripe_customer_id")
      .eq("status", "trialing")
      .not("trial_end", "is", null)
      .lte("trial_end", threeDaysFromNow.toISOString())
      .gt("trial_end", today.toISOString());

    if (error) {
      console.error("Failed to fetch trial subscriptions:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: "No trials ending soon" });
    }

    const appUrl = getAppUrl();
    const results = [];

    for (const sub of subscriptions) {
      try {
        const { data: user } = await admin.auth.admin.getUserById(sub.user_id);
        if (!user?.user?.email) continue;

        const trialEndDate = new Date(sub.trial_end!).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const planName = sub.tier === "pro" ? "Pro" : "Elite";
        const price = sub.tier === "pro" ? "£9.99" : "£24.99";

        const result = await sendTrialEndingEmail({
          userName: user.user.email.split("@")[0],
          trialEndDate,
          planName,
          price,
          checkoutUrl: `${appUrl}/pricing`,
        });

        results.push({ userId: sub.user_id, success: result.success, error: result.error });
      } catch (error) {
        console.error(`Failed to send trial ending email for ${sub.user_id}:`, error);
        results.push({ userId: sub.user_id, success: false, error: "Failed to send" });
      }
    }

    return NextResponse.json({ sent: results.filter(r => r.success).length, results });
  } catch (error) {
    console.error("Trial ending cron failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}