"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  color?: "primary" | "lime" | "cyan" | "amber" | "rose";
  animated?: boolean;
  hoverEffect?: boolean;
}

const intensityClasses = {
  subtle: "glow-subtle",
  medium: "glow-medium",
  strong: "glow-strong",
};

const colorClasses = {
  primary: "glow-primary",
  lime: "glow-lime",
  cyan: "glow-cyan",
  amber: "glow-amber",
  rose: "glow-rose",
};

export function GlowCard({
  children,
  className,
  intensity = "medium",
  color = "primary",
  animated = true,
  hoverEffect = true,
}: GlowCardProps) {
  return (
    <div
      className={cn(
        "card-premium relative overflow-hidden",
        animated && "animate-fade-in",
        hoverEffect && "hover-lift",
        intensityClasses[intensity],
        colorClasses[color],
        className
      )}
    >
      <div className="relative z-10 p-6">{children}</div>
      {animated && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-lime/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}
    </div>
  );
}

interface GlowBorderProps {
  children: ReactNode;
  className?: string;
  color?: "primary" | "lime" | "cyan" | "amber" | "rose";
  animated?: boolean;
}

export function GlowBorder({ children, className, color = "primary", animated = true }: GlowBorderProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-gradient-to-br from-white/5 to-white/10 dark:from-night/50 dark:to-night/30",
        "border border-transparent",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-[-1px] rounded-[inherit]",
          "bg-gradient-to-br",
          color === "primary" && "from-indigo-500/50 via-pink-500/50 to-amber-500/50",
          color === "lime" && "from-lime/50 via-lime-dark/50 to-green-500/50",
          color === "cyan" && "from-cyan-500/50 via-violet-500/50 to-purple-500/50",
          color === "amber" && "from-amber-500/50 via-orange-500/50 to-red-500/50",
          color === "rose" && "from-rose-500/50 via-pink-500/50 to-fuchsia-500/50",
          animated && "animate-pulse-slow",
          "pointer-events-none"
        )}
      />
      <div className="relative z-10 rounded-xl bg-white/5 dark:bg-night/50 p-6 backdrop-blur-sm">{children}</div>
    </div>
  );
}

interface ShimmerCardProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function ShimmerCard({ className, lines = 3, height = "200px" }: ShimmerCardProps) {
  return (
    <div className={cn("glass-card shimmer animate-fade-in", className)} style={{ height }}>
      <div className="h-full flex flex-col justify-between p-6">
        <div className="space-y-4">
          <div className="h-6 w-3/4 bg-white/20 dark:bg-night/30 rounded animated-bg" />
          <div className="h-8 w-1/2 bg-white/20 dark:bg-night/30 rounded animated-bg" />
          {Array.from({ length: Math.max(0, lines - 2) }).map((_, i) => (
            <div key={i} className="h-4 w-full bg-white/10 dark:bg-night/20 rounded animated-bg" />
          ))}
        </div>
        <div className="h-10 w-1/3 bg-white/20 dark:bg-night/30 rounded animated-bg" />
      </div>
    </div>
  );
}

interface AnimatedBackgroundProps {
  className?: string;
  colors?: string[];
}

export function AnimatedBackground({ className, colors = ["rgba(99, 102, 241, 0.1)", "rgba(236, 72, 153, 0.1)", "rgba(245, 158, 11, 0.1)"] }: AnimatedBackgroundProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 -z-10",
        "bg-gradient-to-br",
        "animate-gradient-shift",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${colors.join(", ")})`,
        backgroundSize: "200% 200%",
      }}
    />
  );
}