import { Activity, Clock3, Dumbbell, HeartPulse, Trash2 } from "lucide-react";
import type { Workout } from "@/lib/types/workout";

type WorkoutListProps = {
  workouts: Workout[];
  unit: "kg" | "lb";
  compact?: boolean;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
};

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (value === today) return "Today";
  if (value === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

export function WorkoutList({ workouts, unit, compact = false, onDelete, emptyMessage = "No workouts match that search. Try another name or type." }: WorkoutListProps) {
  if (!workouts.length) return <div className="empty-state">{emptyMessage}</div>;

  return (
    <div className={`workout-list${compact ? "" : " workout-list-full"}`}>
      {workouts.map((workout) => (
        <div className="workout-row" key={workout.id}>
          <span className="workout-type-icon">{workout.category === "Running" ? <HeartPulse size={16} /> : workout.category === "Mobility" ? <Activity size={16} /> : <Dumbbell size={16} />}</span>
          <div><div className="workout-name">{workout.title}</div><div className="workout-category">{workout.category}</div></div>
          <span className="workout-volume">{workout.volume ? `${unit === "kg" ? Math.round(workout.volume / 2.205).toLocaleString() : workout.volume.toLocaleString()} ${unit}` : "—"}</span>
          <span className={`workout-duration${compact ? " mobile-duration" : ""}`}><Clock3 size={12} />{workout.duration} min</span>
          <span className="workout-date">{formatDate(workout.date)}</span>
          {!compact && <span className="row-action">{onDelete && <button className="delete-button" aria-label={`Remove ${workout.title}`} onClick={() => onDelete(workout.id)}><Trash2 size={14} /></button>}</span>}
        </div>
      ))}
    </div>
  );
}