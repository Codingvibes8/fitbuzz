"use client";

import * as React from "react";
import { forwardRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  skipDelayDuration?: number;
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      side = "top",
      align = "center",
      delayDuration = 200,
      skipDelayDuration = 300,
      className,
    },
    _ref
  ) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const computePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 8;

      let x = 0;
      let y = 0;

      switch (side) {
        case "top":
          y = triggerRect.top - tooltipRect.height - gap;
          if (align === "start") x = triggerRect.left;
          else if (align === "end") x = triggerRect.right - tooltipRect.width;
          else x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case "bottom":
          y = triggerRect.bottom + gap;
          if (align === "start") x = triggerRect.left;
          else if (align === "end") x = triggerRect.right - tooltipRect.width;
          else x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
          break;
        case "left":
          x = triggerRect.left - tooltipRect.width - gap;
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
        case "right":
          x = triggerRect.right + gap;
          y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
          break;
      }

      x = Math.max(gap, Math.min(x, viewportWidth - tooltipRect.width - gap));
      y = Math.max(gap, Math.min(y, viewportHeight - tooltipRect.height - gap));

      setPosition({ x, y });
    };

    const handleOpen = () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      openTimeoutRef.current = setTimeout(() => {
        setOpen(true);
        requestAnimationFrame(computePosition);
      }, delayDuration);
    };

    const handleClose = () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => setOpen(false), skipDelayDuration);
    };

    useEffect(() => {
      if (open) {
        computePosition();
        window.addEventListener("resize", computePosition);
        window.addEventListener("scroll", computePosition, true);
      }
      return () => {
        window.removeEventListener("resize", computePosition);
        window.removeEventListener("scroll", computePosition, true);
        if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      };
    }, [open]);

    const triggerElement = children;
    const childRef = (triggerElement.props as any)?.ref;
    const enhancedChildren = React.cloneElement(triggerElement as React.ReactElement<any>, {
      ref: (el: HTMLElement) => {
        triggerRef.current = el;
        if (typeof childRef === "function") {
          childRef(el);
        } else if (childRef && typeof childRef === "object" && "current" in childRef) {
          (childRef as React.MutableRefObject<HTMLElement | null>).current = el;
        }
      },
      onMouseEnter: handleOpen,
      onMouseLeave: handleClose,
      onFocus: handleOpen,
      onBlur: handleClose,
    });

    return (
      <>
        {enhancedChildren}
        {open && (
          <div
            ref={tooltipRef}
            className={cn(
              "fixed z-50 pointer-events-none",
              "px-2.5 py-1.5 text-xs font-medium text-white",
              "bg-gray-900 dark:bg-gray-50",
              "rounded-md shadow-lg",
              "animate-fade-in",
              className
            )}
            style={{ left: position.x, top: position.y }}
            role="tooltip"
          >
            {content}
            <div className="tooltip-arrow" />
          </div>
        )}
      </>
    );
  }
);

Tooltip.displayName = "Tooltip";