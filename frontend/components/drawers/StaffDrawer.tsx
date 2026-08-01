"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, Star, MapPin, CheckCircle2, Circle, MessageSquare, Ban, ShieldCheck, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "on_job" | "active" | "inactive";
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
  splitPercent?: number | null;
  compliance: { label: string; verified: boolean }[];
  schedule: { time: string; service: string; status: "done" | "active" | "upcoming" }[];
}

const STATUS_CONFIG = {
  online: { label: "Online", color: "text-emerald-400 bg-emerald-400/10" },
  offline: { label: "Offline", color: "text-slate-400 bg-slate-400/10" },
  on_job: { label: "On Job", color: "text-violet-400 bg-violet-400/10" },
  active: { label: "Active", color: "text-emerald-400 bg-emerald-400/10" },
  inactive: { label: "Inactive", color: "text-rose-400 bg-rose-400/10" },
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
  onSuccess?: () => void;
}

export function StaffDrawer({ open, onClose, staff, onSuccess }: StaffDrawerProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("worker");
  const [status, setStatus] = useState("active");
  const [splitPercent, setSplitPercent] = useState<string>("");

  useEffect(() => {
    if (staff) {
      setRole(staff.role || "worker");
      setStatus(staff.status || "active");
      setSplitPercent(staff.splitPercent !== null && staff.splitPercent !== undefined ? staff.splitPercent.toString() : "");
    }
  }, [staff]);

  if (!staff) return null;
  
  // Safeguard status configuration index
  const statusKey = (staff.status in STATUS_CONFIG) ? staff.status : "offline";
  const cfg = STATUS_CONFIG[statusKey];

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put(`/companies/staff/${staff.id}`, {
        role,
        status,
        splitPercent: splitPercent ? Number(splitPercent) : null
      });
      toast({ title: "Success", description: "Staff settings updated successfully" });
      onSuccess?.();
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to update staff settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseDrawer open={open} onClose={onClose} title={staff.name} subtitle={staff.role?.replace(/_/g, " ")}>
      {/* Status + ID */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3 bg-muted/10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 border border-violet-400/20">
          {staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", cfg.color)}>{cfg.label}</span>
          <p className="text-xs text-muted-foreground mt-1.5">Staff ID #{staff.id}</p>
        </div>
      </div>

      {/* Editing Form */}
      <Section title="Settings & Commissions">
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="worker">Worker</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="staffSplit" className="text-xs">Custom Earning Split (%)</Label>
            <div className="relative mt-1">
              <Input
                id="staffSplit"
                type="number"
                min={0}
                max={100}
                placeholder="Default global remainder (approx. 59%)"
                value={splitPercent}
                onChange={e => setSplitPercent(e.target.value)}
                className="h-9 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Overridden rate this worker earns per booking. Platform fee is taken from billing first.
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-9">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Staff Settings
          </Button>
        </div>
      </Section>

      {/* Performance */}
      <Section title="Performance">
        <div className="grid grid-cols-3 gap-2">
          <MetricCard label="Attendance" value={`${staff.attendance}%`} />
          <MetricCard label="On-Time" value={`${staff.onTimeRate}%`} />
          <MetricCard label="Rating" value={`★ ${staff.rating}`} sub={`${staff.jobsCompleted} jobs`} />
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
        <div className="mt-3 h-28 rounded-xl bg-muted/60 border border-border flex items-center justify-center">
          <p className="text-[10px] text-muted-foreground font-semibold">Live tracking map integration</p>
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Phone, label: "Call", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
            { icon: MessageSquare, label: "Message", color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
            { icon: ShieldCheck, label: "Review Docs", color: "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20" },
            { icon: Ban, label: "Suspend", color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
          ].map(({ icon: Icon, label, color }) => (
            <button key={label} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors", color)}>
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
