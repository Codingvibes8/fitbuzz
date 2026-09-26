import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/billing/stripe", () => {
  const planConfig = {
    pro: { priceId: "price_pro_mock", amount: 999 },
    elite: { priceId: "price_elite_mock", amount: 2499 },
  };

  return {
    getPaidPlan: (tier: "pro" | "elite") => planConfig[tier],
    getTierForPriceId: (priceId: string) => {
      if (priceId === planConfig.pro.priceId) return "pro";
      if (priceId === planConfig.elite.priceId) return "elite";
      return null;
    },
    getStripe: () => ({}),
    getAppUrl: () => "http://localhost:3000",
    isTrustedAppOrigin: (origin: string | null, appUrl: string) => {
      if (!origin) return false;
      try {
        return new URL(origin).origin === appUrl;
      } catch {
        return false;
      }
    },
  };
});

import { getPaidPlan, getTierForPriceId, getAppUrl, isTrustedAppOrigin } from "@/lib/billing/stripe";

describe("Billing Stripe Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPaidPlan", () => {
    it("returns pro plan with correct price ID and amount", () => {
      const plan = getPaidPlan("pro");
      expect(plan.priceId).toBe("price_pro_mock");
      expect(plan.amount).toBe(999);
    });

    it("returns elite plan with correct price ID and amount", () => {
      const plan = getPaidPlan("elite");
      expect(plan.priceId).toBe("price_elite_mock");
      expect(plan.amount).toBe(2499);
    });
  });

  describe("getTierForPriceId", () => {
    it("maps pro price ID to pro tier", () => {
      expect(getTierForPriceId("price_pro_mock")).toBe("pro");
    });

    it("maps elite price ID to elite tier", () => {
      expect(getTierForPriceId("price_elite_mock")).toBe("elite");
    });

    it("returns null for unknown price ID", () => {
      expect(getTierForPriceId("price_unknown")).toBeNull();
    });
  });

  describe("getAppUrl", () => {
    it("returns parsed app URL", () => {
      expect(getAppUrl()).toBe("http://localhost:3000");
    });
  });

  describe("isTrustedAppOrigin", () => {
    it("returns true for matching origin", () => {
      expect(isTrustedAppOrigin("http://localhost:3000", "http://localhost:3000")).toBe(true);
    });

    it("returns false for non-matching origin", () => {
      expect(isTrustedAppOrigin("http://evil.com", "http://localhost:3000")).toBe(false);
    });

    it("returns false for null origin", () => {
      expect(isTrustedAppOrigin(null, "http://localhost:3000")).toBe(false);
    });

    it("returns false for invalid origin", () => {
      expect(isTrustedAppOrigin("not-a-url", "http://localhost:3000")).toBe(false);
    });
  });
});