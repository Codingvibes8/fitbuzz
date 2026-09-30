"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: string;
  detail?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  animate?: boolean;
  delay?: number;
  className?: string;
  variant?: "default" | "glass" | "glow" | "gradient";
  iconColor?: string;
  iconBg?: string;
}

export function AnimatedStatCard({
  label,
  value,
  unit,
  change,
  detail,
  icon: Icon,
  trend = "neutral",
  animate = true,
  delay = 0,
  className,
  variant = "glass",
  iconColor,
  iconBg,
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(Number(value));
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
      animateValue();
    }, delay);

    return () => clearTimeout(timer);
  }, [value, animate, delay]);

  const animateValue = () => {
    const target = Number(value);
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(target * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  };

  const variantClasses = {
    default: "stat-card",
    glass: "glass-card hover-lift",
    glow: "card-premium card-glow hover-lift",
    gradient: "card-premium hover-lift relative overflow-hidden",
  };

  const trendColor = trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "trend-up";

  return (
    <article
      className={cn(
        "animate-fade-in",
        variantClasses[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {variant === "gradient" && (
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
      )}
      <div className="relative z-10 stat-top">
        <span className="stat-label">{label}</span>
        <span
          className="stat-icon"
          style={{
            color: iconColor || undefined,
            background: iconBg || undefined,
          }}
        >
          <Icon size={15} strokeWidth={1.9} />
        </span>
      </div>
      <div className="relative z-10 stat-number">
        {isVisible || !animate ? displayValue.toLocaleString() : "—"}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {(change || detail) && (
        <div className="relative z-10 stat-bottom">
          {change && (
            <>
              <span className={cn(trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "")}>
                {trend === "up" ? "▲" : trend === "down" ? "▼" : "●"}
              </span>
              <span className={cn(trendColor)}>{change}</span>
            </>
          )}
          {detail && <span>{detail}</span>}
        </div>
      )}
    </article>
  );
}

interface CounterProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function Counter({ value, duration = 800, delay = 0, formatter, className }: CounterProps) {
  const [displayValue, setDisplayValue] = useState<string | number>(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStarted(true);
      const startTime = performance.now();
      const target = value;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * eased);
        setDisplayValue(formatter ? formatter(current) : current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, duration, delay, formatter]);

  return <span className={cn("tabular-nums", className)}>{displayValue}</span>;
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: "primary" | "lime" | "cyan" | "amber" | "rose";
  animated?: boolean;
  showValue?: boolean;
}

const progressColors = {
  primary: "stroke-indigo-500",
  lime: "stroke-lime",
  cyan: "stroke-cyan-500",
  amber: "stroke-amber-500",
  rose: "stroke-rose-500",
};

const progressBgColors = {
  primary: "stroke-indigo-500/20",
  lime: "stroke-lime/20",
  cyan: "stroke-cyan-500/20",
  amber: "stroke-amber-500/20",
  rose: "stroke-rose-500/20",
};

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  className,
  color = "primary",
  animated = true,
  showValue = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={cn("fill-none", progressBgColors[color])}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={cn(
            "fill-none transition-all duration-1000 ease-out",
            progressColors[color],
            animated && "animate-draw"
          )}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          strokeLinecap="round"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums">{progress}%</span>
        </div>
      )}
    </div>
  );
}