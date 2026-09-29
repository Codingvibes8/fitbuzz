"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Settings2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useDashboard } from "./dashboard-provider";
import { Tooltip } from "@/components/ui/tooltip";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
  { label: "Training plans", href: "/dashboard/plans", icon: CalendarDays },
  { label: "Progress", href: "/dashboard/progress", icon: TrendingUp },
  { label: "Membership", href: "/dashboard/membership", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workouts, setMobileNavOpen, setSearch } = useDashboard();

  const displayName =
    typeof user?.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : user?.email?.split("@")[0] ?? "there";
  const initials =
    displayName.split(/[.\s_-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "FB";

  function navigate(href: string) {
    router.push(href);
    setMobileNavOpen(false);
    if (href !== "/dashboard/workouts") setSearch("");
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="brand">
        <span className="brand-mark">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 10.42 4.8-5.07" />
            <path d="M19 18h3" />
            <path d="M9.5 22 21.414 9.415A2 2 0 0 0 21.2 6.4l-5.61-4.208A1 1 0 0 0 14 3v2a2 2 0 0 1-1.394 1.906L8.677 8.053A1 1 0 0 0 8 9c-.155 6.393-2.082 9-4 9a2 2 0 0 0 0 4h14" />
          </svg>
        </span>
        <span className="brand-name">fitbuzz<span>.</span></span>
      </div>

      <p className="sidebar-label">Training space</p>

      <nav className="nav-list">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Tooltip key={label} content={label} side="top" delayDuration={300}>
              <button
                className={`nav-item${active ? " active" : ""}`}
                onClick={() => navigate(href)}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon"><Icon size={17} strokeWidth={1.8} /></span>
                <span className="nav-label">{label}</span>
                {label === "Workouts" && <span className="nav-count">{workouts.length}</span>}
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <section className="sidebar-coach">
        <span className="coach-orbit" />
        <div className="coach-kicker"><Sparkles size={12} /> Your next step</div>
        <p className="coach-title">Small steps. Strong habits.</p>
        <button className="coach-link" onClick={() => navigate("/dashboard/plans")}>
          Explore your plans <ChevronRight size={13} />
        </button>
      </section>

      <div className="profile">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <div className="profile-copy">
          <div className="profile-name">{displayName}</div>
          <div className="profile-plan">{user?.email}</div>
        </div>
        <ChevronDown className="profile-more" size={15} />
      </div>
    </aside>
  );
}
