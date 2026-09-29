"use client";

import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "rect" | "avatar";
  width?: string | number;
  height?: string | number;
  animated?: boolean;
}

export function Shimmer({ className, variant = "rect", width = "100%", height = "1rem", animated = true }: ShimmerProps) {
  const baseStyles = "bg-white/10 dark:bg-night/20 rounded overflow-hidden";
  const animatedClass = animated ? "shimmer" : "";

  const variantStyles = {
    text: "rounded h-4",
    card: "rounded-xl",
    circle: "rounded-full",
    rect: "rounded-lg",
    avatar: "rounded-full",
  };

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], animatedClass, className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface ShimmerTextProps {
  lines?: number;
  className?: string;
  maxWidth?: string;
}

export function ShimmerText({ lines = 3, className, maxWidth = "100%" }: ShimmerTextProps) {
  return (
    <div className={cn("space-y-3 max-w-[300px]", className)} style={{ maxWidth }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} variant="text" width={i === lines - 1 ? "60%" : "100%"} height="1rem" />
      ))}
    </div>
  );
}

interface ShimmerCardProps {
  className?: string;
  showImage?: boolean;
  showAction?: boolean;
  lines?: number;
}

export function ShimmerCard({ className, showImage = true, showAction = true, lines = 3 }: ShimmerCardProps) {
  return (
    <div className={cn("glass-card shimmer animate-fade-in p-6 space-y-4", className)}>
      {showImage && <Shimmer variant="rect" width="100%" height="160px" className="rounded-lg" />}
      <div className="space-y-3">
        <Shimmer variant="text" width="40%" height="1.5rem" />
        <ShimmerText lines={lines} />
      </div>
      {showAction && (
        <div className="pt-4 border-t border-white/10 dark:border-night/20">
          <Shimmer variant="rect" width="100%" height="44px" className="rounded-xl" />
        </div>
      )}
    </div>
  );
}

interface ShimmerListProps {
  count?: number;
  className?: string;
  showAvatar?: boolean;
  lines?: number;
}

export function ShimmerList({ count = 5, className, showAvatar = true, lines = 2 }: ShimmerListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card shimmer animate-fade-in p-4 flex items-center gap-4" style={{ animationDelay: `${i * 0.05}s` }}>
          {showAvatar && <Shimmer variant="avatar" width="48px" height="48px" />}
          <div className="flex-1 min-w-0">
            <Shimmer variant="text" width="50%" height="1.25rem" />
            <ShimmerText lines={lines} className="mt-2" />
          </div>
          <Shimmer variant="rect" width="80px" height="36px" className="rounded-xl" />
        </div>
      ))}
    </div>
  );
}

interface ShimmerStatsProps {
  count?: number;
  className?: string;
}

export function ShimmerStats({ count = 4, className }: ShimmerStatsProps) {
  return (
    <div className={cn("stats-grid", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card glass-card shimmer animate-fade-in p-6" style={{ animationDelay: `${i * 0.05}s` }}>
          <div className="flex items-center justify-between">
            <Shimmer variant="text" width="80px" height="0.75rem" />
            <Shimmer variant="circle" width="32px" height="32px" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <Shimmer variant="text" width="60px" height="2rem" />
            <Shimmer variant="text" width="30px" height="0.75rem" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Shimmer variant="circle" width="12px" height="12px" />
            <Shimmer variant="text" width="100px" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ShimmerTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function ShimmerTable({ rows = 5, columns = 4, className }: ShimmerTableProps) {
  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="p-4 border-b border-white/10 dark:border-night/20">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Shimmer key={i} variant="text" width={i === 0 ? "120px" : "80px"} height="0.75rem" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-white/5 dark:divide-night/20">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 items-center shimmer" style={{ animationDelay: `${i * 0.03}s` }}>
            {Array.from({ length: columns }).map((_, j) => (
              <Shimmer
                key={j}
                variant="text"
                width={j === 0 ? "120px" : "80px"}
                height="0.875rem"
                className={j === 0 ? "font-medium" : ""}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}