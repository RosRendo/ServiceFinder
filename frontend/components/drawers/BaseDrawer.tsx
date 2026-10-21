"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BaseDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  headerIcon?: React.ComponentType<any>;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  footer?: React.ReactNode;
  className?: string;
}

const widthMap = {
  sm: "w-full max-w-[100vw] sm:w-[400px]",
  md: "w-full max-w-[100vw] sm:w-[480px]",
  lg: "w-full max-w-[100vw] sm:w-[580px]",
  xl: "w-full max-w-[100vw] sm:w-[680px]",
  "2xl": "w-full max-w-[100vw] sm:w-[840px]",
  full: "w-full max-w-[100vw] sm:w-[92vw]",
};

export function BaseDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  headerIcon: HeaderIcon,
  headerActions,
  children,
  width = "lg",
  footer,
  className,
}: BaseDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Backdrop with subtle blur */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[3px] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Slide-Over Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl h-[100dvh]",
          "transition-transform duration-300 ease-out font-sans",
          widthMap[width],
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3.5 min-w-0 pr-2">
            {HeaderIcon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <HeaderIcon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {typeof title === "string" ? (
                  <h2 className="text-base font-bold text-foreground truncate tracking-tight">{title}</h2>
                ) : (
                  title
                )}
                {badge}
              </div>
              {subtitle && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate font-medium">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Top Right Actions & Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain h-full relative custom-scrollbar">
          <div className="min-h-full">
            {children}
          </div>
        </div>

        {/* Action Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-border bg-card/60 backdrop-blur-md shrink-0 z-10 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

export default BaseDrawer;
