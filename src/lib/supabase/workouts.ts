import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewWorkout, Workout } from "@/lib/types/workout";
import type { Database } from "@/lib/supabase/database.types";

type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

function toWorkout(row: WorkoutRow): Workout {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    duration: row.duration,
    volume: row.volume,
    date: row.workout_date,
  };
}

export async function listWorkouts(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(toWorkout);
}

export async function insertWorkouts(client: SupabaseClient<Database>, userId: string, workouts: NewWorkout[]) {
  const { data, error } = await client
    .from("workouts")
    .insert(workouts.map((workout) => ({
      user_id: userId,
      title: workout.title,
      category: workout.category,
      duration: workout.duration,
      volume: workout.volume,
      workout_date: workout.date,
    })))
    .select("*");

  if (error) throw error;
  return data.map(toWorkout);
}

export async function removeWorkout(client: SupabaseClient<Database>, userId: string, workoutId: string) {
  const { error } = await client
    .from("workouts")
    .delete()
    .eq("user_id", userId)
    .eq("id", workoutId);

  if (error) throw error;
}

// ── Analytics queries ──────────────────────────────────────────────

export type WeeklyActivityPoint = {
  day: string;
  minutes: number;
};

export type MonthlyStats = {
  sessions: number;
  minutes: number;
  volume: number;
  categories: Record<string, number>;
};

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
};

export type AnalyticsSummary = {
  weeklyActivity: WeeklyActivityPoint[];
  currentStreak: number;
  longestStreak: number;
  sessionsThisMonth: number;
  minutesThisMonth: number;
  volumeThisMonth: number;
  sessionsLastMonth: number;
  minutesLastMonth: number;
  consistency: number; // 0-100 percentage
  categoryBreakdown: Record<string, number>;
};

/** Get the last 7 days of activity, with 0 for days without workouts. */
export async function getWeeklyActivity(
  client: SupabaseClient<Database>,
  userId: string,
  referenceDate: string = todayISO()
): Promise<WeeklyActivityPoint[]> {
  const startOfRange = new Date(referenceDate);
  startOfRange.setDate(startOfRange.getDate() - 6);

  const { data, error } = await client
    .from("workouts")
    .select("duration, workout_date")
    .eq("user_id", userId)
    .gte("workout_date", startOfRange.toISOString().slice(0, 10))
    .lte("workout_date", referenceDate);

  if (error) throw error;

  const minutesByDate: Record<string, number> = {};
  for (const workout of data) {
    const date = workout.workout_date;
    minutesByDate[date] = (minutesByDate[date] || 0) + workout.duration;
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const result: WeeklyActivityPoint[] = [];
  const currentDate = new Date(startOfRange);

  for (let i = 0; i < 7; i++) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    result.push({
      day: days[i],
      minutes: minutesByDate[dateStr] || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/** Calculate current streak (consecutive days with workouts, ending at the most recent workout). */
export async function getStreakInfo(
  client: SupabaseClient<Database>,
  userId: string
): Promise<StreakInfo> {
  const { data, error } = await client
    .from("workouts")
    .select("workout_date")
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })
    .limit(365);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null };
  }

  const workoutDates = [...new Set(data.map((w) => w.workout_date))].sort();
  const dateSet = new Set(workoutDates);

  // Calculate current streak (from most recent workout backwards)
  let currentStreak = 0;
  let checkDate = new Date(workoutDates[workoutDates.length - 1]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If most recent workout is yesterday or today, count it
  const daysSinceLastWorkout =
    Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceLastWorkout > 1) {
    // Streak is broken if last workout was more than 1 day ago
    currentStreak = 0;
  } else {
    // Count consecutive days backwards
    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of workoutDates) {
    const date = new Date(dateStr);
    if (prevDate) {
      const diffDays =
        Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak + 1);
        tempStreak = 0;
      }
    } else {
      tempStreak = 0;
    }
    prevDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak + 1);

  return {
    currentStreak,
    longestStreak,
    lastWorkoutDate: workoutDates[workoutDates.length - 1],
  };
}

/** Get stats for a specific month (YYYY-MM). */
export async function getMonthlyStats(
  client: SupabaseClient<Database>,
  userId: string,
  yearMonth: string // format: "2026-09"
): Promise<MonthlyStats> {
  const [year, month] = yearMonth.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // last day of month

  const { data, error } = await client
    .from("workouts")
    .select("duration, volume, category, workout_date")
    .eq("user_id", userId)
    .gte("workout_date", startDate.toISOString().slice(0, 10))
    .lte("workout_date", endDate.toISOString().slice(0, 10));

  if (error) throw error;

  const categories: Record<string, number> = {};
  let sessions = 0;
  let minutes = 0;
  let volume = 0;

  for (const workout of data) {
    sessions++;
    minutes += workout.duration;
    volume += workout.volume;
    categories[workout.category] = (categories[workout.category] || 0) + 1;
  }

  return { sessions, minutes, volume, categories };
}

/** Get full analytics summary for the dashboard. */
export async function getAnalyticsSummary(
  client: SupabaseClient<Database>,
  userId: string
): Promise<AnalyticsSummary> {
  const today = todayISO();
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  const currentYearMonth = `${currentYear}-${currentMonth}`;

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastYearMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const [weeklyActivity, streakInfo, currentMonthStats, lastMonthStats] =
    await Promise.all([
      getWeeklyActivity(client, userId, today),
      getStreakInfo(client, userId),
      getMonthlyStats(client, userId, currentYearMonth),
      getMonthlyStats(client, userId, lastYearMonth),
    ]);

  // Calculate consistency: percentage of days in month with at least one workout
  const daysInMonth = new Date(currentYear, parseInt(currentMonth), 0).getDate();
  // Actually count unique workout dates for proper consistency
  const { data: workoutDates } = await client
    .from("workouts")
    .select("workout_date")
    .eq("user_id", userId)
    .gte("workout_date", `${currentYearMonth}-01`)
    .lte("workout_date", `${currentYearMonth}-${String(daysInMonth).padStart(2, "0")}`)
    .limit(500);

  const uniqueWorkoutDays = new Set((workoutDates || []).map((w) => w.workout_date)).size;
  const consistency = Math.min(100, Math.round((uniqueWorkoutDays / daysInMonth) * 100));

  // Sessions this month vs last month for change calculation
  const sessionsChange =
    lastMonthStats.sessions > 0
      ? Math.round(((currentMonthStats.sessions - lastMonthStats.sessions) / lastMonthStats.sessions) * 100)
      : currentMonthStats.sessions > 0
        ? 100
        : 0;

  return {
    weeklyActivity,
    currentStreak: streakInfo.currentStreak,
    longestStreak: streakInfo.longestStreak,
    sessionsThisMonth: currentMonthStats.sessions,
    minutesThisMonth: currentMonthStats.minutes,
    volumeThisMonth: currentMonthStats.volume,
    sessionsLastMonth: lastMonthStats.sessions,
    minutesLastMonth: lastMonthStats.minutes,
    consistency: Math.min(consistency, 100),
    categoryBreakdown: currentMonthStats.categories,
  };
}

/** Get the most recent workout date for the given user. */
export async function getMostRecentWorkoutDate(
  client: SupabaseClient<Database>,
  userId: string
): Promise<string | null> {
  const { data, error } = await client
    .from("workouts")
    .select("workout_date")
    .eq("user_id", userId)
    .order("workout_date", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0]?.workout_date ?? null;
}

/** Get workouts for a specific date range. */
export async function getWorkoutsInRange(
  client: SupabaseClient<Database>,
  userId: string,
  startDate: string,
  endDate: string
): Promise<Workout[]> {
  const { data, error } = await client
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("workout_date", startDate)
    .lte("workout_date", endDate)
    .order("workout_date", { ascending: false });

  if (error) throw error;
  return data.map(toWorkout);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}