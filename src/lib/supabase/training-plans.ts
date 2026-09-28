import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type PlanCategory = "Strength" | "Running" | "Mobility" | "Cardio" | "Mixed";
export type PlanDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type PlanStatus = "active" | "completed" | "paused";

export interface TrainingPlan {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: PlanCategory;
  difficulty: PlanDifficulty;
  duration_weeks: number;
  sessions_per_week: number;
  target_outcome: string | null;
  is_ai_generated: boolean;
  plan_template: Record<string, unknown> | null;
  status: PlanStatus;
  current_week: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  progress?: number; // 0-100, calculated from plan_sessions
  total_sessions?: number;
  completed_sessions?: number;
}

export interface PlanSession {
  id: string;
  plan_id: string;
  week_number: number;
  session_number: number;
  title: string;
  description: string | null;
  category: PlanCategory;
  duration_minutes: number;
  exercises: Record<string, unknown>[] | null;
  order_index: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CreatePlanParams {
  title: string;
  description: string;
  category: PlanCategory;
  difficulty: PlanDifficulty;
  duration_weeks: number;
  sessions_per_week: number;
  target_outcome?: string;
  is_ai_generated?: boolean;
  plan_template?: Record<string, unknown>;
}

export interface UpdatePlanProgressParams {
  planId: string;
  sessionId: string;
  completed: boolean;
}

// ── Plan CRUD operations ────────────────────────────────────────────

export async function listTrainingPlans(
  client: SupabaseClient<Database>,
  userId: string,
  status?: PlanStatus
): Promise<TrainingPlan[]> {
  let query = client
    .from("training_plans")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  // Get completed sessions count for each plan
  const plansWithProgress: TrainingPlan[] = [];
  for (const plan of data) {
    // Safely get completed sessions count
    let completedSessions: number | null = null;
    try {
      const { count } = await client
        .from("plan_sessions")
        .select("id", { count: "exact", head: true })
        .eq("plan_id", plan.id)
        .eq("is_completed", true);
      completedSessions = count ?? 0;
    } catch {
      completedSessions = 0;
    }

    const template = plan.plan_template as Record<string, unknown> | null;
    const templateSessions = template?.sessions ? (template.sessions as unknown[]).length : 0;
    const total = Math.max(completedSessions ?? 0, templateSessions);

    plansWithProgress.push({
      ...plan,
      category: plan.category as PlanCategory,
      difficulty: plan.difficulty as PlanDifficulty,
      status: plan.status as PlanStatus,
      progress: total > 0 ? Math.round(((completedSessions ?? 0) / total) * 100) : 0,
      total_sessions: total,
      completed_sessions: completedSessions ?? 0,
    });
  }

  return plansWithProgress;
}

export async function getTrainingPlan(
  client: SupabaseClient<Database>,
  planId: string,
  userId: string
): Promise<TrainingPlan | null> {
  const { data, error } = await client
    .from("training_plans")
    .select("*")
    .eq("id", planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // Get all sessions for this plan
  const { data: sessions, error: sessionsError } = await client
    .from("plan_sessions")
    .select("*")
    .eq("plan_id", planId)
    .order("week_number", { ascending: true })
    .order("session_number", { ascending: true });

  if (sessionsError) throw sessionsError;

  // Get completed sessions count
  const { count: completedCount } = await client
    .from("plan_sessions")
    .select("*", { count: "exact", head: true })
    .eq("plan_id", planId)
    .eq("is_completed", true);

  const totalSessions = sessions?.length ?? 0;
  const completedSessions = completedCount ?? 0;

  return {
    ...data,
    plan_sessions: sessions ?? [],
    progress: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    total_sessions: totalSessions,
    completed_sessions: completedSessions,
  } as TrainingPlan;
}

export async function createTrainingPlan(
  client: SupabaseClient<Database>,
  userId: string,
  params: CreatePlanParams,
  sessions?: PlanSession[]
): Promise<TrainingPlan> {
  const { data, error } = await client
    .from("training_plans")
    .insert({
      user_id: userId,
      title: params.title,
      description: params.description,
      category: params.category,
      difficulty: params.difficulty,
      duration_weeks: params.duration_weeks,
      sessions_per_week: params.sessions_per_week,
      target_outcome: params.target_outcome ?? null,
      is_ai_generated: params.is_ai_generated ?? false,
      plan_template: params.plan_template ?? null,
      status: "active",
      current_week: 1,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Insert sessions if provided
  if (sessions && sessions.length > 0) {
    await client.from("plan_sessions").insert(
      sessions.map((session, index) => ({
        plan_id: data.id,
        week_number: session.week_number,
        session_number: session.session_number,
        title: session.title,
        description: session.description ?? null,
        category: session.category,
        duration_minutes: session.duration_minutes,
        exercises: session.exercises ?? null,
        order_index: session.order_index ?? index,
        is_completed: false,
      }))
    );
  }

  return {
    ...data,
    progress: 0,
    total_sessions: sessions?.length ?? 0,
    completed_sessions: 0,
  } as TrainingPlan;
}

export async function updatePlanProgress(
  client: SupabaseClient<Database>,
  userId: string,
  params: UpdatePlanProgressParams
): Promise<void> {
  // Verify ownership
  const { data: plan } = await client
    .from("training_plans")
    .select("id")
    .eq("id", params.planId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!plan) throw new Error("Plan not found");

  // Get current session status
  const { data: currentSession } = await client
    .from("plan_sessions")
    .select("is_completed")
    .eq("id", params.sessionId)
    .eq("plan_id", params.planId)
    .maybeSingle();

  if (!currentSession) throw new Error("Session not found");

  // Toggle session completion
  await client
    .from("plan_sessions")
    .update({
      is_completed: !currentSession.is_completed,
      completed_at: !currentSession.is_completed
        ? new Date().toISOString()
        : null,
    })
    .eq("id", params.sessionId);
}

export async function updatePlanWeek(
  client: SupabaseClient<Database>,
  userId: string,
  planId: string,
  weekNumber: number
): Promise<void> {
  const { error } = await client
    .from("training_plans")
    .update({ current_week: weekNumber, updated_at: new Date().toISOString() })
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function completePlan(
  client: SupabaseClient<Database>,
  userId: string,
  planId: string
): Promise<void> {
  const { error } = await client
    .from("training_plans")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function deleteTrainingPlan(
  client: SupabaseClient<Database>,
  userId: string,
  planId: string
): Promise<void> {
  const { error } = await client
    .from("training_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ── AI Plan Generation ──────────────────────────────────────────────

export interface AiPlanRequest {
  goal: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  availableDaysPerWeek: number;
  preferredCategories: PlanCategory[];
  hoursPerSession?: number;
}

export interface AiPlanResponse {
  plan: Omit<CreatePlanParams, "is_ai_generated"> & { is_ai_generated: true };
  sessions: PlanSession[];
  weeklySchedule: {
    week: number;
    sessions: {
      day: string;
      title: string;
      category: PlanCategory;
      duration: number;
      focus: string;
    }[];
  }[];
}

// AI-generated training plan templates based on user goals
// In production, this would call an LLM API (Claude, GPT, etc.)
export function generateAiPlan(request: AiPlanRequest): AiPlanResponse {
  const {
    goal,
    experienceLevel,
    availableDaysPerWeek,
    preferredCategories,
    hoursPerSession = 45,
  } = request;

  const difficultyMap = {
    beginner: "Beginner" as PlanDifficulty,
    intermediate: "Intermediate" as PlanDifficulty,
    advanced: "Advanced" as PlanDifficulty,
  };

  const durationMap = {
    beginner: 4,
    intermediate: 8,
    advanced: 12,
  };

  const weeks = durationMap[experienceLevel];
  const sessionsPerWeek = Math.min(availableDaysPerWeek, 6);

  // Generate sessions based on categories and goal
  const sessions: PlanSession[] = [];
  const weeklySchedule: AiPlanResponse["weeklySchedule"] = [];
  let sessionIndex = 0;

  // Session templates by category
  const sessionTemplates: Record<PlanCategory, { title: string; focus: string }[]> = {
    Strength: [
      { title: "Upper Body Strength", focus: "Push and pull movements" },
      { title: "Lower Body Power", focus: "Squat and hinge patterns" },
      { title: "Full Body Circuit", focus: "Compound movements" },
      { title: "Core & Stability", focus: "Core strengthening" },
    ],
    Running: [
      { title: "Easy Distance Run", focus: "Building aerobic base" },
      { title: "Tempo Run", focus: "Sustained effort" },
      { title: "Intervals", focus: "Speed and power" },
      { title: "Recovery Jog", focus: "Active recovery" },
    ],
    Mobility: [
      { title: "Full Body Stretch", focus: "Range of motion" },
      { title: "Hip Mobility Flow", focus: "Hip flexibility" },
      { title: "Upper Body Release", focus: "Shoulder and thoracic mobility" },
      { title: "Spinal Mobility", focus: "Back and neck relief" },
    ],
    Cardio: [
      { title: "Steady State Cardio", focus: "Endurance building" },
      { title: "HIIT Session", focus: "High intensity intervals" },
      { title: "Zone 2 Training", focus: "Fat burning zone" },
      { title: "Cardio Recovery", focus: "Light cardiovascular work" },
    ],
    Mixed: [
      { title: "Strength + Cardio Mix", focus: "Balanced conditioning" },
      { title: "Functional Training", focus: "Movement patterns" },
      { title: "Endurance Circuit", focus: " stamina and strength" },
      { title: "Recovery & Mobility", focus: "Active recovery" },
    ],
  };

  // Generate day labels
  const dayLabels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  for (let week = 1; week <= weeks; week++) {
    const weekSessions: AiPlanResponse["weeklySchedule"][0]["sessions"] = [];

    for (let day = 0; day < sessionsPerWeek; day++) {
      const category = preferredCategories[day % preferredCategories.length];
      const templates = sessionTemplates[category];
      const templateIndex = (week + day) % templates.length;
      const template = templates[templateIndex];

      // Progressive overload: increase duration slightly each week
      const baseDuration = Math.min(hoursPerSession, 60);
      const weekProgress = (week - 1) / weeks;
      const duration = Math.round(
        baseDuration + weekProgress * (experienceLevel === "advanced" ? 15 : experienceLevel === "intermediate" ? 10 : 5)
      );

      const session: PlanSession = {
        id: "",
        plan_id: "",
        week_number: week,
        session_number: day + 1,
        title: `${template.title} (Week ${week})`,
        description: `Focus on ${template.focus.toLowerCase()}. This session is part of your ${goal.toLowerCase()} journey.`,
        category,
        duration_minutes: duration,
        exercises: generateExercises(category, template.focus, difficultyMap[experienceLevel]),
        order_index: sessionIndex++,
        is_completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
      };

      sessions.push(session);
      weekSessions.push({
        day: dayLabels[day],
        title: session.title,
        category,
        duration,
        focus: template.focus,
      });
    }

    weeklySchedule.push({ week, sessions: weekSessions });
  }

  const plan: Omit<CreatePlanParams, "is_ai_generated"> & { is_ai_generated: true } = {
    title: capitalize(goal) + " Training Plan",
    description: `A personalized ${weeks}-week program designed to help you ${goal.toLowerCase()}. Includes ${sessionsPerWeek} sessions per week with progressive overload.`,
    category: preferredCategories[0],
    difficulty: difficultyMap[experienceLevel],
    duration_weeks: weeks,
    sessions_per_week: sessionsPerWeek,
    target_outcome: goal,
    is_ai_generated: true,
    plan_template: {
      goal,
      experienceLevel,
      sessionsPerWeek,
      weeks,
      weeklySchedule: weeklySchedule.map((w) => ({
        week: w.week,
        sessions: w.sessions.map((s) => ({
          day: s.day,
          title: s.title,
          category: s.category,
          duration: s.duration,
          focus: s.focus,
        })),
      })),
    },
  };

  return { plan, sessions, weeklySchedule };
}

function generateExercises(
  category: PlanCategory,
  focus: string,
  difficulty: PlanDifficulty
): Record<string, unknown>[] {
  const exerciseLibrary: Record<PlanCategory, { name: string; sets: number; reps: string; rest: string }[]> = {
    Strength: [
      { name: "Warm-up (dynamic stretching)", sets: 1, reps: "5 min", rest: "-" },
      { name: "Barbell Squat", sets: difficulty === "Beginner" ? 3 : 4, reps: "8-12", rest: "90 sec" },
      { name: "Bench Press", sets: difficulty === "Beginner" ? 3 : 4, reps: "8-12", rest: "90 sec" },
      { name: "Bent Over Row", sets: difficulty === "Beginner" ? 3 : 4, reps: "8-12", rest: "90 sec" },
      { name: "Overhead Press", sets: 3, reps: "10-12", rest: "60 sec" },
      { name: "Plank", sets: 3, reps: "30-60 sec", rest: "30 sec" },
    ],
    Running: [
      { name: "Warm-up Jog", sets: 1, reps: "5 min", rest: "-" },
      { name: "Main Run", sets: 1, reps: focus.includes("distance") ? "20-40 min" : focus.includes("tempo") ? "15-25 min" : "10-20 min", rest: "-" },
      { name: "Cool-down Jog", sets: 1, reps: "5 min", rest: "-" },
      { name: "Stretching", sets: 1, reps: "5-10 min", rest: "-" },
    ],
    Mobility: [
      { name: "Cat-Cow Stretch", sets: 2, reps: "10 reps", rest: "15 sec" },
      { name: "World's Greatest Stretch", sets: 2, reps: "5 each side", rest: "15 sec" },
      { name: "Hip Flexor Stretch", sets: 2, reps: "30 sec each", rest: "15 sec" },
      { name: "Thoracic Rotation", sets: 2, reps: "8 each side", rest: "15 sec" },
      { name: "Leg Swings", sets: 2, reps: "10 each direction", rest: "15 sec" },
    ],
    Cardio: [
      { name: "Warm-up", sets: 1, reps: "5 min light", rest: "-" },
      { name: focus.includes("HIIT") ? "Sprint Intervals" : "Steady Pace", sets: focus.includes("HIIT") ? 6 : 1, reps: focus.includes("HIIT") ? "30 sec sprint / 90 sec rest" : "20-40 min", rest: focus.includes("HIIT") ? "90 sec" : "-" },
      { name: "Cool-down", sets: 1, reps: "5 min", rest: "-" },
    ],
    Mixed: [
      { name: "Warm-up Circuit", sets: 1, reps: "5 min", rest: "-" },
      { name: "Kettlebell Swings", sets: 3, reps: "15-20", rest: "45 sec" },
      { name: "Push-ups", sets: 3, reps: "10-15", rest: "45 sec" },
      { name: "Mountain Climbers", sets: 3, reps: "30 sec", rest: "45 sec" },
      { name: "Jump Rope", sets: 3, reps: "1 min", rest: "30 sec" },
      { name: "Cool-down Stretch", sets: 1, reps: "5 min", rest: "-" },
    ],
  };

  return exerciseLibrary[category] ?? exerciseLibrary.Strength;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
