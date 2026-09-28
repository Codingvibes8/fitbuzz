import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import {
  getAnalyticsSummary,
  getWeeklyActivity,
  getStreakInfo,
  getMonthlyStats,
  getMostRecentWorkoutDate,
} from "@/lib/supabase/workouts";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") ?? "summary";

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

    switch (type) {
      case "weekly": {
        const referenceDate = searchParams.get("date") ?? undefined;
        const activity = await getWeeklyActivity(supabase, user.id, referenceDate);
        return NextResponse.json({ activity });
      }

      case "streak": {
        const streak = await getStreakInfo(supabase, user.id);
        return NextResponse.json({ streak });
      }

      case "monthly": {
        const yearMonth = searchParams.get("month") ?? getCurrentMonth();
        const stats = await getMonthlyStats(supabase, user.id, yearMonth);
        return NextResponse.json({ stats, month: yearMonth });
      }

      case "recent-date": {
        const date = await getMostRecentWorkoutDate(supabase, user.id);
        return NextResponse.json({ date });
      }

      case "summary":
      default: {
        const summary = await getAnalyticsSummary(supabase, user.id);
        return NextResponse.json({ summary });
      }
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
