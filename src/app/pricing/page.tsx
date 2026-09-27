"use client";

import { useState } from "react";
import {
  Check,
  X,
  Zap,
  Brain,
  Crown,
  Shield,
  Code,
  Headphones,
  ArrowRight,
  Loader2,
} from "lucide-react";

type BillingPeriod = "monthly" | "annual";

interface Plan {
  tier: "free" | "pro" | "elite";
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    tier: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "The essentials to build a lasting training habit.",
    features: [
      "Core workout tracking",
      "100 API calls per month",
      "1 custom training plan",
      "Basic progress stats",
      "Workout templates",
      "Mobile responsive",
    ],
    cta: "Start Free",
  },
  {
    tier: "pro",
    name: "Pro",
    monthlyPrice: 9.99,
    annualPrice: 9.99 * 12 * 0.83,
    description: "More guidance and room to grow your routine.",
    features: [
      "Everything in Free",
      "AI-powered workout plans",
      "AI form coaching",
      "Advanced analytics (6-month charts)",
      "Unlimited custom plans",
      "5,000 API calls per month",
      "Priority email support",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    tier: "elite",
    name: "Elite",
    monthlyPrice: 24.99,
    annualPrice: 24.99 * 12 * 0.83,
    description: "A deeper level of coaching and developer access.",
    features: [
      "Everything in Pro",
      "24/7 AI personal coach",
      "50,000 API calls per month",
      "Full developer API access",
      "Priority support (2hr response)",
      "Early access to new features",
      "Custom integrations",
    ],
    cta: "Get Elite",
  },
];

const allFeatures = [
  { key: "workoutTracking", label: "Workout tracking", free: true, pro: true, elite: true },
  { key: "apiCalls", label: "API calls/month", free: "100", pro: "5,000", elite: "50,000" },
  { key: "customPlans", label: "Custom training plans", free: "1", pro: "Unlimited", elite: "Unlimited" },
  { key: "aiWorkoutPlans", label: "AI workout plans", free: false, pro: true, elite: true },
  { key: "formCoaching", label: "AI form coaching", free: false, pro: true, elite: true },
  { key: "advancedAnalytics", label: "Advanced analytics", free: false, pro: true, elite: true },
  { key: "aiCoach247", label: "24/7 AI coach", free: false, pro: false, elite: true },
  { key: "developerApiAccess", label: "Developer API access", free: false, pro: false, elite: true },
  { key: "prioritySupport", label: "Priority support", free: false, pro: "Email", elite: "2hr response" },
  { key: "earlyAccess", label: "Early feature access", free: false, pro: false, elite: true },
];

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `£${price.toFixed(2)}`;
}

function getFeatureValue(plan: Plan, feature: typeof allFeatures[0]): string | boolean {
  switch (feature.key) {
    case "apiCalls":
      return feature[plan.tier as keyof typeof feature];
    case "customPlans":
      return feature[plan.tier as keyof typeof feature];
    case "prioritySupport":
      return feature[plan.tier as keyof typeof feature];
    case "aiWorkoutPlans":
    case "formCoaching":
    case "advancedAnalytics":
    case "aiCoach247":
    case "developerApiAccess":
    case "earlyAccess":
      return feature[plan.tier as keyof typeof feature];
    default:
      return feature[plan.tier as keyof typeof feature];
  }
}

function renderFeatureValue(value: string | boolean): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? <Check className="feature-check" size={16} /> : <X className="feature-x" size={16} />;
  }
  return <span className="feature-text">{value}</span>;
}

export default function PricingPage() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [loadingTier, setLoadingTier] = useState<"pro" | "elite" | null>(null);

  async function handleCheckout(tier: "pro" | "elite") {
    setLoadingTier(tier);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Could not start checkout.");
      }
      window.location.assign(result.url);
    } catch (error) {
      console.error("Checkout failed:", error);
      alert(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <div className="container">
          <p className="eyebrow">Simple, transparent pricing</p>
          <h1>Choose the plan that fits your training</h1>
          <p className="pricing-subtitle">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
        </div>
      </header>

      <section className="pricing-toggle" aria-label="Billing period">
        <div className="container">
          <div className="toggle-wrapper">
            <button
              className={`toggle-btn ${period === "monthly" ? "active" : ""}`}
              onClick={() => setPeriod("monthly")}
              aria-pressed={period === "monthly"}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${period === "annual" ? "active" : ""}`}
              onClick={() => setPeriod("annual")}
              aria-pressed={period === "annual"}
            >
              Annual
              <span className="discount-badge">Save 17%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="pricing-cards" aria-label="Pricing plans">
        <div className="container">
          <div className="cards-grid">
            {plans.map((plan) => {
              const price = period === "monthly" ? plan.monthlyPrice : plan.annualPrice;
              const periodLabel = period === "monthly" ? "/month" : "/year";
              const isFree = plan.tier === "free";

              return (
                <article
                  key={plan.tier}
                  className={`pricing-card ${plan.popular ? "popular" : ""} ${isFree ? "free" : ""}`}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}

                  <div className="card-header">
                    <div className="plan-icon">
                      {plan.tier === "free" && <Zap size={28} />}
                      {plan.tier === "pro" && <Brain size={28} />}
                      {plan.tier === "elite" && <Crown size={28} />}
                    </div>
                    <h2>{plan.name}</h2>
                    <p className="plan-description">{plan.description}</p>
                  </div>

                  <div className="card-price">
                    <span className="price-amount">{formatPrice(price)}</span>
                    <span className="price-period">{isFree ? "" : periodLabel}</span>
                  </div>

                  <ul className="card-features" role="list">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check className="feature-check" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`cta-button ${isFree ? "secondary" : plan.popular ? "primary" : "secondary"}`}
                    onClick={() => {
                      if (isFree) {
                        window.location.assign("/");
                      } else {
                        handleCheckout(plan.tier as "pro" | "elite");
                      }
                    }}
                    disabled={loadingTier === plan.tier}
                    aria-label={isFree ? "Get started for free" : `Subscribe to ${plan.name}`}
                  >
                    {loadingTier === plan.tier ? (
                      <>
                        <Loader2 className="spinner" size={18} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        {!isFree && <ArrowRight size={16} />}
                      </>
                    )}
                  </button>

                  {isFree && (
                    <p className="free-note">No credit card required</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="comparison-table" aria-label="Feature comparison">
        <div className="container">
          <h2>Compare all features</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.tier} scope="col" className={plan.popular ? "popular-col" : ""}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature.key}>
                    <td className="feature-name">{feature.label}</td>
                    {plans.map((plan) => (
                      <td key={plan.tier} className={plan.popular ? "popular-col" : ""}>
                        {renderFeatureValue(getFeatureValue(plan, feature))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="faq-section" aria-label="Frequently asked questions">
        <div className="container">
          <h2>Frequently asked questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <details key={index} className="faq-item">
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="pricing-footer">
        <div className="container">
          <p>Still have questions? <a href="mailto:support@fitbuzz.app">Contact support</a></p>
        </div>
      </footer>
    </div>
  );
}

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, and downgrades apply at the end of your current billing period.",
  },
  {
    q: "What happens after my 14-day trial?",
    a: "You'll be automatically charged for your selected plan unless you cancel before the trial ends. We'll send a reminder 3 days before your trial expires.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No contracts. Monthly plans can be cancelled anytime. Annual plans are prepaid for the year but you can cancel auto-renewal.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, Apple Pay, and Google Pay through Stripe. All payments are processed securely.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact support within 30 days for a full refund.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your workout data stays with you. You can export all your data at any time. If you cancel, you'll retain access to your data on the Free plan.",
  },
];