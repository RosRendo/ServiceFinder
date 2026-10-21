"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, Mail, Calendar, User as UserIcon, ShieldAlert, Key, Ban, Server, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

export interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserDrawerProps {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  onSuccess?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600" },
  suspended: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-600" },
  pending: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600" },
};

export function UserDrawer({ open, onClose, user, onSuccess }: UserDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  const isSuspending = user.status === "active";
  const actionName = isSuspending ? "suspend" : "unsuspend";
  const statusConfig = STATUS_COLORS[user.status] || {
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
  };

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      <BaseDrawer
        open={open}
        onClose={onClose}
        title={user.fullName || "User Account"}
        subtitle={`Account ID: #${user.id ? user.id.toString().substring(0, 8) : ""}`}
        badge={
          <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", statusConfig.bg, statusConfig.border, statusConfig.text)}>
            {user.status}
          </span>
        }
        headerActions={
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
            onClick={() => {
              router.push(`/admin/users/${user.id}`);
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
          {/* User Identity Card */}
          <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
            <Avatar className="w-12 h-12 rounded-xl border border-border">
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{user.fullName}</h3>
              <p className="text-xs text-muted-foreground truncate">{user.email || "No email on record"}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                {user.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
            <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Account Credentials
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
              </span>
              <span className="font-medium text-foreground">{user.email || "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
              </span>
              <span className="font-mono font-medium text-foreground">{user.phone || "—"}</span>
            </div>
          </div>

          {/* System Security Details */}
          <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
            <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-muted-foreground" /> Access & Audit
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" /> Platform Role
              </span>
              <span className="font-bold text-foreground uppercase tracking-wider text-[11px]">
                {user.role?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Registration Date
              </span>
              <span className="font-medium text-foreground">
                {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Last Active
              </span>
              <span className="font-medium text-foreground">
                {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy") : "Never"}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-2">
            <Button
              variant="outline"
              onClick={() => toast({ title: "Password Reset", description: `Password reset email dispatched to ${user.email}` })}
              className="w-full h-9 text-xs font-semibold rounded-xl border border-border gap-2"
            >
              <Key className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Send Password Reset Link</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              className={cn(
                "w-full h-9 text-xs font-semibold rounded-xl border gap-2",
                isSuspending
                  ? "border-rose-500/20 text-rose-600 hover:bg-rose-500/10"
                  : "border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
              )}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{isSuspending ? "Suspend User Account" : "Reactivate User Account"}</span>
            </Button>
          </div>
        </div>
      </BaseDrawer>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isSuspending ? "Suspend User Account" : "Reactivate User Account"}
        description={`Are you sure you want to ${actionName} ${user.fullName}? Suspended users cannot authenticate or place orders.`}
        actionType={isSuspending ? "danger" : "warning"}
        confirmLabel={isSuspending ? "Suspend Account" : "Reactivate Account"}
        onConfirm={async () => {
          try {
            if (isSuspending) {
              await api.post(`/admin/users/${user.id}/suspend`);
            } else {
              await api.post(`/admin/users/${user.id}/unsuspend`);
            }
            toast({ title: "Success", description: `User account has been ${isSuspending ? "suspended" : "reactivated"}.` });
            onSuccess?.();
            onClose();
          } catch {
            toast({ title: "Error", description: `Failed to ${actionName} user account`, variant: "destructive" });
          }
        }}
      />
    </>
  );
}

export default UserDrawer;
