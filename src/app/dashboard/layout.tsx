import { ReactNode } from "react";
import { DashboardProvider } from "./dashboard-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardProvider>{children}</DashboardProvider>;
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function displayNameFromUser(
  user: { user_metadata?: Record<string, unknown>; email?: string | null } | null
): string {
  const meta = user?.user_metadata;
  const metadataName = typeof meta?.display_name === "string" ? meta.display_name : undefined;
  return typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim()
    : user?.email?.split("@")[0] ?? "there";
}
