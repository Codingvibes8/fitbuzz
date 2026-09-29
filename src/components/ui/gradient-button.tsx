"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "lime" | "secondary" | "glass" | "glow";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: "px-4 py-2 text-sm gap-2",
  md: "px-6 py-3 text-base gap-2.5",
  lg: "px-8 py-4 text-lg gap-3",
  xl: "px-10 py-5 text-xl gap-3.5",
};

const variantClasses = {
  primary: "btn-gradient text-white font-semibold",
  lime: "btn-gradient-lime font-semibold",
  secondary: "bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200",
  glass: "btn-glass font-medium",
  glow: "btn-gradient btn-glow text-white font-semibold relative overflow-hidden",
};

export function GradientButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-xl",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-night",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface GradientLinkProps {
  children: ReactNode;
  href: string;
  variant?: "primary" | "lime" | "secondary" | "glass" | "glow";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullWidth?: boolean;
}

export function GradientLink({ children, href, variant = "primary", size = "md", className, fullWidth = false, ...props }: GradientLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-xl",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-dark focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-night",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </a>
  );
}