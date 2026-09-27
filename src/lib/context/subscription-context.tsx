"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { SubscriptionSummary } from "@/lib/types/subscription";
import type { SubscriptionTier } from "@/lib/features";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canAccess, getApiLimit, getRequiredTier, type FeatureKey } from "@/lib/features";

const freeSubscription: SubscriptionSummary = {
  tier: "free",
  status: "free",
  stripe_subscription_id: null,
  current_period_end: null,
};

interface SubscriptionContextValue {
  subscription: SubscriptionSummary;
  currentTier: SubscriptionTier;
  loading: boolean;
  canAccess: (feature: FeatureKey) => boolean;
  getApiLimit: () => number;
  getRequiredTier: (feature: FeatureKey) => SubscriptionTier | null;
  getUpgradeMessage: (feature: FeatureKey) => string;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<SubscriptionSummary>(freeSubscription);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    const client = createClient();
    setSupabase(client);
    client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void refreshSubscription();
      } else {
        setSubscription(freeSubscription);
        setLoading(false);
      }
    });
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!supabase) {
      setSubscription(freeSubscription);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier,status,stripe_subscription_id,current_period_end")
        .maybeSingle();
      if (error) throw error;
      setSubscription(data ?? freeSubscription);
    } catch {
      setSubscription(freeSubscription);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const hasManageableSubscription =
    Boolean(subscription.stripe_subscription_id) &&
    !["canceled", "incomplete_expired"].includes(subscription.status);
  const currentTier: SubscriptionTier = hasManageableSubscription ? subscription.tier : "free";

  const value: SubscriptionContextValue = {
    subscription,
    currentTier,
    loading,
    canAccess: (feature: FeatureKey) => canAccess(currentTier, feature),
    getApiLimit: () => getApiLimit(currentTier),
    getRequiredTier: (feature: FeatureKey) => getRequiredTier(feature),
    getUpgradeMessage: (feature: FeatureKey) => {
      const requiredTier = getRequiredTier(feature);
      if (!requiredTier) return "";
      const tierNames: Record<SubscriptionTier, string> = { free: "Free", pro: "Pro", elite: "Elite" };
      return `This feature requires ${tierNames[requiredTier]}. Upgrade to unlock.`;
    },
    refreshSubscription,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}