"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, Star, MapPin, CheckCircle2, Circle, MessageSquare, Ban, ShieldCheck, Save, Loader2, Wallet, AlertTriangle, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "on_job" | "active" | "inactive";
  lastSeen?: string | Date;
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
  online: { label: "Online", color: "text-emerald-600 bg-emerald-50 border border-emerald-200" },
  offline: { label: "Offline", color: "text-slate-500 bg-slate-100 border border-slate-200" },
  on_job: { label: "On Job", color: "text-violet-600 bg-violet-50 border border-violet-200" },
  active: { label: "Active", color: "text-emerald-600 bg-emerald-50 border border-emerald-200" },
  inactive: { label: "Inactive", color: "text-rose-600 bg-rose-50 border border-rose-200" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 px-8 py-5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm text-center">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{sub}</p>}
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
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthContext();
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
      <div className="p-6 space-y-6">
        {/* Status + ID */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center text-foreground font-bold text-lg shrink-0 border border-border">
            {staff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1.5", 
                cfg.label === "Online" || cfg.label === "Active" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                cfg.label === "On Job" ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" :
                cfg.label === "Inactive" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                "bg-slate-500/10 text-slate-500 border border-slate-500/20"
              )}>
                <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                {cfg.label}
              </span>
              {staff.status === "offline" && staff.lastSeen && (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Last seen {formatDistanceToNow(new Date(staff.lastSeen), { addSuffix: true })}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2">
               ID #{staff.id?.substring(0,8)} <span className="w-1 h-1 rounded-full bg-muted-foreground" /> {staff.phone}
            </p>
          </div>
        </div>

        {/* Real Performance Snapshot */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground px-1">Performance Overview</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/10 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Jobs</span>
              <span className="text-lg font-black text-foreground">{staff.jobsCompleted}</span>
            </div>
            <div className="bg-muted/10 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Payout</span>
              <span className="text-lg font-black text-emerald-500">${staff.pendingPayout}</span>
            </div>
             <div className="bg-muted/10 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Attendance</span>
              <span className="text-lg font-black text-foreground">{staff.attendance}%</span>
            </div>
             <div className="bg-muted/10 border border-border rounded-xl p-3 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">On-Time Rate</span>
              <span className="text-lg font-black text-foreground">{staff.onTimeRate}%</span>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
            <Save className="w-3.5 h-3.5" /> Settings & Commissions
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 mt-1.5 border-border bg-background shadow-sm focus:ring-violet-500/20 rounded-lg text-sm text-foreground">
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
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 mt-1.5 border-border bg-background shadow-sm focus:ring-violet-500/20 rounded-lg text-sm text-foreground">
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
            <Label htmlFor="staffSplit" className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Custom Earning Split (%)</Label>
            <div className="relative mt-1.5">
              <Input
                id="staffSplit"
                type="number"
                min={0}
                max={100}
                placeholder="Default global remainder"
                value={splitPercent}
                onChange={e => setSplitPercent(e.target.value)}
                className="h-9 pr-8 border-border shadow-sm focus:ring-violet-500/20 rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground tracking-widest mt-1.5 uppercase">
              Platform fee is taken from billing first.
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 rounded-lg shadow-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Save Settings
          </Button>
        </div>

      </div>

       {/* Quick Actions */}
       <div className="pt-2 pb-6 mt-4 border-t border-border">
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: "message", icon: MessageSquare, label: "Message", color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" },
              { id: "wallet", icon: Wallet, label: "Profile", color: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" },
              { id: "docs", icon: ShieldCheck, label: "Docs", color: "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 border-slate-500/20" },
              { id: "suspend", icon: Ban, label: "Suspend", color: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20" },
            ].map(({ id, icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => {
                  if (id === "message") {
                    const basePath = user?.role === 'admin' ? '/admin' : '/company';
                    window.location.href = `${basePath}/messages?new=${staff.id}`;
                  } else if (id === "wallet" || id === "docs") {
                    router.push(`/company/staff/${staff.id}`);
                    onClose();
                  }
                }}
                className={cn("flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border", color)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
       </div>
    </BaseDrawer>
  );
}
