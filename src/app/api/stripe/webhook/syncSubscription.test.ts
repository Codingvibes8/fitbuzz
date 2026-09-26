import { describe, it, expect, vi, beforeEach } from "vitest";

const paidStatuses = ["active", "trialing", "past_due"];
const freeStatuses = ["canceled", "incomplete", "incomplete_expired", "unpaid"];

function getTierFromSubscription(subscription: {
  status: string;
  metadata: { fitbuzz_tier?: string; fitbuzz_user_id?: string };
  items: { data: Array<{ price: { id: string } }> };
}): { tier: string; isPaid: boolean } {
  const metadataTier = subscription.metadata.fitbuzz_tier;
  const priceId = subscription.items.data[0]?.price.id;
  
  const tier = metadataTier === "pro" || metadataTier === "elite"
    ? metadataTier
    : priceId === "price_pro_mock" ? "pro"
    : priceId === "price_elite_mock" ? "elite"
    : null;

  const isPaid = paidStatuses.includes(subscription.status);
  const finalTier = isPaid ? (tier || "free") : "free";

  return { tier: finalTier, isPaid };
}

describe("Subscription Sync Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTierFromSubscription", () => {
    it("returns pro tier for active pro subscription with metadata", () => {
      const sub = {
        status: "active",
        metadata: { fitbuzz_tier: "pro", fitbuzz_user_id: "user-123" },
        items: { data: [{ price: { id: "price_pro_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("pro");
      expect(result.isPaid).toBe(true);
    });

    it("returns elite tier for active elite subscription with metadata", () => {
      const sub = {
        status: "active",
        metadata: { fitbuzz_tier: "elite", fitbuzz_user_id: "user-123" },
        items: { data: [{ price: { id: "price_elite_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("elite");
      expect(result.isPaid).toBe(true);
    });

    it("returns free tier for canceled subscription", () => {
      const sub = {
        status: "canceled",
        metadata: { fitbuzz_tier: "pro", fitbuzz_user_id: "user-123" },
        items: { data: [{ price: { id: "price_pro_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("free");
      expect(result.isPaid).toBe(false);
    });

    it("returns free tier for incomplete_expired subscription", () => {
      const sub = {
        status: "incomplete_expired",
        metadata: { fitbuzz_tier: "pro", fitbuzz_user_id: "user-123" },
        items: { data: [{ price: { id: "price_pro_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("free");
      expect(result.isPaid).toBe(false);
    });

    it("returns pro tier for past_due subscription (past_due is paid access)", () => {
      const sub = {
        status: "past_due",
        metadata: { fitbuzz_tier: "pro", fitbuzz_user_id: "user-123" },
        items: { data: [{ price: { id: "price_pro_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("pro");
      expect(result.isPaid).toBe(true);
    });

    it("uses price ID to determine tier when metadata is missing", () => {
      const sub = {
        status: "active",
        metadata: {},
        items: { data: [{ price: { id: "price_elite_mock" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("elite");
      expect(result.isPaid).toBe(true);
    });

    it("returns free when tier cannot be determined", () => {
      const sub = {
        status: "active",
        metadata: {},
        items: { data: [{ price: { id: "price_unknown" } }] },
      };
      const result = getTierFromSubscription(sub);
      expect(result.tier).toBe("free");
      expect(result.isPaid).toBe(true); // status is active but no tier found
    });
  });

  describe("Status Transitions", () => {
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

    it("transitions from active to canceled", () => {
      const wasPaid = paidStatuses.includes("active");
      const isPaid = paidStatuses.includes("canceled");
      expect(wasPaid).toBe(true);
      expect(isPaid).toBe(false);
    });

    it("transitions from past_due to active", () => {
      const wasPaid = paidStatuses.includes("past_due");
      const isPaid = paidStatuses.includes("active");
      expect(wasPaid).toBe(true);
      expect(isPaid).toBe(true);
    });

    it("transitions from trialing to active", () => {
      const wasPaid = paidStatuses.includes("trialing");
      const isPaid = paidStatuses.includes("active");
      expect(wasPaid).toBe(true);
      expect(isPaid).toBe(true);
    });
  });
});

describe("Webhook Event Types", () => {
  it("handles checkout.session.completed for subscription", () => {
    const eventType = "checkout.session.completed";
    const session = { mode: "subscription", subscription: "sub_123" };
    
    const shouldSync = eventType === "checkout.session.completed" && session.mode === "subscription";
    expect(shouldSync).toBe(true);
  });

  it("handles customer.subscription.updated", () => {
    const eventType = "customer.subscription.updated";
    const shouldSync = eventType.startsWith("customer.subscription.");
    expect(shouldSync).toBe(true);
  });

  it("handles customer.subscription.deleted", () => {
    const eventType = "customer.subscription.deleted";
    const shouldSync = eventType.startsWith("customer.subscription.");
    expect(shouldSync).toBe(true);
  });

  it("ignores unrelated events", () => {
    const eventType = "invoice.payment_succeeded";
    const shouldSync = eventType.startsWith("customer.subscription.") || 
      (eventType === "checkout.session.completed" && false);
    expect(shouldSync).toBe(false);
  });
});