export type SubscriptionTier = "free" | "pro" | "elite";

export type SubscriptionSummary = {
  tier: SubscriptionTier;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
};