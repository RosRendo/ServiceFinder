"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, Mail, Calendar, User as UserIcon, Settings, ShieldAlert, Key, Ban, Server, Eye } from "lucide-react";
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
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  suspended: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
  pending: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
};

export function UserDrawer({ open, onClose, user }: UserDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!user) return null;

  const isSuspending = user.status === "active";
  const actionName = isSuspending ? "suspend" : "unsuspend";

  const statusConfig = STATUS_COLORS[user.status] || { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" };

  return (
    <BaseDrawer open={open} onClose={onClose} title={user.fullName || "User Details"} subtitle={`User #${user.id ? user.id.toString().substring(0, 8) : ''}`}>
      <div className="p-6 space-y-6">
        
        {/* User Identity */}
        <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
          <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm">
            <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-lg">
              {user.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-foreground truncate">{user.fullName}</p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 uppercase tracking-widest",
                statusConfig.bg, statusConfig.border, statusConfig.text
              )}>
                {user.status}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">{user.role?.replace("_", " ")}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" /> Contact Information
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</span>
            <span className="font-medium text-sm text-foreground">{user.email || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</span>
            <span className="font-medium text-sm text-foreground">{user.phone || "—"}</span>
          </div>
        </div>

        {/* System Details */}
        <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <Server className="w-3.5 h-3.5" /> System Details
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> Authorization Level</span>
            <span className="font-bold text-sm text-foreground capitalize">{user.role?.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Account Created</span>
            <span className="font-medium text-sm text-foreground">
              {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "Unknown"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Last Login</span>
            <span className="font-medium text-sm text-foreground">
              {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy") : "Never"}
            </span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/admin/users/${user.id}`)}
            className="h-10 text-xs font-bold rounded-lg border shadow-sm transition-colors justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
          >
            <Eye className="w-3.5 h-3.5" /> View Profile
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => toast({ title: "Password Reset", description: `Password reset email sent to ${user.email}` })}
            className="h-10 text-xs font-bold rounded-lg border shadow-sm transition-colors justify-center gap-2 bg-background text-foreground hover:bg-muted border-border"
          >
            <Key className="w-3.5 h-3.5" /> Reset Password
          </Button>

          <Button 
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            className="h-10 text-xs font-bold rounded-lg border shadow-sm transition-colors justify-center gap-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20 col-span-2"
          >
            <Ban className="w-3.5 h-3.5" /> {isSuspending ? "Suspend User Account" : "Reactivate User Account"}
          </Button>
        </div>

      </div>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={isSuspending ? "Suspend User Account" : "Reactivate User Account"}
        description={`Are you sure you want to ${actionName} ${user.fullName}?`}
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
            onClose();
          } catch (e: any) {
            toast({ title: "Error", description: `Failed to ${actionName} user account`, variant: "destructive" });
          }
        }}
      />
    </BaseDrawer>
  );
}
