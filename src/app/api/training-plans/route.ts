import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import {
  listTrainingPlans,
  getTrainingPlan,
  createTrainingPlan,
  updatePlanProgress,
  updatePlanWeek,
  completePlan,
  deleteTrainingPlan,
  generateAiPlan,
  type AiPlanRequest,
  type PlanSession,
} from "@/lib/supabase/training-plans";
import { canAccess, type SubscriptionTier } from "@/lib/features";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const planId = searchParams.get("planId");
  const status = searchParams.get("status") as "active" | "completed" | "paused" | null;

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription tier for AI plan features
    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("tier, stripe_subscription_id, status")
      .maybeSingle();

    const tier = (subscriptionData?.tier ?? "free") as SubscriptionTier;
    const hasManageableSubscription =
      Boolean(subscriptionData?.stripe_subscription_id) &&
      !["canceled", "incomplete_expired"].includes(subscriptionData?.status ?? "");
    const effectiveTier = hasManageableSubscription ? tier : "free";

    // Single plan request
    if (planId) {
      const plan = await getTrainingPlan(supabase, planId, user.id);
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      return NextResponse.json({ plan });
    }

    // List all plans
    const plans = await listTrainingPlans(supabase, user.id, status ?? undefined);
    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Failed to fetch training plans:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch training plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check subscription tier for AI plan features
    const { data: subscriptionData } = await supabase
      .from("subscriptions")
      .select("tier, stripe_subscription_id, status")
      .maybeSingle();

    const tier = (subscriptionData?.tier ?? "free") as SubscriptionTier;
    const hasManageableSubscription =
      Boolean(subscriptionData?.stripe_subscription_id) &&
      !["canceled", "incomplete_expired"].includes(subscriptionData?.status ?? "");
    const effectiveTier = hasManageableSubscription ? tier : "free";

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "create": {
        // Check if user can create AI plans
        if (params.is_ai_generated && !canAccess(effectiveTier, "aiWorkoutPlans")) {
          return NextResponse.json(
            { error: "AI workout plans require a Pro or Elite subscription" },
            { status: 403 }
          );
        }

        const plan = await createTrainingPlan(supabase, user.id, params);
        return NextResponse.json({ plan }, { status: 201 });
      }

      case "generate": {
        // AI plan generation - requires Pro or Elite
        if (!canAccess(effectiveTier, "aiWorkoutPlans")) {
          return NextResponse.json(
            { error: "AI workout plan generation requires a Pro or Elite subscription" },
            { status: 403 }
          );
        }

        const aiRequest: AiPlanRequest = {
          goal: params.goal ?? "improve fitness",
          experienceLevel: params.experienceLevel ?? "beginner",
          availableDaysPerWeek: params.availableDaysPerWeek ?? 3,
          preferredCategories: params.preferredCategories ?? ["Strength"],
          hoursPerSession: params.hoursPerSession ?? 45,
        };

        const aiResponse = generateAiPlan(aiRequest);
        const plan = await createTrainingPlan(
          supabase,
          user.id,
          aiResponse.plan,
          aiResponse.sessions
        );

        return NextResponse.json({ plan, weeklySchedule: aiResponse.weeklySchedule }, { status: 201 });
      }

      case "complete-session": {
        await updatePlanProgress(supabase, user.id, {
          planId: params.planId,
          sessionId: params.sessionId,
          completed: params.completed,
        });
        return NextResponse.json({ success: true });
      }

      case "advance-week": {
        await updatePlanWeek(supabase, user.id, params.planId, params.weekNumber);
        return NextResponse.json({ success: true });
      }

      case "complete-plan": {
        await completePlan(supabase, user.id, params.planId);
        return NextResponse.json({ success: true });
      }

      case "delete": {
        await deleteTrainingPlan(supabase, user.id, params.planId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Training plans API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
