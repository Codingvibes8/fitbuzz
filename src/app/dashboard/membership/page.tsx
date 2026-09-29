"use client";

import { useState } from "react";
import { CreditCard, LogOut } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { useDashboard } from "../dashboard-provider";
import { useSubscription } from "@/lib/context/subscription-context";

const tierDisplayFeatures: Record<"free" | "pro" | "elite", string[]> = {
  free: ["Core workout tracking", "100 API calls per month", "1 custom training plan"],
  pro: ["AI-powered features", "5,000 API calls per month", "Unlimited custom plans", "Advanced analytics"],
  elite: ["24/7 AI coach", "50,000 API calls per month", "API access for developers", "Priority support"],
};

export default function MembershipPage() {
  const { user, supabase, setToast, setBillingLoading } = useDashboard();
  const { subscription, refreshSubscription } = useSubscription();
  const [billingAction, setBillingAction] = useState<"pro" | "elite" | "portal" | null>(null);

  const hasManageableSubscription =
    Boolean(subscription.stripe_subscription_id) &&
    !["canceled", "incomplete_expired"].includes(subscription.status);
  const currentTier: "free" | "pro" | "elite" = hasManageableSubscription ? subscription.tier : "free";

  async function startCheckout(tier: "pro" | "elite") {
    setBillingAction(tier);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const result: { url?: unknown; error?: unknown } = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Could not start checkout.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
    } finally {
      setBillingAction(null);
    }
  }

  async function openBillingPortal() {
    setBillingAction("portal");
    try {
      const response = await fetch("/api/billing-portal", { method: "POST" });
      const result: { url?: unknown; error?: unknown } = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Could not open billing management.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not open billing management. Please try again.");
    } finally {
      setBillingAction(null);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setToast("Could not sign out. Please try again.");
  }

  return (
    <>
      <PageHeading
        eyebrow="Plans that move with you"
        title="Membership"
        description="Choose the level of support that suits your training."
      />

      <div className="membership-notice">
        <CreditCard size={16} />
        <p>
          Monthly plans are billed securely in GBP through Stripe. Your current plan is{" "}
          {currentTier === "pro" ? "Pro" : currentTier === "elite" ? "Elite" : "Free"}.
        </p>
      </div>

      <section className="membership-grid" aria-label="Membership plans">
        {(["free", "pro", "elite"] as const).map((tier) => {
          const plan = {
            free: { name: "Free", price: "£0", description: "The essentials to build a lasting training habit." },
            pro: { name: "Pro", price: "£9.99", description: "More guidance and room to grow your routine." },
            elite: { name: "Elite", price: "£24.99", description: "A deeper level of coaching and developer access." },
          }[tier];

          const currentPlan = tier === currentTier;
          const actionLabel =
            currentPlan
              ? tier === "free"
                ? "Current plan"
                : billingAction === "portal"
                ? "Opening billing..."
                : "Manage billing"
              : hasManageableSubscription
              ? "Change plan in billing portal"
              : billingAction === tier
              ? "Opening checkout..."
              : `Choose ${plan.name}`;

          return (
            <article
              className={`membership-card${tier === "pro" ? " recommended" : ""}`}
              key={tier}
            >
              {tier === "pro" && <span className="membership-badge">Most popular</span>}
              <div className="membership-card-top">
                <h2>{plan.name}</h2>
                {currentPlan && <span className="membership-current">Current plan</span>}
              </div>
              <p className="membership-description">{plan.description}</p>
              <p className="membership-price">
                <strong>{plan.price}</strong>
                <span> / month</span>
              </p>
              <ul className="membership-features">
                {tierDisplayFeatures[tier].map((feature) => (
                  <li key={feature}>
                    <Check size={14} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={currentPlan ? "secondary-button membership-action" : "primary-button membership-action"}
                disabled={billingAction !== null || (currentPlan && tier === "free")}
                onClick={() => {
                  if (hasManageableSubscription) void openBillingPortal();
                  else if (tier === "free") setToast("You're already on the Free plan.");
                  else void startCheckout(tier);
                }}
              >
                {actionLabel}
              </button>
            </article>
          );
        })}
      </section>
    </>
  );
}

function Check({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
