"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, MapPin, ShieldCheck, Save, Loader2, MessageSquare, Briefcase, User, Award, ExternalLink, Calendar } from "lucide-react";
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
  compliance?: { label: string; verified: boolean }[];
  schedule?: { time: string; service: string; status: "done" | "active" | "upcoming" }[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  online: { label: "Online", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", icon: ShieldCheck },
  offline: { label: "Offline", bg: "bg-muted", text: "text-muted-foreground", border: "border-border", icon: User },
  on_job: { label: "On Job", bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20", icon: Briefcase },
  active: { label: "Active", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", icon: ShieldCheck },
  inactive: { label: "Inactive", bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20", icon: ShieldCheck },
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

  const isAdmin = user?.role === "admin";

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={staffName}
      subtitle={staff.role ? staff.role.replace(/_/g, " ").toUpperCase() : "STAFF MEMBER"}
      badge={
        <span className={cn("inline-flex px-2.5 py-0.5 rounded-full border items-center gap-1 font-bold text-[10px] uppercase tracking-wider", cfg.bg, cfg.text, cfg.border)}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      }
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
          onClick={() => {
            const path = isAdmin ? `/admin/users/${staff.id}` : `/company/staff/${staff.id}`;
            router.push(path);
            onClose();
          }}
        >
          <span>Full Profile</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </Button>
      }
      width="lg"
    >
      <div className="p-6 space-y-5 font-sans">
        {/* Identity & Presence Hero */}
        <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
          <Avatar className="w-12 h-12 rounded-xl border border-border">
            <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
              {staffInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{staffName}</h3>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {staff.role?.replace(/_/g, " ") || "Field Technician"}
            </p>
            {staff.status === "offline" && staff.lastSeen && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Active {formatDistanceToNow(new Date(staff.lastSeen), { addSuffix: true })}
              </p>
            )}
          </div>
          {staffPhone && (
            <Button variant="outline" size="sm" className="rounded-xl h-8 px-3 text-xs font-semibold gap-1.5" asChild>
              <a href={`tel:${staffPhone}`}>
                <Phone className="w-3 h-3" /> Call
              </a>
            </Button>
          )}
        </div>

        {/* Contact & Location Details */}
        <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
          <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" /> Technician Profile
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Mobile
            </span>
            <span className="font-semibold text-foreground font-mono">{staffPhone || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Operating Region
            </span>
            <span className="font-medium text-foreground">{staff.currentLocation || "Phnom Penh"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Designation
            </span>
            <span className="font-semibold text-foreground capitalize">{staff.role?.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Performance Snapshot */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-foreground px-1 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-primary" /> Performance Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Completed Jobs
              </span>
              <span className="text-2xl font-extrabold text-foreground font-mono">{staff.jobsCompleted}</span>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Pending Settlement
              </span>
              <span className="text-2xl font-extrabold text-foreground font-mono">${staff.pendingPayout}</span>
            </div>
          </div>
        </div>

        {/* Company Settings & Commissions Form (Only for Merchant Portal) */}
        {!isAdmin && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-border pb-2.5">
              <Save className="w-3.5 h-3.5 text-muted-foreground" /> Role & Split Commission
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-8.5 border-border bg-background rounded-xl text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-8.5 border-border bg-background rounded-xl text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="staffSplit" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Technician Earning Split (%)
              </Label>
              <div className="relative">
                <Input
                  id="staffSplit"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Default global remainder"
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(e.target.value)}
                  className="h-8.5 pr-8 border-border rounded-xl text-xs font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 rounded-xl shadow-2xs mt-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
              Save Technician Settings
            </Button>
          </div>
        )}

        {/* Communication Action */}
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => {
              const basePath = isAdmin ? "/admin" : "/company";
              router.push(`${basePath}/messages?new=${staff.id}`);
              onClose();
            }}
            className="w-full h-9 rounded-xl border border-border text-xs font-semibold gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Send Direct Message</span>
          </Button>
        </div>
      </div>
    </BaseDrawer>
  );
}

export default StaffDrawer;
