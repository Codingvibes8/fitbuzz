"use client";

import { LogOut } from "lucide-react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { SettingRow } from "@/components/dashboard/setting-row";
import { useDashboard } from "../dashboard-provider";

export default function SettingsPage() {
  const { user, supabase, setToast, unit, setUnit, reminders, setReminders, weeklyReport, setWeeklyReport } = useDashboard();

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setToast("Could not sign out. Please try again.");
  }

  return (
    <>
      <PageHeading
        eyebrow="Make it feel like yours"
        title="Settings"
        description="A few preferences for your FitBuzz space."
      />
      <section className="panel settings-panel">
        <SettingRow
          title="Units"
          help="Choose how your training numbers are shown."
        >
          <div className="unit-toggle">
            <button
              className={`unit-choice${unit === "lb" ? " active" : ""}`}
              onClick={() => setUnit("lb")}
            >
              lb
            </button>
            <button
              className={`unit-choice${unit === "kg" ? " active" : ""}`}
              onClick={() => setUnit("kg")}
            >
              kg
            </button>
          </div>
        </SettingRow>

        <SettingRow
          title="Workout reminders"
          help="A gentle nudge for your planned training days."
        >
          <button
            className={`toggle${reminders ? " on" : ""}`}
            aria-label="Toggle workout reminders"
            aria-pressed={reminders}
            onClick={() => setReminders(!reminders)}
          />
        </SettingRow>

        <SettingRow
          title="Weekly progress recap"
          help="A short summary of your training each Sunday."
        >
          <button
            className={`toggle${weeklyReport ? " on" : ""}`}
            aria-label="Toggle weekly progress recap"
            aria-pressed={weeklyReport}
            onClick={() => setWeeklyReport(!weeklyReport)}
          />
        </SettingRow>

        <SettingRow
          title="Your account"
          help={user?.email ?? "Account"}
        >
          <button className="secondary-button" onClick={() => void signOut()}>
            <LogOut size={13} /> Sign out
          </button>
        </SettingRow>
      </section>
    </>
  );
}
