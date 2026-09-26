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