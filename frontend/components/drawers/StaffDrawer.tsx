"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Phone, Star, MapPin, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, Briefcase, Wallet, ShieldCheck, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "on_job";
  rating: number;
  jobsCompleted: number;
  todayJobs: number;
  earningsToday: number;
  pendingPayout: number;
  tips: number;
  attendance: number;
  onTimeRate: number;
  phone: string;
  currentLocation: string;
  activeJob?: string;
  compliance: { label: string; verified: boolean }[];
  schedule: { time: string; service: string; status: "done" | "active" | "upcoming" }[];
}

const STATUS_CONFIG = {
  online: { label: "Online", color: "text-emerald-400 bg-emerald-400/10" },
  offline: { label: "Offline", color: "text-slate-400 bg-slate-400/10" },
  on_job: { label: "On Job", color: "text-violet-400 bg-violet-400/10" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-6 py-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

interface StaffDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: StaffRow | null;
}

export function StaffDrawer({ open, onClose, staff }: StaffDrawerProps) {
  if (!staff) return null;
  const cfg = STATUS_CONFIG[staff.status];

  return (
    <BaseDrawer open={open} onClose={onClose} title={staff.name} subtitle={staff.role}>
      {/* Status + ID */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.color)}>{cfg.label}</span>
          <p className="text-xs text-muted-foreground mt-1">Staff ID #{staff.id}</p>
        </div>
      </div>

      {/* Performance */}
      <Section title="Performance">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Attendance" value={`${staff.attendance}%`} />
          <MetricCard label="On-Time" value={`${staff.onTimeRate}%`} />
          <MetricCard label="Rating" value={`★ ${staff.rating}`} sub={`${staff.jobsCompleted} jobs`} />
        </div>
      </Section>

      {/* Today's Schedule */}
      <Section title="Today's Schedule">
        <div className="space-y-2">
          {staff.schedule.length === 0
            ? <p className="text-sm text-muted-foreground">No jobs today.</p>
            : staff.schedule.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12 shrink-0">{s.time}</span>
                <div className={cn("w-2 h-2 rounded-full shrink-0",
                  s.status === "done" ? "bg-emerald-400" :
                  s.status === "active" ? "bg-violet-400" : "bg-muted-foreground/30"
                )} />
                <span className={cn("text-sm", s.status === "done" ? "text-muted-foreground line-through" : "text-foreground")}>
                  {s.service}
                </span>
              </div>
            ))
          }
        </div>
      </Section>

      {/* Wallet */}
      <Section title="Wallet">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Earned Today" value={`$${staff.earningsToday}`} />
          <MetricCard label="Pending Payout" value={`$${staff.pendingPayout}`} />
          <MetricCard label="Tips" value={`$${staff.tips}`} />
        </div>
      </Section>

      {/* Live Location */}
      <Section title="Live Location">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          {staff.currentLocation}
        </div>
        {staff.activeJob && (
          <p className="text-xs text-muted-foreground mt-1">
            Currently on: <span className="text-foreground">{staff.activeJob}</span>
          </p>
        )}
        {/* Map placeholder */}
        <div className="mt-3 h-32 rounded-xl bg-muted/60 border border-border flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Live map — Google Maps integration</p>
        </div>
      </Section>

      {/* Compliance */}
      <Section title="Compliance Documents">
        <div className="space-y-2">
          {staff.compliance.map((doc, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {doc.verified
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <Circle className="w-4 h-4 text-amber-400 shrink-0" />
              }
              <span className="text-sm text-foreground">{doc.label}</span>
              <span className={cn("text-xs ml-auto", doc.verified ? "text-emerald-400" : "text-amber-400")}>
                {doc.verified ? "Verified" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Phone, label: "Call", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
            { icon: MessageSquare, label: "Message", color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
            { icon: UserPlus, label: "Assign Job", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
            { icon: TrendingUp, label: "Promote", color: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
            { icon: ShieldCheck, label: "Review Docs", color: "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20" },
            { icon: Ban, label: "Suspend", color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
          ].map(({ icon: Icon, label, color }) => (
            <button key={label} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", color)}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </Section>
      <div className="h-6" />
    </BaseDrawer>
  );
}
