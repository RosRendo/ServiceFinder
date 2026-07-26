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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-background shadow-elevated">
      <span className="text-sm font-semibold text-foreground mr-1">
        {selectedCount} selected
      </span>
      <div className="h-5 w-px bg-border" />
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            action.variant === "danger"
              ? "text-red-400 hover:bg-red-400/10"
              : "text-foreground hover:bg-muted/60"
          )}
        >
          <action.icon className="w-3.5 h-3.5" />
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
