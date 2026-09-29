"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { useDashboard } from "./dashboard-provider";

const VIEW_NAMES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/workouts": "Workouts",
  "/dashboard/plans": "Training plans",
  "/dashboard/progress": "Progress",
  "/dashboard/membership": "Membership",
  "/dashboard/settings": "Settings",
};

export default function Topbar() {
  const pathname = usePathname();
  const { search, setSearch, setMobileNavOpen } = useDashboard();
  const [focused, setFocused] = useState(false);

  const viewName = VIEW_NAMES[pathname] ?? "Training space";

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <button
          className="icon-button mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setMobileNavOpen((prev) => !prev)}
        >
          <Menu size={17} />
        </button>
        <span>Training space</span>
        <ChevronRight size={13} />
        <strong>{viewName}</strong>
      </div>

      <div className="search-container">
        <label className="search-wrap" aria-label="Search workouts">
          <Search className="search-icon" size={15} />
          <input
            aria-label="Search"
            placeholder="Search workouts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setTimeout(() => setFocused(false), 200);
            }}
          />
        </label>
      </div>

      <button className="icon-button" aria-label="Notifications" onClick={() => {}}>
        <Bell size={16} />
        <span className="notification-dot" />
      </button>
    </header>
  );
}