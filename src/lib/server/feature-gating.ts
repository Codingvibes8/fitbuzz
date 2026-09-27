import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionTier } from "@/lib/features";
import { canAccess, getApiLimit, getRequiredTier, type FeatureKey } from "@/lib/features";

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("tier,status,stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return "free";

  const hasManageableSubscription =
    Boolean(data.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(data.status);

  return hasManageableSubscription ? data.tier : "free";
}

export async function requireFeature(
  userId: string,
  feature: FeatureKey
): Promise<{ allowed: boolean; tier: SubscriptionTier; upgradeUrl?: string; message?: string }> {
  const tier = await getUserTier(userId);
  const allowed = canAccess(tier, feature);

  if (!allowed) {
    const requiredTier = getRequiredTier(feature);
    return {
      allowed: false,
      tier,
      upgradeUrl: "/pricing",
      message: `This feature requires ${requiredTier}. Please upgrade your plan.`,
    };
  }

  return { allowed: true, tier };
}

export async function checkApiQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetDate: string;
  tier: SubscriptionTier;
}> {
  const admin = createAdminClient();
  const tier = await getUserTier(userId);
  const limit = getApiLimit(tier);

  if (tier === "free") {
    return { allowed: false, remaining: 0, limit, resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), tier };
  }

  const { data, error } = await admin
    .from("subscriptions")
    .select("api_calls_used, api_calls_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { allowed: true, remaining: limit, limit, resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), tier };
  }

  const used = data.api_calls_used || 0;
  const remaining = Math.max(0, limit - used);
  const resetDate = data.api_calls_reset_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const now = new Date();
  const reset = new Date(resetDate);
  const isResetNeeded = now >= reset;

  if (isResetNeeded) {
    await admin
      .from("subscriptions")
      .update({ api_calls_used: 0, api_calls_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() })
      .eq("user_id", userId);
    return { allowed: true, remaining: limit, limit, resetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), tier };
  }

  return { allowed: remaining > 0, remaining, limit, resetDate, tier };
}

export async function incrementApiUsage(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("api_calls_used")
    .eq("user_id", userId)
    .maybeSingle();

  const used = (data?.api_calls_used || 0) + 1;
  await admin.from("subscriptions").update({ api_calls_used: used }).eq("user_id", userId);
}

export async function resetApiUsageIfNeeded(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("api_calls_reset_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data?.api_calls_reset_date) return;

  const now = new Date();
  const reset = new Date(data.api_calls_reset_date);
  if (now >= reset) {
    await admin
      .from("subscriptions")
      .update({
        api_calls_used: 0,
        api_calls_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("user_id", userId);
  }
}