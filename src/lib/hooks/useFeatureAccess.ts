"use client";

import { useSubscription } from "@/lib/context/subscription-context";
import type { FeatureKey, SubscriptionTier } from "@/lib/features";
import { getRequiredTier, getUpgradeMessage } from "@/lib/features";

interface UseFeatureAccessReturn {
  hasAccess: boolean;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier | null;
  upgradeMessage: string;
  loading: boolean;
}

export function useFeatureAccess(feature: FeatureKey): UseFeatureAccessReturn {
  const { currentTier, loading, canAccess } = useSubscription();
  const hasAccess = canAccess(feature);
  const requiredTier = getRequiredTier(feature);
  const upgradeMessage = getUpgradeMessage(feature);

  return {
    hasAccess,
    currentTier,
    requiredTier,
    upgradeMessage,
    loading,
  };
}

export function useTierAccess(requiredTier: SubscriptionTier): UseFeatureAccessReturn {
  const { currentTier, loading } = useSubscription();
  const tierOrder: SubscriptionTier[] = ["free", "pro", "elite"];
  const hasAccess = tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);

  return {
    hasAccess,
    currentTier,
    requiredTier: hasAccess ? null : requiredTier,
    upgradeMessage: hasAccess ? "" : `This feature requires ${requiredTier}. Upgrade to unlock.`,
    loading,
  };
}

export function useApiQuota(): { limit: number; loading: boolean } {
  const { getApiLimit, loading } = useSubscription();
  return { limit: getApiLimit(), loading };
}