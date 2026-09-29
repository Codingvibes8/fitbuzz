"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Dumbbell, Clock3, Flame, HeartPulse, Trophy, TrendingUp } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { StatCard } from "@/components/dashboard/stat-card";
import { GoalRow } from "@/components/dashboard/goal-row";
import { useDashboard } from "../dashboard-provider";
import { useFeatureAccess } from "../shared";

export default function ProgressPage() {
  const { user } = useDashboard();
  const { hasAccess } = useFeatureAccess("advancedAnalytics");
  const [analytics, setAnalytics] = useState<{
    sessionsThisMonth: number;
    minutesThisMonth: number;
    currentStreak: number;
    longestStreak: number;
    consistency: number;
    categoryBreakdown: Record<string, number>;
    sessionsLastMonth: number;
  } | null>(null);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        const [summaryRes, streakRes] = await Promise.all([
          fetch(`/api/analytics?type=summary`),
          fetch(`/api/analytics?type=streak`),
        ]);
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          if (active) setAnalytics(s.summary || null);
        }
        if (streakRes.ok) {
          const s = await streakRes.json();
          if (active) setStreakData(s.streak || null);
        }
      } catch {
        // silent
      }
    }
    void load();
    return () => { active = false; };
  }, [user]);

  if (!hasAccess) {
    return (
      <div className="feature-locked">
        <div className="feature-locked-icon"><TrendingUp size={32} /></div>
        <h2>Unlock Advanced Analytics</h2>
        <p>Get deeper insights into your training with 6-month progress charts, exercise distribution, and AI-powered recommendations.</p>
        <ul className="feature-locked-benefits">
          <li><Check size={16} /> 6-month progress trends</li>
          <li><Check size={16} /> Exercise type distribution</li>
          <li><Check size={16} /> Monthly breakdown & insights</li>
          <li><Check size={16} /> AI-powered recommendations</li>
        </ul>
        <button
          className="primary-button"
          onClick={() => {}}
        >
          <TrendingUp size={14} /> Upgrade to Pro
        </button>
      </div>
    );
  }

  const currentStreak = streakData?.currentStreak ?? analytics?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? analytics?.longestStreak ?? 0;
  const sessionsThisMonth = analytics?.sessionsThisMonth ?? 0;
  const minutesThisMonth = analytics?.minutesThisMonth ?? 0;
  const consistency = analytics?.consistency ?? 0;
  const categoryBreakdown = analytics?.categoryBreakdown ?? {};

  return (
    <>
      <PageHeading
        eyebrow="The work is working"
        title="Your progress"
        description="A wider view of the habits you're building."
        action={<button className="secondary-button" onClick={() => {}}><TrendingUp size={14} /> This month <ChevronDown size={13} /></button>}
      />

      <section className="stats-grid">
        <StatCard
          label="Sessions completed"
          value={String(sessionsThisMonth)}
          unit="this month"
          change={analytics?.sessionsLastMonth ? `+${Math.round((sessionsThisMonth - analytics.sessionsLastMonth) / Math.max(analytics.sessionsLastMonth, 1) * 100)}%` : "New"}
          detail="vs last month"
          icon={Dumbbell}
        />
        <StatCard
          label="Time well spent"
          value={String(minutesThisMonth)}
          unit="min"
          change={analytics?.sessionsLastMonth ? `+${Math.round((minutesThisMonth - (analytics.sessionsLastMonth * 45)) / Math.max(analytics.sessionsLastMonth * 45, 1) * 100)}%` : "New"}
          detail="vs last month"
          icon={Clock3}
        />
        <StatCard
          label="Training streak"
          value={String(currentStreak)}
          unit="days"
          change={`Best: ${longestStreak} days`}
          detail="personal best"
          icon={Flame}
        />
        <StatCard
          label="Consistency"
          value={String(consistency)}
          unit="%"
          change={consistency >= 80 ? "On track" : consistency >= 50 ? "Building" : "Keep going"}
          detail="monthly goal"
          icon={Trophy}
        />
      </section>

      <div className="progress-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2 className="panel-title">Monthly milestones</h2>
              <p className="panel-note">Small wins worth noticing.</p>
            </div>
            <span className="program-status">{new Intl.DateTimeFormat("en", { month: "long" }).format(new Date())}</span>
          </div>
          <div className="goal-list">
            <GoalRow
              icon={Dumbbell}
              title="Training sessions"
              help="Goal: 16 sessions this month"
              value={`${sessionsThisMonth} / 16`}
              progress={`${Math.min(100, Math.round((sessionsThisMonth / 16) * 100))}%`}
            />
            <GoalRow
              icon={Clock3}
              title="Active minutes"
              help="Goal: 720 minutes this month"
              value={`${minutesThisMonth} / 720`}
              progress={`${Math.min(100, Math.round((minutesThisMonth / 720) * 100))}%`}
            />
            <GoalRow
              icon={Flame}
              title="Keep the streak alive"
              help="Goal: 5 days in a row"
              value={`${currentStreak} / 5 days`}
              progress={`${Math.min(100, Math.round((currentStreak / 5) * 100))}%`}
            />
            <GoalRow
              icon={HeartPulse}
              title="Make time to recover"
              help="Goal: 4 mobility sessions"
              value={`${categoryBreakdown["Mobility"] || 0} / 4`}
              progress={`${Math.min(100, Math.round(((categoryBreakdown["Mobility"] || 0) / 4) * 100))}%`}
            />
          </div>
        </section>

        <section className="streak-panel">
          <div>
            <div className="streak-top">
              <span className="streak-title">YOUR CURRENT STREAK</span>
              <span className="streak-fire"><Flame size={17} /></span>
            </div>
            <div className="streak-number">
              {String(currentStreak).padStart(2, "0")}
            </div>
            <div className="streak-caption">days of showing up. That's something.</div>
          </div>
          <div className="streak-days">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div className="streak-day" key={`${day}-${index}`}>
                <span className={`streak-day-dot${index < currentStreak ? " done" : ""}`}>
                  {index < currentStreak ? <Check size={11} /> : ""}
                </span>
                {day}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Check({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>; }
