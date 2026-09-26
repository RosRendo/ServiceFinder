"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, MapPin, ShieldCheck, Save, Loader2, Wallet, Ban, MessageSquare, Briefcase, User, Award, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "on_job" | "active" | "inactive";
  lastSeen?: string | Date;
  jobsCompleted: number;
  pendingPayout: number;
  phone: string;
  currentLocation: string;
  activeJob?: string;
  splitPercent?: number | null;
  compliance: { label: string; verified: boolean }[];
  schedule: { time: string; service: string; status: "done" | "active" | "upcoming" }[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  online: { label: "Online", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", icon: ShieldCheck },
  offline: { label: "Offline", bg: "bg-slate-500/10", text: "text-slate-500", border: "border-slate-500/20", icon: User },
  on_job: { label: "On Job", bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20", icon: Briefcase },
  active: { label: "Active", bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", icon: ShieldCheck },
  inactive: { label: "Inactive", bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", icon: Ban },
};

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

  const staffName = staff.name || (staff as any).user?.fullName || (staff as any).fullName || "Staff Member";
  const staffPhone = staff.phone || (staff as any).user?.phone || "";
  const staffInitials = staffName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";

  const statusKey = (staff.status in STATUS_CONFIG) ? staff.status : "offline";
  const cfg = STATUS_CONFIG[statusKey];
  const StatusIcon = cfg.icon;

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
    <BaseDrawer open={open} onClose={onClose} title={`Staff Profile`} subtitle={staff.role?.replace(/_/g, " ").toUpperCase()} width="lg">
      <div className="p-6 space-y-6">
        
        {/* Header / Status Section */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm shrink-0">
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground">
                {staffInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">{staffName}</h3>
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex px-2 py-0.5 rounded-md border items-center gap-1 font-bold text-[10px] uppercase tracking-widest relative overflow-hidden", cfg.bg, cfg.text, cfg.border)}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
                {staff.status === "offline" && staff.lastSeen && (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Last seen {formatDistanceToNow(new Date(staff.lastSeen), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-10 px-4 border-border hover:bg-muted/50 font-bold"
              onClick={() => {
                const basePath = user?.role === 'admin' ? '/admin' : '/company';
                router.push(`${basePath}/staff/${staff.id}`);
                onClose();
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Full Profile
            </Button>
          </div>
        </div>

        {/* Contact & Info */}
        <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Contact Details
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</span>
            <span className="font-medium">
              {staffPhone ? (
                <a href={`tel:${staffPhone}`} className="hover:underline text-primary">{staffPhone}</a>
              ) : "No phone number"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> City Location</span>
            <span className="font-medium">{staff.currentLocation || "Phnom Penh"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Assigned Role</span>
            <span className="font-medium capitalize">{staff.role?.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Performance Snapshot */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground px-1 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-primary" /> Performance Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/10 border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Jobs Completed</span>
              <span className="text-2xl font-black text-foreground">{staff.jobsCompleted}</span>
            </div>
            <div className="bg-muted/10 border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Pending Payout</span>
              <span className="text-2xl font-black text-emerald-500">${staff.pendingPayout}</span>
            </div>
          </div>
        </div>

        {/* Settings & Commissions Form */}
        <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
          <p className="text-xs font-semibold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
            <Save className="w-3.5 h-3.5 text-primary" /> Settings & Commissions
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 mt-1.5 border-border bg-background shadow-xs focus:ring-primary/20 rounded-lg text-sm text-foreground">
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
                <SelectTrigger className="h-9 mt-1.5 border-border bg-background shadow-xs focus:ring-primary/20 rounded-lg text-sm text-foreground">
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
                className="h-9 pr-8 border-border shadow-xs focus:ring-primary/20 rounded-lg text-sm text-foreground placeholder:text-muted-foreground"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground tracking-widest mt-1.5 uppercase">
              Platform fee is taken from billing first.
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 rounded-lg shadow-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
            Save Settings
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Quick Actions</p>
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
                  const basePath = user?.role === 'admin' ? '/admin' : '/company';
                  if (id === "message") {
                    router.push(`${basePath}/messages?new=${staff.id}`);
                    onClose();
                  } else if (id === "wallet" || id === "docs") {
                    if (user?.role === 'admin') {
                      router.push(`/admin/users/${staff.id}`);
                    } else {
                      router.push(`/company/staff/${staff.id}`);
                    }
                    onClose();
                  } else if (id === "suspend") {
                    toast({ title: "Action Initiated", description: "Suspension workflow is managed on full profile page." });
                  }
                }}
                className={cn("flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border", color)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </BaseDrawer>
  );
}
