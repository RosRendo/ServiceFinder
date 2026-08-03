"use client";

import { Trash2, Download, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkAction {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-border bg-background shadow-elevated w-[95vw] sm:w-auto max-w-full overflow-x-auto hide-scrollbar">
      <span className="text-xs sm:text-sm font-semibold text-foreground mr-1 whitespace-nowrap shrink-0">
        {selectedCount} selected
      </span>
      <div className="h-5 w-px bg-border" />
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0",
            action.variant === "danger"
              ? "text-red-400 hover:bg-red-400/10"
              : "text-foreground hover:bg-muted/60"
          )}
        >
          <action.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {action.label}
        </button>
      ))}
      <div className="h-5 w-px bg-border" />
      <button
        onClick={onClear}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
