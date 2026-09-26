"use client";

import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  LayoutDashboard,
  ListFilter,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { GoalRow } from "@/components/dashboard/goal-row";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SettingRow } from "@/components/dashboard/setting-row";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkoutList } from "@/components/dashboard/workout-list";
import type { Workout } from "@/lib/types/workout";

type View = "Overview" | "Workouts" | "Training plans" | "Progress" | "Settings";

const STORAGE_KEY = "fitflow-workouts-v1";
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const seedWorkouts: Workout[] = [
  { id: 6, title: "Upper body strength", category: "Strength", duration: 52, volume: 8420, date: todayISO() },
  { id: 5, title: "Tempo run", category: "Running", duration: 38, volume: 0, date: dateOffset(-1) },
  { id: 4, title: "Lower body power", category: "Strength", duration: 61, volume: 11250, date: dateOffset(-2) },
  { id: 3, title: "Mobility & recovery", category: "Mobility", duration: 24, volume: 0, date: dateOffset(-3) },
  { id: 2, title: "Pull day", category: "Strength", duration: 47, volume: 7350, date: dateOffset(-5) },
  { id: 1, title: "Easy morning run", category: "Running", duration: 31, volume: 0, date: dateOffset(-6) },
];
const weeklyActivity = [
  { day: "Mon", minutes: 38 },
  { day: "Tue", minutes: 55 },
  { day: "Wed", minutes: 24 },
  { day: "Thu", minutes: 0 },
  { day: "Fri", minutes: 48 },
  { day: "Sat", minutes: 61 },
  { day: "Sun", minutes: 52 },
];
const templates = [
  { title: "Full body reset", detail: "A balanced start-to-finish strength session.", duration: 40, category: "Strength", icon: Dumbbell },
  { title: "Easy miles", detail: "A conversational pace run to build your base.", duration: 30, category: "Running", icon: HeartPulse },
  { title: "Move better", detail: "Loosen up and recover with guided mobility.", duration: 25, category: "Mobility", icon: Activity },
];
const programs = [
  { title: "Stronger foundations", detail: "A steady four-week strength progression.", weeks: "Week 2 of 4", progress: 43, status: "In progress" },
  { title: "Run your first 5K", detail: "Three approachable runs each week.", weeks: "Week 1 of 6", progress: 17, status: "In progress" },
  { title: "Everyday mobility", detail: "Small daily sessions to move freely.", weeks: "Week 3 of 3", progress: 72, status: "In progress" },
];
const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Workouts", icon: Dumbbell },
  { label: "Training plans", icon: CalendarDays },
  { label: "Progress", icon: TrendingUp },
  { label: "Settings", icon: Settings2 },
];
const formatDate = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  if (value === todayISO()) return "Today";
  if (value === dateOffset(-1)) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
};
const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export default function Home() {
  const [view, setView] = useState<View>("Overview");
  const [workouts, setWorkouts] = useState<Workout[]>(seedWorkouts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All types");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unit, setUnit] = useState<"kg" | "lb">("lb");
  const [reminders, setReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [period, setPeriod] = useState("This week");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setWorkouts(JSON.parse(saved) as Workout[]);
    } catch {
      setToast("Saved sessions could not be loaded on this device.");
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  const filteredWorkouts = useMemo(() => workouts.filter((workout) => {
    const matchesSearch = `${workout.title} ${workout.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All types" || workout.category === category);
  }), [workouts, search, category]);
  const todayWorkouts = workouts.filter((workout) => workout.date === todayISO());
  const weekMinutes = workouts.filter((workout) => workout.date >= dateOffset(-6)).reduce((total, workout) => total + workout.duration, 0);
  const totalVolume = todayWorkouts.reduce((total, workout) => total + workout.volume, 0);
  const todaysVolume = unit === "kg" ? Math.round(totalVolume / 2.205).toLocaleString() : totalVolume.toLocaleString();
  const maxBar = period === "This week" ? 70 : 80;
  const dateLabel = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  function switchView(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
    if (nextView !== "Workouts") setSearch("");
  }

  function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    if (!title) return;
    const workout: Workout = {
      id: Date.now(),
      title,
      category: String(data.get("category")),
      duration: Number(data.get("duration")) || 0,
      volume: Number(data.get("volume")) || 0,
      date: todayISO(),
    };
    const updated = [workout, ...workouts];
    setWorkouts(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setToast("Workout added to your training log.");
    } catch {
      setToast("Workout added for this session, but could not be saved on this device.");
    }
    setModalOpen(false);
    setView("Overview");
  }

  function addTemplate(title: string, workoutCategory: string, duration: number) {
    const workout = { id: Date.now(), title, category: workoutCategory, duration, volume: 0, date: todayISO() };
    const updated = [workout, ...workouts];
    setWorkouts(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setToast(`${title} added to your training log.`);
    } catch {
      setToast(`${title} added for this session.`);
    }
    setView("Overview");
  }

  function deleteWorkout(id: number) {
    const updated = workouts.filter((workout) => workout.id !== id);
    setWorkouts(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setToast("Workout removed from your log.");
    } catch {
      setToast("Workout removed for this session.");
    }
  }

  const openLog = (title = "") => {
    setModalOpen(true);
    if (title) window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[name='title']");
      if (input) input.value = title;
    }, 0);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark"><Activity size={18} strokeWidth={2.5} /></span>
          <span className="brand-name">fitbuzz<span>.</span></span>
        </div>
        <p className="sidebar-label">Training space</p>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item${view === label ? " active" : ""}`} onClick={() => switchView(label)} aria-current={view === label ? "page" : undefined}>
              <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span>
              <span className="nav-label">{label}</span>
              {label === "Workouts" && <span className="nav-count">{workouts.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <section className="sidebar-coach">
          <span className="coach-orbit" />
          <div className="coach-kicker"><Sparkles size={12} /> Your next step</div>
          <p className="coach-title">Small steps. Strong habits.</p>
          <button className="coach-link" onClick={() => switchView("Training plans")}>Explore your plans <ChevronRight size={13} /></button>
        </section>
        <div className="profile">
          <span className="avatar" aria-hidden="true">JD</span>
          <div className="profile-copy"><div className="profile-name">Jordan Davis</div><div className="profile-plan">Free member</div></div>
          <ChevronDown className="profile-more" size={15} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="icon-button mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileNavOpen(!mobileNavOpen)}><Menu size={17} /></button>
            <span>Training space</span><ChevronRight size={13} /><strong>{view}</strong>
          </div>
          <div className="top-actions">
            <label className="search-wrap" aria-label="Search workouts">
              <Search className="search-icon" size={15} />
              <input aria-label="Search" placeholder="Search workouts" value={search} onChange={(event) => { setSearch(event.target.value); if (event.target.value) setView("Workouts"); }} />
            </label>
            <button className="icon-button" aria-label="Notifications" onClick={() => setToast("You’re all caught up. Nice work.")}><Bell size={16} /><span className="notification-dot" /></button>
          </div>
        </header>

        <div className="content">
          {view === "Overview" && (
            <>
              <PageHeading eyebrow={dateLabel} title={`${greeting()}, Jordan`} description="You showed up for yourself today. Here’s your week at a glance." action={<button className="primary-button" onClick={() => openLog()}><Plus size={15} strokeWidth={2.5} /> Log workout</button>} />

              <section className="stats-grid" aria-label="Weekly workout statistics">
                <StatCard label="Workouts this week" value={String(workouts.filter((workout) => workout.date >= dateOffset(-6)).length)} unit="sessions" change="2" detail="vs last week" icon={Dumbbell} />
                <StatCard label="Active minutes" value={String(weekMinutes)} unit="min" change="12%" detail="vs last week" icon={Clock3} />
                <StatCard label="Current streak" value="4" unit="days" change="Personal best: 9" detail="keep it rolling" icon={Flame} />
                <StatCard label="Today’s volume" value={todaysVolume} unit={unit} change={todayWorkouts.length ? "Logged today" : "Ready when you are"} detail="strength work" icon={Zap} />
              </section>

              <div className="dashboard-grid">
                <section className="panel" aria-labelledby="activity-title">
                  <div className="panel-heading">
                    <div><h2 className="panel-title" id="activity-title">Your activity</h2><p className="panel-note">A little consistency goes a long way.</p></div>
                    <div className="range-select" aria-label="Activity range">
                      {["This week", "Last week"].map((item) => <button key={item} className={`range-option${period === item ? " selected" : ""}`} onClick={() => setPeriod(item)}>{item}</button>)}
                    </div>
                  </div>
                  <div className="chart-wrap">
                    <div className="chart-summary"><span className="chart-total">{period === "This week" ? weekMinutes : 284}</span><span className="chart-unit">active minutes</span></div>
                    <div className="bar-chart" role="img" aria-label={`${weekMinutes} active minutes this week, shown across seven days`}>
                      {weeklyActivity.map((point, index) => <div className="chart-day" key={point.day}>
                        <div className="bar-zone"><div className={`bar-column${index === 6 && period === "This week" ? " current" : ""}`} style={{ height: `${Math.max(point.minutes, 5) / maxBar * 100}%` }} title={`${point.minutes} minutes`} /></div>
                        <span className="day-label">{point.day}</span>
                      </div>)}
                    </div>
                    <div className="chart-foot"><span className="chart-legend"><i className="legend-dot" /> Active minutes</span><span className="goal-note"><Target size={12} /> Weekly goal: 300 min</span></div>
                  </div>
                </section>

                <section className="feature-card" aria-label="Suggested workout">
                  <img className="feature-photo" src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=850&q=85" alt="Sunlit strength training space" />
                  <span className="feature-tag"><Sparkles size={11} /> Pick up where you left off</span>
                  <h2 className="feature-title">Strong start, steady finish.</h2>
                  <p className="feature-description">Upper body strength · from your recent sessions</p>
                  <div className="feature-meta"><span><Clock3 size={13} /> 45 min</span><span><Dumbbell size={13} /> Strength</span></div>
                  <button className="feature-button" onClick={() => openLog("Upper body strength")}>Start this session <ArrowRight size={15} /></button>
                </section>

                <section className="panel recent-panel" aria-labelledby="recent-title">
                  <div className="panel-heading"><div><h2 className="panel-title" id="recent-title">Recent workouts</h2><p className="panel-note">Your effort adds up.</p></div><button className="text-button" onClick={() => switchView("Workouts")}>View all <ArrowRight size={13} /></button></div>
                  <WorkoutList workouts={workouts.slice(0, 4)} unit={unit} compact />
                </section>
              </div>
            </>
          )}

          {view === "Workouts" && (
            <>
              <PageHeading eyebrow="Your training log" title="Workouts" description="Every session counts. Keep track of the work you put in." action={<button className="primary-button" onClick={() => openLog()}><Plus size={15} strokeWidth={2.5} /> Log workout</button>} />
              <div className="section-toolbar"><h2>Quick start</h2><span className="page-subtitle">Pick a session to add it to today.</span></div>
              <div className="template-grid">{templates.map(({ title, detail, duration, category: workoutCategory, icon: Icon }) => <article className="template-card" key={title}><div className="template-card-head"><span className="template-icon"><Icon size={17} /></span><span className="template-length">{duration} min</span></div><h3>{title}</h3><p>{detail}</p><button className="template-log" onClick={() => addTemplate(title, workoutCategory, duration)}>Add session <ArrowRight size={12} /></button></article>)}</div>
              <section className="panel workouts-full">
                <div className="panel-heading"><div><h2 className="panel-title">All sessions</h2><p className="panel-note">{filteredWorkouts.length} {filteredWorkouts.length === 1 ? "workout" : "workouts"} in your log</p></div><div className="workout-filters"><ListFilter size={14} color="#858c81" /><select className="filter-select" aria-label="Filter workout type" value={category} onChange={(event) => setCategory(event.target.value)}><option>All types</option><option>Strength</option><option>Running</option><option>Mobility</option><option>Cardio</option></select></div></div>
                <WorkoutList workouts={filteredWorkouts} unit={unit} onDelete={deleteWorkout} />
              </section>
            </>
          )}

          {view === "Training plans" && (
            <>
              <PageHeading eyebrow="Find your rhythm" title="Training plans" description="A little structure, with plenty of room to make it yours." action={<button className="secondary-button" onClick={() => setToast("More training plans are on the way.")}><Sparkles size={14} /> Explore plans</button>} />
              <section className="plan-banner"><div className="plan-banner-copy"><p className="eyebrow"><span className="eyebrow-mark" />Your current focus</p><h2>Stronger foundations</h2><p>Build strength at your own pace with three considered sessions each week.</p><div className="plan-metrics"><span className="plan-metric"><CalendarDays size={13} /> Week 2 of 4</span><span className="plan-metric"><Dumbbell size={13} /> 3 sessions / week</span><span className="plan-metric"><Check size={13} /> 4 of 9 complete</span></div></div><div className="plan-banner-art" role="img" aria-label="Strength training equipment in a gym" /></section>
              <div className="section-toolbar"><h2>Your programs</h2><span className="page-subtitle">Pick up right where you left off.</span></div>
              <div className="program-grid">{programs.map((program) => <article className="program-card" key={program.title}><div className="program-top"><span className="template-icon"><Target size={17} /></span><span className="program-status">{program.status}</span></div><h3>{program.title}</h3><p>{program.detail}</p><div className="program-progress"><span style={{ width: `${program.progress}%` }} /></div><div className="program-footer"><span>{program.weeks}</span><span>{program.progress}%</span></div></article>)}</div>
            </>
          )}

          {view === "Progress" && (
            <>
              <PageHeading eyebrow="The work is working" title="Your progress" description="A wider view of the habits you’re building." action={<button className="secondary-button" onClick={() => setToast("Your progress summary is up to date.")}><TrendingUp size={14} /> This month <ChevronDown size={13} /></button>} />
              <section className="stats-grid"><StatCard label="Sessions completed" value="14" unit="this month" change="3" detail="vs last month" icon={Dumbbell} /><StatCard label="Time well spent" value="612" unit="min" change="8%" detail="vs last month" icon={Clock3} /><StatCard label="Training streak" value="4" unit="days" change="Best: 9 days" detail="personal best" icon={Flame} /><StatCard label="Consistency" value="78" unit="%" change="On track" detail="monthly goal" icon={Trophy} /></section>
              <div className="progress-grid">
                <section className="panel"><div className="panel-heading"><div><h2 className="panel-title">Monthly milestones</h2><p className="panel-note">Small wins worth noticing.</p></div><span className="program-status">September</span></div><div className="goal-list"><GoalRow icon={Dumbbell} title="Training sessions" help="Goal: 16 sessions this month" value="14 / 16" progress="88%" /><GoalRow icon={Clock3} title="Active minutes" help="Goal: 720 minutes this month" value="612 / 720" progress="85%" /><GoalRow icon={Flame} title="Keep the streak alive" help="Goal: 5 days in a row" value="4 / 5 days" progress="80%" /><GoalRow icon={HeartPulse} title="Make time to recover" help="Goal: 4 mobility sessions" value="3 / 4" progress="75%" /></div></section>
                <section className="streak-panel"><div><div className="streak-top"><span className="streak-title">YOUR CURRENT STREAK</span><span className="streak-fire"><Flame size={17} /></span></div><div className="streak-number">04</div><div className="streak-caption">days of showing up. That’s something.</div></div><div className="streak-days">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <div className="streak-day" key={`${day}-${index}`}><span className={`streak-day-dot${index < 4 ? " done" : ""}`}>{index < 4 ? <Check size={11} /> : ""}</span>{day}</div>)}</div></section>
              </div>
            </>
          )}

          {view === "Settings" && (
            <>
              <PageHeading eyebrow="Make it feel like yours" title="Settings" description="A few preferences for your FitBuzz space." />
              <section className="panel settings-panel">
                <SettingRow title="Units" help="Choose how your training numbers are shown."><div className="unit-toggle"><button className={`unit-choice${unit === "lb" ? " active" : ""}`} onClick={() => setUnit("lb")}>lb</button><button className={`unit-choice${unit === "kg" ? " active" : ""}`} onClick={() => setUnit("kg")}>kg</button></div></SettingRow>
                <SettingRow title="Workout reminders" help="A gentle nudge for your planned training days."><button className={`toggle${reminders ? " on" : ""}`} aria-label="Toggle workout reminders" aria-pressed={reminders} onClick={() => setReminders(!reminders)} /></SettingRow>
                <SettingRow title="Weekly progress recap" help="A short summary of your training each Sunday."><button className={`toggle${weeklyReport ? " on" : ""}`} aria-label="Toggle weekly progress recap" aria-pressed={weeklyReport} onClick={() => setWeeklyReport(!weeklyReport)} /></SettingRow>
                <SettingRow title="Your account" help="Jordan Davis · jordan@example.com"><button className="secondary-button" onClick={() => setToast("Account settings are available in your profile.")}>Manage <ArrowRight size={13} /></button></SettingRow>
              </section>
            </>
          )}
        </div>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="log-title">
          <div className="modal-top"><div><h2 className="modal-title" id="log-title">Log a workout</h2><p className="modal-copy">Add a session to your training log.</p></div><button className="modal-close" aria-label="Close" onClick={() => setModalOpen(false)}><X size={16} /></button></div>
          <form onSubmit={saveWorkout}>
            <div className="form-grid">
              <label className="form-field full"><span className="form-label">Workout name</span><input className="form-input" name="title" placeholder="e.g. Evening strength session" autoFocus required maxLength={80} /></label>
              <label className="form-field"><span className="form-label">Workout type</span><select className="form-select" name="category"><option>Strength</option><option>Running</option><option>Mobility</option><option>Cardio</option></select></label>
              <label className="form-field"><span className="form-label">Duration (minutes)</span><input className="form-input" name="duration" type="number" min="1" max="600" defaultValue="45" required /></label>
              <label className="form-field full"><span className="form-label">Weight moved ({unit}) · optional</span><input className="form-input" name="volume" type="number" min="0" max="100000" placeholder="e.g. 8400" /></label>
            </div>
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit"><Check size={14} /> Save workout</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
    </div>
  );
}
