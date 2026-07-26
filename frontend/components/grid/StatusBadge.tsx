"use client";

import { cn } from "@/lib/utils";

type Status = "pending" | "accepted" | "in_progress" | "completed" | "cancelled" | "active" | "suspended" | "online" | "offline" | "on_job" | "paid" | "failed" | "processing";

const CONFIG: Record<string, { label: string; color: string }> = {
  pending:       { label: "Pending",        color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  accepted:      { label: "Accepted",       color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  in_progress:   { label: "In Progress",    color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  completed:     { label: "Completed",      color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  cancelled:     { label: "Cancelled",      color: "text-red-400 bg-red-400/10 border-red-400/20" },
  active:        { label: "Active",         color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  suspended:     { label: "Suspended",      color: "text-red-400 bg-red-400/10 border-red-400/20" },
  online:        { label: "Online",         color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  offline:       { label: "Offline",        color: "text-slate-400 bg-slate-400/10 border-slate-400/20" },
  on_job:        { label: "On Job",         color: "text-violet-400 bg-violet-400/10 border-violet-400/20" },
  paid:          { label: "Paid",           color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  failed:        { label: "Failed",         color: "text-red-400 bg-red-400/10 border-red-400/20" },
  processing:    { label: "Processing",     color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
};

interface StatusBadgeProps {
  status: string;
  dot?: boolean;
}

export function StatusBadge({ status, dot = true }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? { label: status, color: "text-muted-foreground bg-muted border-border" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
      cfg.color
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {cfg.label}
    </span>
  );
}
