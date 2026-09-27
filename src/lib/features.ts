export type SubscriptionTier = "free" | "pro" | "elite";

export type FeatureConfig =
  | { tiers: readonly SubscriptionTier[]; description: string }
  | { free: number; pro: number; elite: number };

export const FEATURES = {
  workoutTracking: { tiers: ["free", "pro", "elite"] as const, description: "Log and track workouts" },
  aiWorkoutPlans: { tiers: ["pro", "elite"] as const, description: "AI-generated workout plans" },
  formCoaching: { tiers: ["pro", "elite"] as const, description: "AI form analysis and coaching" },
  advancedAnalytics: { tiers: ["pro", "elite"] as const, description: "6-month progress charts, insights" },
  unlimitedCustomPlans: { tiers: ["pro", "elite"] as const, description: "Unlimited custom training plans" },
  apiAccess: { tiers: ["pro", "elite"] as const, description: "API access with quota" },
  aiCoach247: { tiers: ["elite"] as const, description: "24/7 AI personal coach" },
  developerApiAccess: { tiers: ["elite"] as const, description: "Full developer API access" },
  prioritySupport: { tiers: ["elite"] as const, description: "Priority customer support" },
  apiCalls: { free: 100, pro: 5000, elite: 50000 } as const,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export const TIER_FEATURES: Record<SubscriptionTier, FeatureKey[]> = {
  free: ["workoutTracking"],
  pro: [
    "workoutTracking",
    "aiWorkoutPlans",
    "formCoaching",
    "advancedAnalytics",
    "unlimitedCustomPlans",
    "apiAccess",
  ],
  elite: [
    "workoutTracking",
    "aiWorkoutPlans",
    "formCoaching",
    "advancedAnalytics",
    "unlimitedCustomPlans",
    "apiAccess",
    "aiCoach247",
    "developerApiAccess",
    "prioritySupport",
  ],
};

export function canAccess(tier: SubscriptionTier, feature: FeatureKey): boolean {
  const config = FEATURES[feature];
  if ("tiers" in config) return (config.tiers as readonly SubscriptionTier[]).includes(tier);
  return true;
}

export function getRequiredTier(feature: FeatureKey): SubscriptionTier | null {
  const config = FEATURES[feature];
  if ("tiers" in config) {
    const tiers = config.tiers as readonly SubscriptionTier[];
    if (tiers.includes("elite") && !tiers.includes("pro")) return "elite";
    if (tiers.includes("pro")) return "pro";
    return null;
  }
  return null;
}

export function getApiLimit(tier: SubscriptionTier): number {
  return FEATURES.apiCalls[tier];
}

export function getTierFeatures(tier: SubscriptionTier): FeatureKey[] {
  return TIER_FEATURES[tier] || [];
}

export function getUpgradeMessage(feature: FeatureKey): string {
  const requiredTier = getRequiredTier(feature);
  if (!requiredTier) return "";
  const tierNames: Record<SubscriptionTier, string> = { free: "Free", pro: "Pro", elite: "Elite" };
  return `This feature requires ${tierNames[requiredTier]}. Upgrade to unlock.`;
}