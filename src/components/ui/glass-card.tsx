"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

export function GlassCard({ children, className, hover = true, glow = false, padding = "md" }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card",
        paddingMap[padding],
        hover && "hover-lift transition-all duration-300",
        glow && "card-glow",
        className
      )}
    >
      {children}
    </div>
  );
}

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

export function GlassPanel({ children, className, padding = "lg" }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel", paddingMap[padding], className)}>
      {children}
    </div>
  );
}

interface GlassBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "lime" | "primary" | "secondary";
}

const badgeVariants = {
  default: "bg-white/10 border-white/20 text-white",
  lime: "bg-lime/20 border-lime/30 text-lime",
  primary: "bg-indigo-500/20 border-indigo-500/30 text-indigo-300",
  secondary: "bg-pink-500/20 border-pink-500/30 text-pink-300",
};

export function GlassBadge({ children, className, variant = "default" }: GlassBadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-sm", badgeVariants[variant], className)}>
      {children}
    </span>
  );
}