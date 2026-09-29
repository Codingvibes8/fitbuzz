"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useSubscription } from "@/lib/context/subscription-context";
import type { Workout } from "@/lib/types/workout";
import { insertWorkouts, listWorkouts } from "@/lib/supabase/workouts";

// ── Shared dashboard state that every view needs ────────────────────────

export interface DashboardShared {
  user: User | null;
  supabase: ReturnType<typeof createClient> | null;
  workouts: Workout[];
  workoutsLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  toast: string;
  setToast: (v: string) => void;
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  unit: "kg" | "lb";
  setUnit: (v: "kg" | "lb") => void;
  reminders: boolean;
  setReminders: (v: boolean) => void;
  weeklyReport: boolean;
  setWeeklyReport: (v: boolean) => void;
  billingLoading: boolean | "pro" | "elite" | "portal";
  setBillingLoading: (v: boolean | "pro" | "elite" | "portal") => void;
  weeklyActivityData: { day: string; minutes: number }[];
  weekMinutes: number;
  period: string;
  setPeriod: (v: string) => void;
  computedWeekMinutes: number;
}

const DashboardContext = createContext<DashboardShared | null>(null);

export function useDashboard(): DashboardShared {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}

const STORAGE_KEY = "fitflow-workouts-v1";
const todayISO = () => new Date().toISOString().slice(0, 10);
const dateOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function parseLegacyWorkouts(saved: string): Parameters<typeof insertWorkouts>[2] {
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new Error("Saved workouts are not a list.");
  return parsed.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Saved workout is invalid.");
    const w = entry as Record<string, unknown>;
    const categories = ["Strength", "Running", "Mobility", "Cardio"];
    if (
      typeof w.title !== "string" || !w.title.trim() || w.title.length > 80 ||
      typeof w.category !== "string" || !categories.includes(w.category) ||
      typeof w.duration !== "number" || w.duration < 1 || w.duration > 600 ||
      typeof w.volume !== "number" || w.volume < 0 || w.volume > 100000 ||
      typeof w.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(w.date)
    ) throw new Error("Saved workout is invalid.");
    return { title: w.title.trim(), category: w.category, duration: w.duration, volume: w.volume, date: w.date };
  });
}

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { refreshSubscription } = useSubscription();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All types");
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unit, setUnit] = useState<"kg" | "lb">("lb");
  const [reminders, setReminders] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [billingLoading, setBillingLoading] = useState<boolean | "pro" | "elite" | "portal">(false);
  const [weeklyActivityData, setWeeklyActivityData] = useState<{ day: string; minutes: number }[]>([]);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [period, setPeriod] = useState("This week");
  const [computedWeekMinutes, setComputedWeekMinutes] = useState(0);

  // Auth + Supabase client
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

  // Workouts (only when authenticated)
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

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Modal Escape key
  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalOpen]);

  // Checkout / billing result from URL params (runs once on mount)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutResult = params.get("checkout");
    const billingReturned = params.get("billing") === "return";
    if (checkoutResult || billingReturned) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    if (checkoutResult === "cancelled") setToast("Checkout cancelled. No payment was taken.");
    if (billingReturned) setToast("Billing settings updated.");
  }, []);

  const value: DashboardShared = {
    user,
    supabase,
    workouts,
    workoutsLoading,
    search,
    setSearch,
    category,
    setCategory,
    toast,
    setToast,
    modalOpen,
    setModalOpen,
    mobileNavOpen,
    setMobileNavOpen,
    unit,
    setUnit,
    billingLoading,
    setBillingLoading,
    reminders,
    setReminders,
    weeklyReport,
    setWeeklyReport,
    weeklyActivityData,
    weekMinutes,
    period,
    setPeriod,
    computedWeekMinutes,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// ── Small helpers that pages reference ───────────────────────────────────

export function openLog(setModalOpen: (v: boolean) => void, title = "") {
  setModalOpen(true);
  if (title)
    window.setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[name='title']");
      if (input) input.value = title;
    }, 0);
}

export { todayISO, dateOffset, parseLegacyWorkouts };
