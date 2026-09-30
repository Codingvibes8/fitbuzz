"use client";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  CreditCard,
  Dumbbell,
  Flame,
  HeartPulse,
  LayoutDashboard,
  ListFilter,
  LogOut,
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
import type { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/auth-form";
import { GoalRow } from "@/components/dashboard/goal-row";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SettingRow } from "@/components/dashboard/setting-row";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkoutList } from "@/components/dashboard/workout-list";
import { Tooltip } from "@/components/ui/tooltip";
import type { SubscriptionSummary } from "@/lib/types/subscription";
import type { NewWorkout, Workout } from "@/lib/types/workout";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { insertWorkouts, listWorkouts, removeWorkout } from "@/lib/supabase/workouts";
import { useSubscription } from "@/lib/context/subscription-context";
import { useFeatureAccess } from "@/lib/hooks/useFeatureAccess";
import { canAccess, getApiLimit, TIER_FEATURES, type FeatureKey, type SubscriptionTier } from "@/lib/features";

type View = "Overview" | "Workouts" | "Training plans" | "Progress" | "Membership" | "Settings";

const STORAGE_KEY = "fitflow-workouts-v1";
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

// ── Types for real data ────────────────────────────────────────────

interface TrainingPlanData {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_weeks: number;
  sessions_per_week: number;
  status: string;
  current_week: number;
  progress: number;
  total_sessions: number;
  completed_sessions: number;
  is_ai_generated: boolean;
  target_outcome: string | null;
}

interface WeeklyActivityPoint {
  day: string;
  minutes: number;
}

interface AnalyticsSummary {
  weeklyActivity: WeeklyActivityPoint[];
  currentStreak: number;
  longestStreak: number;
  sessionsThisMonth: number;
  minutesThisMonth: number;
  volumeThisMonth: number;
  sessionsLastMonth: number;
  consistency: number;
  categoryBreakdown: Record<string, number>;
}

interface PlanSession {
  id: string;
  week_number: number;
  session_number: number;
  title: string;
  category: string;
  duration_minutes: number;
  is_completed: boolean;
  exercises: Record<string, unknown>[] | null;
}

// ── Static templates for quick-start ───────────────────────────────

const templates = [
  { title: "Full body reset", detail: "A balanced start-to-finish strength session.", duration: 40, category: "Strength", icon: Dumbbell },
  { title: "Easy miles", detail: "A conversational pace run to build your base.", duration: 30, category: "Running", icon: HeartPulse },
  { title: "Move better", detail: "Loosen up and recover with guided mobility.", duration: 25, category: "Mobility", icon: Sparkles },
];

const navItems: { label: View; icon: typeof LayoutDashboard }[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Workouts", icon: Dumbbell },
  { label: "Training plans", icon: CalendarDays },
  { label: "Progress", icon: TrendingUp },
  { label: "Membership", icon: CreditCard },
  { label: "Settings", icon: Settings2 },
];

const freeSubscription: SubscriptionSummary = { tier: "free", status: "free", stripe_subscription_id: null, current_period_end: null };

const tierDisplayFeatures: Record<SubscriptionTier, string[]> = {
  free: ["Core workout tracking", "100 API calls per month", "1 custom training plan"],
  pro: ["AI-powered features", "5,000 API calls per month", "Unlimited custom plans", "Advanced analytics"],
  elite: ["24/7 AI coach", "50,000 API calls per month", "API access for developers", "Priority support"],
};

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

function parseLegacyWorkouts(saved: string): NewWorkout[] {
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error("Saved workouts are not a list.");

  return parsed.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Saved workout is invalid.");
    const workout = entry as Record<string, unknown>;
    const categories = ["Strength", "Running", "Mobility", "Cardio"];
    if (
      typeof workout.title !== "string" || !workout.title.trim() || workout.title.length > 80 ||
      typeof workout.category !== "string" || !categories.includes(workout.category) ||
      typeof workout.duration !== "number" || workout.duration < 1 || workout.duration > 600 ||
      typeof workout.volume !== "number" || workout.volume < 0 || workout.volume > 100000 ||
      typeof workout.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(workout.date)
    ) throw new Error("Saved workout is invalid.");
    return { title: workout.title.trim(), category: workout.category, duration: workout.duration, volume: workout.volume, date: workout.date };
  });
}

// ── Data fetching hooks ────────────────────────────────────────────

async function fetchTrainingPlans(userId: string): Promise<TrainingPlanData[]> {
  try {
    const response = await fetch(`/api/training-plans?userId=${userId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.plans || [];
  } catch {
    return [];
  }
}

async function fetchAnalytics(userId: string): Promise<AnalyticsSummary | null> {
  try {
    const response = await fetch(`/api/analytics?type=summary`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.summary || null;
  } catch {
    return null;
  }
}

async function fetchWeeklyActivity(userId: string): Promise<WeeklyActivityPoint[]> {
  try {
    const response = await fetch(`/api/analytics?type=weekly`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.activity || [];
  } catch {
    return [];
  }
}

async function fetchStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number } | null> {
  try {
    const response = await fetch(`/api/analytics?type=streak`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.streak || null;
  } catch {
    return null;
  }
}

// ── Main component ─────────────────────────────────────────────────

export default function Home() {
  const { subscription, loading: subscriptionLoading, refreshSubscription } = useSubscription();
  const [view, setView] = useState<View>("Overview");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All types");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [unit, setUnit] = useState<"kg" | "lb">("lb");
  const [reminders, setReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [period, setPeriod] = useState("This week");
  const [billingAction, setBillingAction] = useState<"pro" | "elite" | "portal" | null>(null);

  // Real data state
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlanData[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [weeklyActivityData, setWeeklyActivityData] = useState<WeeklyActivityPoint[]>([]);
  const [weeklyActivityLoading, setWeeklyActivityLoading] = useState(false);
  const [streakData, setStreakData] = useState<{ currentStreak: number; longestStreak: number } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    const client = createClient();
    setSupabase(client);
    const { data: { subscription: authSub } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => authSub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !user) {
      setWorkouts([]);
      setWorkoutsLoading(false);
      return;
    }
    const client = supabase;
    const currentUserId = user.id;

    let active = true;
    setWorkoutsLoading(true);
    async function loadWorkouts() {
      try {
        let loaded = await listWorkouts(client, currentUserId);
        if (!loaded.length) {
          try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) {
              const legacy = parseLegacyWorkouts(saved);
              if (legacy.length) {
                loaded = await insertWorkouts(client, currentUserId, legacy);
                window.localStorage.removeItem(STORAGE_KEY);
              }
            }
          } catch {
            if (active) setToast("Saved browser workouts could not be synced. They remain on this device.");
          }
        }
        if (active) setWorkouts(loaded);
      } catch {
        if (active) setToast("Your workouts could not be loaded. Check your connection and try again.");
      } finally {
        if (active) setWorkoutsLoading(false);
      }
    }

    void loadWorkouts();
    return () => { active = false; };
  }, [supabase, user?.id]);

  // Fetch training plans when user is logged in and view is Training plans
  useEffect(() => {
    if (!user || view !== "Training plans") return;

    let active = true;
    setPlansLoading(true);

    async function loadPlans() {
      const plans = await fetchTrainingPlans(user!.id);
      if (active) setTrainingPlans(plans);
    }

    void loadPlans();
    return () => { active = false; };
  }, [user, view]);

  // Fetch analytics data for Overview and Progress views
  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadAnalytics() {
      // Fetch summary for Overview and Progress
      if (view === "Overview" || view === "Progress") {
        setAnalyticsLoading(true);
        const summary = await fetchAnalytics(user!.id);
        if (active) setAnalytics(summary);
        setAnalyticsLoading(false);
      }

      // Fetch weekly activity for Overview chart
      if (view === "Overview") {
        setWeeklyActivityLoading(true);
        const activity = await fetchWeeklyActivity(user!.id);
        if (active) setWeeklyActivityData(activity);
        setWeeklyActivityLoading(false);
      }

      // Fetch streak for Progress view
      if (view === "Progress") {
        const streak = await fetchStreak(user!.id);
        if (active) setStreakData(streak);
      }
    }

    void loadAnalytics();
    return () => { active = false; };
  }, [user, view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get("checkout");
    const billingReturned = params.get("billing") === "return";
    if (checkoutResult || billingReturned) {
      setView("Membership");
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (checkoutResult === "success") {
      setToast("Payment received. Confirming your membership...");
      const poll = async () => {
        for (let attempt = 0; attempt < 12; attempt += 1) {
          await refreshSubscription();
          if (subscription.status === "active" || subscription.status === "trialing") {
            setToast(`${subscription.tier === "pro" ? "Pro" : "Elite"} membership is active.`);
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 1250));
        }
        setToast("Payment received. Membership confirmation is delayed; refresh this page shortly.");
      };
      void poll();
      return;
    }

    if (checkoutResult === "cancelled") setToast("Checkout cancelled. No payment was taken.");
    if (billingReturned) setToast("Billing settings updated.");
  }, [subscription, refreshSubscription]);

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
  const metadataName = user?.user_metadata?.display_name;
  const displayName = typeof metadataName === "string" && metadataName.trim() ? metadataName.trim() : user?.email?.split("@")[0] ?? "there";
  const initials = displayName.split(/[.\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "FB";

  function switchView(nextView: View) {
    setView(nextView);
    setMobileNavOpen(false);
    if (nextView !== "Workouts") setSearch("");
  }

  async function saveWorkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") || "").trim();
    if (!title) return;
    const workout: NewWorkout = {
      title,
      category: String(data.get("category")),
      duration: Number(data.get("duration")) || 0,
      volume: Number(data.get("volume")) || 0,
      date: todayISO(),
    };
    setSavingWorkout(true);
    try {
      const [saved] = await insertWorkouts(supabase, user.id, [workout]);
      setWorkouts((current) => [saved, ...current]);
      setToast("Workout added to your training log.");
    } catch {
      setToast("Workout could not be saved. Check your connection and try again.");
      return;
    } finally {
      setSavingWorkout(false);
    }
    setModalOpen(false);
    setView("Overview");
  }

  async function addTemplate(title: string, workoutCategory: string, duration: number) {
    if (!supabase || !user) return;
    const workout: NewWorkout = { title, category: workoutCategory, duration, volume: 0, date: todayISO() };
    try {
      const [saved] = await insertWorkouts(supabase, user.id, [workout]);
      setWorkouts((current) => [saved, ...current]);
      setToast(`${title} added to your training log.`);
    } catch {
      setToast(`${title} could not be saved. Check your connection and try again.`);
    }
    setView("Overview");
  }

  async function deleteWorkout(id: string) {
    if (!supabase || !user) return;
    try {
      await removeWorkout(supabase, user.id, id);
      setWorkouts((current) => current.filter((workout) => workout.id !== id));
      setToast("Workout removed from your log.");
    } catch {
      setToast("Workout could not be removed. Check your connection and try again.");
    }
  }

  async function startCheckout(tier: "pro" | "elite") {
    setBillingAction(tier);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const result: { url?: unknown; error?: unknown } = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Could not start checkout.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
    } finally {
      setBillingAction(null);
    }
  }

  async function openBillingPortal() {
    setBillingAction("portal");
    try {
      const response = await fetch("/api/billing-portal", { method: "POST" });
      const result: { url?: unknown; error?: unknown } = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(typeof result.error === "string" ? result.error : "Could not open billing management.");
      }
      window.location.assign(result.url);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not open billing management. Please try again.");
    } finally {
      setBillingAction(null);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setToast("Could not sign out. Please try again.");
  }

  const openLog = (title = "") => {
    setModalOpen(true);
    if (title) window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[name='title']");
      if (input) input.value = title;
    }, 0);
  };

  const hasManageableSubscription =
    Boolean(subscription.stripe_subscription_id) && !["canceled", "incomplete_expired"].includes(subscription.status);
  const currentTier = hasManageableSubscription ? subscription.tier : "free";

  // Compute week minutes from real weekly activity data
  const computedWeekMinutes = weeklyActivityData.reduce((sum, point) => sum + point.minutes, 0);

  // Get current streak from real data
  const currentStreak = streakData?.currentStreak ?? analytics?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? analytics?.longestStreak ?? 0;

  // Get analytics stats
  const sessionsThisMonth = analytics?.sessionsThisMonth ?? 0;
  const minutesThisMonth = analytics?.minutesThisMonth ?? 0;
  const consistency = analytics?.consistency ?? 0;
  const categoryBreakdown = analytics?.categoryBreakdown ?? {};

  if (authLoading) return <main className="auth-screen"><p className="auth-description">Restoring your session...</p></main>;
  if (!isSupabaseConfigured()) return (
    <main className="auth-screen">
      <section className="auth-card auth-config" aria-labelledby="setup-title">
        <div className="auth-brand">
          <span className="brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 10.42 4.8-5.07" />
              <path d="M19 18h3" />
              <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14" />
            </svg>
          </span>
          <span className="brand-name">fitbuzz<span>.</span></span>
        </div>
        <p className="eyebrow"><span className="eyebrow-mark" />Backend setup</p>
        <h1 id="setup-title">Connect your Supabase project</h1>
        <p className="auth-description">Add your project URL and anon key to <code>.env.local</code>, then apply the SQL migration in <code>supabase/migrations</code>.</p>
      </section>
    </main>
  );
  if (!isSupabaseConfigured()) return (
    <main className="auth-screen">
      <section className="auth-card auth-config" aria-labelledby="setup-title">
        <div className="auth-brand">
          <span className="brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 10.42 4.8-5.07" />
              <path d="M19 18h3" />
              <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14" />
            </svg>
          </span>
          <span className="brand-name">fitbuzz<span>.</span></span>
        </div>
        <p className="eyebrow"><span className="eyebrow-mark" />Backend setup</p>
        <h1 id="setup-title">Connect your Supabase project</h1>
        <p className="auth-description">Add your project URL and anon key to <code>.env.local</code>, then apply the SQL migration in <code>supabase/migrations</code>.</p>
      </section>
    </main>
  );
  if (!user) return <AuthForm />;

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 10.42 4.8-5.07" />
              <path d="M19 18h3" />
              <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14" />
            </svg>
          </span>
          <span className="brand-name">fitbuzz<span>.</span></span>
        </div>
        <p className="sidebar-label">Training space</p>
        <nav className="nav-list">
          {navItems.map(({ label, icon: Icon }) => (
            <Tooltip key={label} content={label} side="top" delayDuration={300}>
              <button className={`nav-item${view === label ? " active" : ""}`} onClick={() => switchView(label)} aria-current={view === label ? "page" : undefined}>
                <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span>
                <span className="nav-label">{label}</span>
                {label === "Workouts" && <span className="nav-count">{workouts.length}</span>}
              </button>
            </Tooltip>
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
          <span className="avatar" aria-hidden="true">{initials}</span>
          <div className="profile-copy"><div className="profile-name">{displayName}</div><div className="profile-plan">{user.email}</div></div>
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
            <div className="search-container" onMouseEnter={() => setSearchDropdownOpen(true)} onMouseLeave={() => setSearchDropdownOpen(false)}>
              <label className="search-wrap" aria-label="Search workouts">
                <Search className="search-icon" size={15} />
                <input
                  aria-label="Search"
                  placeholder="Search workouts"
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); if (event.target.value) setView("Workouts"); }}
                  onFocus={() => { setSearchFocused(true); setSearchDropdownOpen(true); }}
                  onBlur={() => { setSearchFocused(false); window.setTimeout(() => setSearchDropdownOpen(false), 200); }}
                />
              </label>
              {(searchDropdownOpen || searchFocused) && (
                <div className="search-dropdown" role="listbox" aria-label="Search suggestions">
                  <div className="dropdown-section">
                    <span className="dropdown-heading">Quick actions</span>
                    <button className="dropdown-item" role="option" onClick={() => { openLog(); setSearchDropdownOpen(false); }}>
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Log new workout</span>
                    </button>
                    <button className="dropdown-item" role="option" onClick={() => { setView("Workouts"); setSearchDropdownOpen(false); }}>
                      <ListFilter size={13} />
                      <span>View all workouts</span>
                    </button>
                    <button className="dropdown-item" role="option" onClick={() => { setView("Training plans"); setSearchDropdownOpen(false); }}>
                      <CalendarDays size={13} />
                      <span>Training plans</span>
                    </button>
                    <button className="dropdown-item" role="option" onClick={() => { setView("Progress"); setSearchDropdownOpen(false); }}>
                      <TrendingUp size={13} />
                      <span>Progress analytics</span>
                    </button>
                  </div>
                  <div className="dropdown-section">
                    <span className="dropdown-heading">Filter by type</span>
                    {["Strength", "Running", "Mobility", "Cardio"].map((type) => (
                      <button key={type} className="dropdown-item" role="option" onClick={() => { setCategory(type); setView("Workouts"); setSearchDropdownOpen(false); }}>
                        <span className="dropdown-type-icon">{type === "Strength" && <Dumbbell size={13} />}
                        {type === "Running" && <HeartPulse size={13} />}
                        {type === "Mobility" && <Sparkles size={13} />}
                        {type === "Cardio" && <Flame size={13} />}</span>
                        <span>{type}</span>
                        <span className="dropdown-count">{workouts.filter(w => w.category === type).length}</span>
                      </button>
                    ))}
                  </div>
                  {workouts.length > 0 && (
                    <div className="dropdown-section">
                      <span className="dropdown-heading">Recent workouts</span>
                      {workouts.slice(0, 3).map((workout) => (
                        <button key={workout.id} className="dropdown-item recent-workout" role="option" onClick={() => { setSearch(workout.title); setView("Workouts"); setSearchDropdownOpen(false); }}>
                          <div className="recent-workout-info">
                            <span className="recent-workout-title">{workout.title}</span>
                            <span className="recent-workout-meta">{workout.category} · {workout.duration} min · {formatDate(workout.date)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="icon-button" aria-label="Notifications" onClick={() => setToast("You're all caught up. Nice work.")}><Bell size={16} /><span className="notification-dot" /></button>
          </div>
        </header>

        <div className="content">
          {view === "Overview" && (
            <>
              <PageHeading eyebrow={dateLabel} title={`${greeting()}, ${displayName}`} description="You showed up for yourself today. Here's your week at a glance." action={<button className="primary-button" onClick={() => openLog()}><Plus size={15} strokeWidth={2.5} /> Log workout</button>} />

              <section className="stats-grid" aria-label="Weekly workout statistics">
                <StatCard label="Workouts this week" value={String(workouts.filter((workout) => workout.date >= dateOffset(-6)).length)} unit="sessions" change="2" detail="vs last week" icon={Dumbbell} />
                <StatCard label="Active minutes" value={String(computedWeekMinutes || weekMinutes)} unit="min" change="12%" detail="vs last week" icon={Clock3} />
                <StatCard label="Current streak" value={String(currentStreak)} unit="days" change={`Personal best: ${longestStreak}`} detail="keep it rolling" icon={Flame} />
                <StatCard label="Today's volume" value={todaysVolume} unit={unit} change={todayWorkouts.length ? "Logged today" : "Ready when you are"} detail="strength work" icon={Zap} />
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
                    <div className="chart-summary"><span className="chart-total">{period === "This week" ? computedWeekMinutes : weekMinutes}</span><span className="chart-unit">active minutes</span></div>
                    <div className="bar-chart" role="img" aria-label={`${computedWeekMinutes} active minutes this week, shown across seven days`}>
                      {weeklyActivityData.length > 0 ? (
                        weeklyActivityData.map((point) => (
                          <div className="chart-day" key={point.day}>
                            <div className="bar-zone"><div className={`bar-column${point.day === "Sun" && period === "This week" ? " current" : ""}`} style={{ height: `${Math.max(point.minutes, 5) / maxBar * 100}%` }} title={`${point.minutes} minutes`} /></div>
                            <span className="day-label">{point.day}</span>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No activity recorded yet. Log your first workout!</div>
                      )}
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
                  {workoutsLoading ? <div className="empty-state">Loading workouts...</div> : <WorkoutList workouts={workouts.slice(0, 4)} unit={unit} compact emptyMessage="No workouts yet. Your recent sessions will show here." />}
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
                {workoutsLoading ? <div className="empty-state">Loading workouts...</div> : <WorkoutList workouts={filteredWorkouts} unit={unit} onDelete={deleteWorkout} emptyMessage={workouts.length ? "No workouts match that search. Try another name or type." : "Your training log is empty. Log or add a session to get started."} />}
              </section>
            </>
          )}

          {view === "Training plans" && (
            <>
              {canAccess(currentTier, "aiWorkoutPlans") ? (
                <>
                  <PageHeading eyebrow="Find your rhythm" title="Training plans" description="A little structure, with plenty of room to make it yours." action={<button className="secondary-button" onClick={() => setToast("More training plans are on the way.")}><Sparkles size={14} /> Generate AI plan</button>} />

                  {/* AI Plan Generator Modal Trigger */}
                  {trainingPlans.length === 0 && (
                    <div className="generate-prompt">
                      <Sparkles size={24} />
                      <h3>Create your first AI-powered training plan</h3>
                      <p>Tell us about your goals and we'll build a personalized program for you.</p>
                      <button className="primary-button" onClick={() => openLog("Generate Plan")}>
                        <Sparkles size={14} /> Generate My Plan
                      </button>
                    </div>
                  )}

                  <div className="section-toolbar"><h2>Your programs</h2><span className="page-subtitle">Pick up right where you left off.</span></div>

                  {plansLoading ? (
                    <div className="empty-state">Loading your training plans...</div>
                  ) : trainingPlans.length > 0 ? (
                    <div className="program-grid">
                      {trainingPlans.map((program) => (
                        <article className="program-card" key={program.id}>
                          <div className="program-top">
                            <span className="template-icon"><Target size={17} /></span>
                            <span className="program-status">{program.status === "active" ? "In progress" : program.status}</span>
                            {program.is_ai_generated && <span className="ai-badge">AI</span>}
                          </div>
                          <h3>{program.title}</h3>
                          <p>{program.description}</p>
                          <div className="program-metrics">
                            <span className="plan-metric"><CalendarDays size={13} /> Week {program.current_week} of {program.duration_weeks}</span>
                            <span className="plan-metric"><Dumbbell size={13} /> {program.sessions_per_week} sessions / week</span>
                            <span className="plan-metric"><Check size={13} /> {program.completed_sessions} of {program.total_sessions} complete</span>
                          </div>
                          <div className="program-progress"><span style={{ width: `${program.progress}%` }} /></div>
                          <div className="program-footer">
                            <span>{program.progress}%</span>
                            {program.progress < 100 && <button className="text-button" onClick={() => setToast("Continue your plan")}>Continue <ArrowRight size={12} /></button>}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
                      <CalendarDays size={48} strokeWidth={1.5} />
                      <h3>No training plans yet</h3>
                      <p>Generate an AI-powered plan tailored to your goals, or create a custom plan manually.</p>
                      <button className="primary-button" style={{ marginTop: "16px" }} onClick={() => setToast("AI plan generation coming soon!")}>
                        <Sparkles size={14} /> Generate AI Plan
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="feature-locked">
                  <div className="feature-locked-icon"><Sparkles size={32} /></div>
                  <h2>Unlock AI Workout Plans</h2>
                  <p>Get personalized training plans generated by AI based on your goals, schedule, and progress.</p>
                  <ul className="feature-locked-benefits">
                    <li><Check size={16} /> Custom plans tailored to your level</li>
                    <li><Check size={16} /> Adaptive progression as you improve</li>
                    <li><Check size={16} /> Unlimited plan variations</li>
                  </ul>
                  <button className="primary-button" onClick={() => { setView("Membership"); setToast("Choose Pro or Elite to unlock AI Workout Plans"); }}>
                    <Sparkles size={14} /> Upgrade to Pro
                  </button>
                </div>
              )}
            </>
          )}

          {view === "Progress" && (
            <>
              {canAccess(currentTier, "advancedAnalytics") ? (
                <>
                  <PageHeading eyebrow="The work is working" title="Your progress" description="A wider view of the habits you're building." action={<button className="secondary-button" onClick={() => setToast("Your progress summary is up to date.")}><TrendingUp size={14} /> This month <ChevronDown size={13} /></button>} />

                  <section className="stats-grid">
                    <StatCard label="Sessions completed" value={String(sessionsThisMonth)} unit="this month" change={analytics?.sessionsLastMonth ? `+${Math.round((sessionsThisMonth - analytics.sessionsLastMonth) / Math.max(analytics.sessionsLastMonth, 1) * 100)}%` : "New"} detail="vs last month" icon={Dumbbell} />
                    <StatCard label="Time well spent" value={String(minutesThisMonth)} unit="min" change={analytics?.sessionsLastMonth ? `+${Math.round((minutesThisMonth - (analytics.sessionsLastMonth * 45)) / Math.max(analytics.sessionsLastMonth * 45, 1) * 100)}%` : "New"} detail="vs last month" icon={Clock3} />
                    <StatCard label="Training streak" value={String(currentStreak)} unit="days" change={`Best: ${longestStreak} days`} detail="personal best" icon={Flame} />
                    <StatCard label="Consistency" value={String(consistency)} unit="%" change={consistency >= 80 ? "On track" : consistency >= 50 ? "Building" : "Keep going"} detail="monthly goal" icon={Trophy} />
                  </section>

                  <div className="progress-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <div><h2 className="panel-title">Monthly milestones</h2><p className="panel-note">Small wins worth noticing.</p></div>
                        <span className="program-status">{new Intl.DateTimeFormat("en", { month: "long" }).format(new Date())}</span>
                      </div>
                      <div className="goal-list">
                        <GoalRow icon={Dumbbell} title="Training sessions" help={`Goal: 16 sessions this month`} value={`${sessionsThisMonth} / 16`} progress={`${Math.min(100, Math.round((sessionsThisMonth / 16) * 100))}%`} />
                        <GoalRow icon={Clock3} title="Active minutes" help="Goal: 720 minutes this month" value={`${minutesThisMonth} / 720`} progress={`${Math.min(100, Math.round((minutesThisMonth / 720) * 100))}%`} />
                        <GoalRow icon={Flame} title="Keep the streak alive" help="Goal: 5 days in a row" value={`${currentStreak} / 5 days`} progress={`${Math.min(100, Math.round((currentStreak / 5) * 100))}%`} />
                        <GoalRow icon={HeartPulse} title="Make time to recover" help="Goal: 4 mobility sessions" value={`${categoryBreakdown["Mobility"] || 0} / 4`} progress={`${Math.min(100, Math.round(((categoryBreakdown["Mobility"] || 0) / 4) * 100))}%`} />
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
              ) : (
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
                  <button className="primary-button" onClick={() => { setView("Membership"); setToast("Choose Pro or Elite to unlock Advanced Analytics"); }}>
                    <TrendingUp size={14} /> Upgrade to Pro
                  </button>
                </div>
              )}
            </>
          )}

          {view === "Membership" && (
            <>
              <PageHeading eyebrow="Plans that move with you" title="Membership" description="Choose the level of support that suits your training." />
              <div className="membership-notice"><CreditCard size={16} /><p>Monthly plans are billed securely in GBP through Stripe. Your current plan is {currentTier === "pro" ? "Pro" : currentTier === "elite" ? "Elite" : "Free"}.</p></div>
              <section className="membership-grid" aria-label="Membership plans">
                {(["free", "pro", "elite"] as const).map((tier) => {
                  const plan = {
                    free: { name: "Free", price: "£0", description: "The essentials to build a lasting training habit." },
                    pro: { name: "Pro", price: "£9.99", description: "More guidance and room to grow your routine." },
                    elite: { name: "Elite", price: "£24.99", description: "A deeper level of coaching and developer access." },
                  }[tier];
                  const currentPlan = tier === currentTier;
                  const actionLabel = currentPlan
                    ? tier === "free" ? "Current plan" : billingAction === "portal" ? "Opening billing..." : "Manage billing"
                    : hasManageableSubscription ? "Change plan in billing portal" : billingAction === tier ? "Opening checkout..." : `Choose ${plan.name}`;
                  return (
                    <article className={`membership-card${tier === "pro" ? " recommended" : ""}`} key={tier}>
                      {tier === "pro" && <span className="membership-badge">Most popular</span>}
                      <div className="membership-card-top"><h2>{plan.name}</h2>{currentPlan && <span className="membership-current">Current plan</span>}</div>
                      <p className="membership-description">{plan.description}</p>
                      <p className="membership-price"><strong>{plan.price}</strong><span> / month</span></p>
                      <ul className="membership-features">{tierDisplayFeatures[tier].map((feature) => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
                      <button className={currentPlan ? "secondary-button membership-action" : "primary-button membership-action"} disabled={billingAction !== null || (currentPlan && tier === "free")} onClick={() => {
                        if (hasManageableSubscription) void openBillingPortal();
                        else if (tier === "free") setToast("You're already on the Free plan.");
                        else void startCheckout(tier);
                      }}>{actionLabel}</button>
                    </article>
                  );
                })}
              </section>
            </>
          )}

          {view === "Settings" && (
            <>
              <PageHeading eyebrow="Make it feel like yours" title="Settings" description="A few preferences for your FitBuzz space." />
              <section className="panel settings-panel">
                <SettingRow title="Units" help="Choose how your training numbers are shown."><div className="unit-toggle"><button className={`unit-choice${unit === "lb" ? " active" : ""}`} onClick={() => setUnit("lb")}>lb</button><button className={`unit-choice${unit === "kg" ? " active" : ""}`} onClick={() => setUnit("kg")}>kg</button></div></SettingRow>
                <SettingRow title="Workout reminders" help="A gentle nudge for your planned training days."><button className={`toggle${reminders ? " on" : ""}`} aria-label="Toggle workout reminders" aria-pressed={reminders} onClick={() => setReminders(!reminders)} /></SettingRow>
                <SettingRow title="Weekly progress recap" help="A short summary of your training each Sunday."><button className={`toggle${weeklyReport ? " on" : ""}`} aria-label="Toggle weekly progress recap" aria-pressed={weeklyReport} onClick={() => setWeeklyReport(!weeklyReport)} /></SettingRow>
                <SettingRow title="Your account" help={user.email ?? displayName}><button className="secondary-button" onClick={() => void signOut()}><LogOut size={13} /> Sign out</button></SettingRow>
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
            <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={savingWorkout}>{savingWorkout ? "Saving..." : <><Check size={14} /> Save workout</>}</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="toast" role="status"><Check size={15} />{toast}</div>}
    </div>
  );
}
