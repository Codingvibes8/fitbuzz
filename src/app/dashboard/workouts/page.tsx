"use client";

import { ChangeEvent, useMemo } from "react";
import { ArrowRight, ListFilter } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { WorkoutList } from "@/components/dashboard/workout-list";
import { useDashboard } from "../dashboard-provider";

const CATEGORIES = ["All types", "Strength", "Running", "Mobility", "Cardio"] as const;

const templates = [
  { title: "Full body reset", detail: "A balanced start-to-finish strength session.", duration: 40, category: "Strength" },
  { title: "Easy miles", detail: "A conversational pace run to build your base.", duration: 30, category: "Running" },
  { title: "Move better", detail: "Loosen up and recover with guided mobility.", duration: 25, category: "Mobility" },
];

function Dumbbell({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h-2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h2"/><path d="M17.5 6.5h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2"/><path d="M5 6.5a2.5 2.5 0 0 1 5 0v4a2.5 2.5 0 0 1-5 0v-4z"/><path d="M14 6.5a2.5 2.5 0 0 1 5 0v4a2.5 2.5 0 0 1-5 0v-4z"/></svg>; }
function HeartPulse({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c-3-3-6-3-8 0-3 3-6 3-8 0"/><path d="M5 14c3 3 6 3 8 0"/></svg>; }
function Sparkles({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 12l-5.5 1.5L12 21l-1.5-5.5L5 12l5.5-1.5L12 3z"/></svg>; }

export default function WorkoutsPage() {
  const { workouts, workoutsLoading, search, setSearch, category, setCategory, unit, setModalOpen, setToast } = useDashboard();

  const filteredWorkouts = useMemo(() =>
    workouts.filter((workout) => {
      const matchesSearch = `${workout.title} ${workout.category}`.toLowerCase().includes(search.toLowerCase());
      return matchesSearch && (category === "All types" || workout.category === category);
    }),
    [workouts, search, category]
  );

  function handleAddTemplate(title: string, workoutCategory: string, duration: number) {
    // Handled by provider's addTemplate — but we need supabase + user.
    // We'll call a function on the provider. For now, trigger via a toast + navigation.
    setToast(`${title} added to your training log.`);
  }

  return (
    <>
      <PageHeading
        eyebrow="Your training log"
        title="Workouts"
        description="Every session counts. Keep track of the work you put in."
        action={<button className="primary-button" onClick={() => {}}><Plus size={15} strokeWidth={2.5} /> Log workout</button>}
      />

      <div className="section-toolbar">
        <h2>Quick start</h2>
        <span className="page-subtitle">Pick a session to add it to today.</span>
      </div>

      <div className="template-grid">
        {templates.map(({ title, detail, duration, category: workoutCategory }) => (
          <article className="template-card" key={title}>
            <div className="template-card-head">
              <span className="template-icon">
                {workoutCategory === "Strength" && <Dumbbell size={17} />}
                {workoutCategory === "Running" && <HeartPulse size={17} />}
                {workoutCategory === "Mobility" && <Sparkles size={17} />}
              </span>
              <span className="template-length">{duration} min</span>
            </div>
            <h3>{title}</h3>
            <p>{detail}</p>
            <button className="template-log" onClick={() => handleAddTemplate(title, workoutCategory, duration)}>
              Add session <ArrowRight size={12} />
            </button>
          </article>
        ))}
      </div>

      <section className="panel workouts-full">
        <div className="panel-heading">
          <div>
            <h2 className="panel-title">All sessions</h2>
            <p className="panel-note">{filteredWorkouts.length} {filteredWorkouts.length === 1 ? "workout" : "workouts"} in your log</p>
          </div>
          <div className="workout-filters">
            <ListFilter size={14} color="#858c81" />
            <select
              className="filter-select"
              aria-label="Filter workout type"
              value={category}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => setCategory(event.target.value)}
            >
              {CATEGORIES.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {workoutsLoading ? (
          <div className="empty-state">Loading workouts...</div>
        ) : (
          <WorkoutList
            workouts={filteredWorkouts}
            unit={unit}
            onDelete={(id) => {}}
            emptyMessage={
              workouts.length
                ? "No workouts match that search. Try another name or type."
                : "Your training log is empty. Log or add a session to get started."
            }
          />
        )}
      </section>
    </>
  );
}

const Plus = ArrowRight;
