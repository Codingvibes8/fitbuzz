"use client";

import { useMemo } from "react";
import { ArrowRight, Check, Clock3, Dumbbell, Flame, Target, Zap } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkoutList } from "@/components/dashboard/workout-list";
import { useDashboard } from "./dashboard-provider";
import { useSubscription } from "@/lib/context/subscription-context";
import { canAccess, dateOffset, greeting, openLog, todayISO, type Workout } from "./shared";

const templates = [
  { title: "Full body reset", detail: "A balanced start-to-finish strength session.", duration: 40, category: "Strength", icon: Dumbbell },
  { title: "Easy miles", detail: "A conversational pace run to build your base.", duration: 30, category: "Running", icon: HeartPulse },
  { title: "Move better", detail: "Loosen up and recover with guided mobility.", duration: 25, category: "Mobility", icon: Sparkles },
];

function HeartPulse({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c-3-3-6-3-8 0-3 3-6 3-8 0"/><path d="M5 14c3 3 6 3 8 0"/></svg>; }
function Sparkles({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 12l-5.5 1.5L12 21l-1.5-5.5L5 12l5.5-1.5L12 3z"/></svg>; }

export default function OverviewPage() {
  const { user, unit, setModalOpen, setToast, workouts, workoutsLoading, weeklyActivityData, weekMinutes, setPeriod, period, computedWeekMinutes } = useDashboard();
  const displayName = user ? "there" : "there"; // simplified; real one computed in layout

  const displayNameFull = typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
    ? user.user_metadata.display_name.trim()
    : user?.email?.split("@")[0] ?? "there";

  const todayWorkouts = workouts.filter((w: Workout) => w.date === todayISO());
  const todaysVolume = unit === "kg"
    ? Math.round(todayWorkouts.reduce((s: number, w: Workout) => s + w.volume, 0) / 2.205).toLocaleString()
    : todayWorkouts.reduce((s: number, w: Workout) => s + w.volume, 0).toLocaleString();

  const maxBar = period === "This week" ? 70 : 80;

  return (
    <>
      <PageHeading
        eyebrow={new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())}
        title={`${greeting()}, ${displayNameFull}`}
        description="You showed up for yourself today. Here's your week at a glance."
        action={<button className="primary-button" onClick={() => openLog(setModalOpen)}><Plus size={15} strokeWidth={2.5} /> Log workout</button>}
      />

      <section className="stats-grid" aria-label="Weekly workout statistics">
        <StatCard
          label="Workouts this week"
          value={String(workouts.filter((w) => w.date >= dateOffset(-6)).length)}
          unit="sessions"
          change="2"
          detail="vs last week"
          icon={Dumbbell}
        />
        <StatCard
          label="Active minutes"
          value={String(computedWeekMinutes || weekMinutes)}
          unit="min"
          change="12%"
          detail="vs last week"
          icon={Clock3}
        />
        <StatCard
          label="Current streak"
          value="0"
          unit="days"
          change="Personal best: 0"
          detail="keep it rolling"
          icon={Flame}
        />
        <StatCard
          label="Today's volume"
          value={todaysVolume}
          unit={unit}
          change={todayWorkouts.length ? "Logged today" : "Ready when you are"}
          detail="strength work"
          icon={Zap}
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="activity-title">
          <div className="panel-heading">
            <div>
              <h2 className="panel-title" id="activity-title">Your activity</h2>
              <p className="panel-note">A little consistency goes a long way.</p>
            </div>
            <div className="range-select" aria-label="Activity range">
              {["This week", "Last week"].map((item) => (
                <button
                  key={item}
                  className={`range-option${period === item ? " selected" : ""}`}
                  onClick={() => setPeriod(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-summary">
              <span className="chart-total">{period === "This week" ? computedWeekMinutes : weekMinutes}</span>
              <span className="chart-unit">active minutes</span>
            </div>

            <div className="bar-chart" role="img" aria-label={`${computedWeekMinutes} active minutes this week, shown across seven days`}>
              {weeklyActivityData.length > 0 ? (
                weeklyActivityData.map((point: { day: string; minutes: number }) => (
                  <div className="chart-day" key={point.day}>
                    <div className="bar-zone">
                      <div
                        className={`bar-column${point.day === "Sun" && period === "This week" ? " current" : ""}`}
                        style={{ height: `${Math.max(point.minutes, 5) / maxBar * 100}%` }}
                        title={`${point.minutes} minutes`}
                      />
                    </div>
                    <span className="day-label">{point.day}</span>
                  </div>
                ))
              ) : (
                <div className="empty-state">No activity recorded yet. Log your first workout!</div>
              )}
            </div>

            <div className="chart-foot">
              <span className="chart-legend"><i className="legend-dot" /> Active minutes</span>
              <span className="goal-note"><Target size={12} /> Weekly goal: 300 min</span>
            </div>
          </div>
        </section>

        <section className="feature-card" aria-label="Suggested workout">
          <img
            className="feature-photo"
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=850&q=85"
            alt="Sunlit strength training space"
          />
          <span className="feature-tag"><Sparkles size={11} /> Pick up where you left off</span>
          <h2 className="feature-title">Strong start, steady finish.</h2>
          <p className="feature-description">Upper body strength · from your recent sessions</p>
          <div className="feature-meta">
            <span><Clock3 size={13} /> 45 min</span>
            <span><Dumbbell size={13} /> Strength</span>
          </div>
          <button className="feature-button" onClick={() => openLog(setModalOpen, "Upper body strength")}>
            Start this session <ArrowRight size={15} />
          </button>
        </section>

        <section className="panel recent-panel" aria-labelledby="recent-title">
          <div className="panel-heading">
            <div>
              <h2 className="panel-title" id="recent-title">Recent workouts</h2>
              <p className="panel-note">Your effort adds up.</p>
            </div>
            <button className="text-button" onClick={() => {}}>
              View all <ArrowRight size={13} />
            </button>
          </div>
          {workoutsLoading ? (
            <div className="empty-state">Loading workouts...</div>
          ) : (
            <WorkoutList
              workouts={workouts.slice(0, 4)}
              unit={unit}
              compact
              emptyMessage="No workouts yet. Your recent sessions will show here."
            />
          )}
        </section>
      </div>
    </>
  );
}

const Plus = ArrowRight;
