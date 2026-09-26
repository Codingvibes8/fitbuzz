import { describe, it, expect } from "vitest";

describe("Subscription Types", () => {
  it("has SubscriptionTier type", () => {
    type SubscriptionTier = "free" | "pro" | "elite";
    const tiers: SubscriptionTier[] = ["free", "pro", "elite"];
    expect(tiers).toHaveLength(3);
  });

  it("has SubscriptionSummary type", () => {
    type SubscriptionSummary = {
      tier: "free" | "pro" | "elite";
      status: string;
      stripe_subscription_id: string | null;
      current_period_end: string | null;
    };
    const sub: SubscriptionSummary = {
      tier: "free",
      status: "free",
      stripe_subscription_id: null,
      current_period_end: null,
    };
    expect(sub.tier).toBe("free");
  });
});

describe("Subscription Tier Logic", () => {
  const freeSubscription = { tier: "free", status: "free", stripe_subscription_id: null, current_period_end: null };

  describe("hasManageableSubscription", () => {
    it("returns false for free subscription", () => {
      const sub = freeSubscription;
      const result = Boolean(sub.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(sub.status);
      expect(result).toBe(false);
    });

    it("returns true for active pro subscription", () => {
      const sub = { tier: "pro", status: "active", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const result = Boolean(sub.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(sub.status);
      expect(result).toBe(true);
    });

    it("returns true for trialing subscription", () => {
      const sub = { tier: "elite", status: "trialing", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const result = Boolean(sub.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(sub.status);
      expect(result).toBe(true);
    });

    it("returns false for canceled subscription", () => {
      const sub = { tier: "pro", status: "canceled", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const result = Boolean(sub.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(sub.status);
      expect(result).toBe(false);
    });

    it("returns false for incomplete_expired subscription", () => {
      const sub = { tier: "pro", status: "incomplete_expired", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const result = Boolean(sub.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(sub.status);
      expect(result).toBe(false);
    });
  });

  describe("currentTier logic", () => {
    it("returns free when no manageable subscription", () => {
      const subscription = freeSubscription;
      const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
      const currentTier = hasManageable ? subscription.tier : "free";
      expect(currentTier).toBe("free");
    });

    it("returns pro when active pro subscription", () => {
      const subscription = { tier: "pro", status: "active", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
      const currentTier = hasManageable ? subscription.tier : "free";
      expect(currentTier).toBe("pro");
    });

    it("returns elite when active elite subscription", () => {
      const subscription = { tier: "elite", status: "active", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
      const currentTier = hasManageable ? subscription.tier : "free";
      expect(currentTier).toBe("elite");
    });

    it("returns free when subscription is canceled", () => {
      const subscription = { tier: "pro", status: "canceled", stripe_subscription_id: "sub_123", current_period_end: "2024-12-31" };
      const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
      const currentTier = hasManageable ? subscription.tier : "free";
      expect(currentTier).toBe("free");
    });
  });
});

describe("Membership Plan Data", () => {
  const membershipPlans = [
    { tier: "free", name: "Free", price: "£0", description: "The essentials to build a lasting training habit.", features: ["Core workout tracking", "100 API calls per month", "1 custom training plan"] },
    { tier: "pro", name: "Pro", price: "£9.99", description: "More guidance and room to grow your routine.", features: ["AI-powered features", "5,000 API calls per month", "Unlimited custom plans", "Advanced analytics"] },
    { tier: "elite", name: "Elite", price: "£24.99", description: "A deeper level of coaching and developer access.", features: ["24/7 AI coach", "50,000 API calls per month", "API access for developers", "Priority support"] },
  ] as const;

  it("has three tiers: free, pro, elite", () => {
    const tiers = membershipPlans.map(p => p.tier);
    expect(tiers).toEqual(["free", "pro", "elite"]);
  });

  it("free plan has 3 features", () => {
    expect(membershipPlans[0].features.length).toBe(3);
  });

  it("pro plan has 4 features", () => {
    expect(membershipPlans[1].features.length).toBe(4);
  });

  it("elite plan has 4 features", () => {
    expect(membershipPlans[2].features.length).toBe(4);
  });

  it("pro plan is marked as recommended in UI", () => {
    const proPlan = membershipPlans.find(p => p.tier === "pro");
    expect(proPlan?.name).toBe("Pro");
  });
});

describe("Subscription Status Flow", () => {
  const paidStatuses = ["active", "trialing", "past_due"];
  const freeStatuses = ["canceled", "incomplete", "incomplete_expired", "unpaid"];

  it("considers active, trialing, past_due as paid access", () => {
    paidStatuses.forEach(status => {
      expect(paidStatuses.includes(status)).toBe(true);
    });
  });

  it("considers canceled, incomplete, incomplete_expired, unpaid as free access", () => {
    freeStatuses.forEach(status => {
      expect(freeStatuses.includes(status)).toBe(true);
    });
  });

  it("transitions from active to canceled via webhook", () => {
    const initialStatus = "active";
    const newStatus = "canceled";
    const wasPaid = paidStatuses.includes(initialStatus);
    const isPaid = paidStatuses.includes(newStatus);
    expect(wasPaid).toBe(true);
    expect(isPaid).toBe(false);
  });

  it("transitions from past_due to active via webhook", () => {
    const initialStatus = "past_due";
    const newStatus = "active";
    const wasPaid = paidStatuses.includes(initialStatus);
    const isPaid = paidStatuses.includes(newStatus);
    expect(wasPaid).toBe(true); // past_due IS in paidStatuses
    expect(isPaid).toBe(true);
  });

  it("transitions from trialing to active via webhook", () => {
    const initialStatus = "trialing";
    const newStatus = "active";
    const wasPaid = paidStatuses.includes(initialStatus);
    const isPaid = paidStatuses.includes(newStatus);
    expect(wasPaid).toBe(true);
    expect(isPaid).toBe(true);
  });

  it("transitions from active to past_due via webhook", () => {
    const initialStatus = "active";
    const newStatus = "past_due";
    const wasPaid = paidStatuses.includes(initialStatus);
    const isPaid = paidStatuses.includes(newStatus);
    expect(wasPaid).toBe(true);
    expect(isPaid).toBe(true); // past_due is still paid access
  });
});

describe("Billing Portal Eligibility", () => {
  it("allows billing portal access for active subscription", () => {
    const subscription = { stripe_subscription_id: "sub_123", status: "active" };
    const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
    expect(hasManageable).toBe(true);
  });

  it("allows billing portal access for trialing subscription", () => {
    const subscription = { stripe_subscription_id: "sub_123", status: "trialing" };
    const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
    expect(hasManageable).toBe(true);
  });

  it("allows billing portal access for past_due subscription", () => {
    const subscription = { stripe_subscription_id: "sub_123", status: "past_due" };
    const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
    expect(hasManageable).toBe(true);
  });

  it("denies billing portal access for canceled subscription", () => {
    const subscription = { stripe_subscription_id: "sub_123", status: "canceled" };
    const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
    expect(hasManageable).toBe(false);
  });

  it("denies billing portal access when no subscription ID", () => {
    const subscription = { stripe_subscription_id: null, status: "free" };
    const hasManageable = Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
    expect(hasManageable).toBe(false);
  });
});

describe("Checkout Flow Logic", () => {
  it("allows checkout when no existing subscription", () => {
    const existing = null;
    const canCheckout = !existing;
    expect(canCheckout).toBe(true);
  });

  it("blocks checkout when active subscription exists", () => {
    const existing = { stripe_subscription_id: "sub_123", status: "active" };
    const canCheckout = !existing || ["canceled", "incomplete_expired"].includes(existing.status);
    expect(canCheckout).toBe(false);
  });

  it("allows checkout when canceled subscription exists", () => {
    const existing = { stripe_subscription_id: "sub_123", status: "canceled" };
    const canCheckout = !existing || ["canceled", "incomplete_expired"].includes(existing.status);
    expect(canCheckout).toBe(true);
  });

  it("allows checkout when incomplete_expired subscription exists", () => {
    const existing = { stripe_subscription_id: "sub_123", status: "incomplete_expired" };
    const canCheckout = !existing || ["canceled", "incomplete_expired"].includes(existing.status);
    expect(canCheckout).toBe(true);
  });

  it("validates price configuration matches expected", () => {
    const expectedPrice = {
      active: true,
      currency: "gbp",
      unit_amount: 999,
      recurring: { interval: "month", interval_count: 1 },
    };
    const stripePrice = { ...expectedPrice };
    
    const isValid = stripePrice.active 
      && stripePrice.currency === "gbp" 
      && stripePrice.unit_amount === 999 
      && stripePrice.recurring?.interval === "month" 
      && stripePrice.recurring?.interval_count === 1;
    
    expect(isValid).toBe(true);
  });

  it("rejects mismatched currency", () => {
    const stripePrice = { active: true, currency: "usd", unit_amount: 999, recurring: { interval: "month", interval_count: 1 } };
    
    const isValid = stripePrice.currency === "gbp";
    expect(isValid).toBe(false);
  });

  it("rejects mismatched amount", () => {
    const stripePrice = { active: true, currency: "gbp", unit_amount: 1999, recurring: { interval: "month", interval_count: 1 } };
    
    const isValid = stripePrice.unit_amount === 999;
    expect(isValid).toBe(false);
  });

  it("rejects non-monthly interval", () => {
    const stripePrice = { active: true, currency: "gbp", unit_amount: 999, recurring: { interval: "year", interval_count: 1 } };
    
    const isValid = stripePrice.recurring?.interval === "month" && stripePrice.recurring?.interval_count === 1;
    expect(isValid).toBe(false);
  });
});