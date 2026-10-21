"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Phone, MapPin, ShieldAlert, MessageSquare, Ban, CalendarClock, TrendingUp, User, Activity, AlertCircle, ExternalLink, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  workingStatus?: string;
  lastSeen?: string | Date;
  avatar?: string;
  location: string;
  ltv: number;
  totalBookings: number;
  activeDisputes: number;
  rating: number;
  lastBooking: string;
  joinedDate: string;
  stats?: {
    ltv: number;
    totalBookings: number;
    activeDisputes: number;
  };
  recentBookings: { id: string; service: string; date: string; amount: number; status: string }[];
}

interface CustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: CustomerRow | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-500",
  pending: "text-amber-500",
  in_progress: "text-indigo-500",
  cancelled: "text-rose-500",
};

export function CustomerDrawer({ open, onClose, customer }: CustomerDrawerProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);

  if (!customer) return null;

  const customerName = customer.name || (customer as any).fullName || "Client";
  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "CL";

  const isAdmin = user?.role === "admin";
  const activeDisputes = customer.stats?.activeDisputes ?? customer.activeDisputes ?? 0;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={customerName}
      subtitle={`Customer ID: #${customer.id ? customer.id.toString().substring(0, 8) : ""}`}
      badge={
        <span
          className={cn(
            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 uppercase tracking-wider",
            customer.workingStatus === "online"
              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
              : "text-muted-foreground bg-muted border-border"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          {customer.workingStatus === "online" ? "Online" : "Offline"}
        </span>
      }
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
          onClick={() => {
            if (isAdmin) {
              router.push(`/admin/users/${customer.id}`);
            } else {
              router.push(`/company/customers/${customer.id}`);
            }
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
        {/* Customer Identity Card */}
        <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
          <Avatar className="w-12 h-12 rounded-xl border border-border">
            {customer.avatar ? (
              <AvatarImage src={customer.avatar} />
            ) : (
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">{customerName}</h3>
            <p className="text-xs text-muted-foreground truncate">{customer.email || "No email on record"}</p>
            {customer.phone && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{customer.phone}</p>
            )}
          </div>
          {customer.phone && (
            <Button variant="outline" size="sm" className="rounded-xl h-8 px-3 text-xs font-semibold gap-1.5" asChild>
              <a href={`tel:${customer.phone}`}>
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </Button>
          )}
        </div>

        {/* Dispute Alert Banner (If Applicable) */}
        {activeDisputes > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-600">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                <strong>{activeDisputes}</strong> open dispute claim{activeDisputes > 1 ? "s" : ""} on record.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const basePath = isAdmin ? "/admin" : "/company";
                router.push(`${basePath}/disputes?customerId=${customer.id}`);
                onClose();
              }}
              className="h-7 text-xs border-rose-500/30 text-rose-600 hover:bg-rose-500/20"
            >
              Inspect Disputes
            </Button>
          </div>
        )}

        {/* Analytics Card */}
        <div className="space-y-2.5 bg-card border border-border rounded-2xl p-4 text-xs">
          <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /> Customer Lifetime Analytics
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Lifetime Revenue (LTV)</span>
            <span className="font-mono font-bold text-foreground text-sm">
              ${Number(customer.stats?.ltv || customer.ltv || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Bookings Completed</span>
            <span className="font-mono font-semibold text-foreground">
              {customer.stats?.totalBookings ?? customer.totalBookings ?? 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Customer Satisfaction Score</span>
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{Number(customer.rating || 5.0).toFixed(1)} / 5.0</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-muted-foreground">Client Since</span>
            <span className="font-medium text-foreground">{customer.joinedDate || "Recent"}</span>
          </div>
        </div>

        {/* Recent Service History */}
        {customer.recentBookings && customer.recentBookings.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" /> Recent Orders
            </p>
            <div className="space-y-2">
              {customer.recentBookings.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-muted/20 text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{b.service}</p>
                    <p className="text-[10px] text-muted-foreground">{b.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground block">${Number(b.amount || 0).toFixed(2)}</span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider", STATUS_COLORS[b.status] || "text-muted-foreground")}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 pt-2">
          <Button
            variant="outline"
            onClick={() => {
              const basePath = isAdmin ? "/admin" : "/company";
              router.push(`${basePath}/messages?new=${customer.id}`);
              onClose();
            }}
            className="flex-1 h-9 rounded-xl border border-border text-xs font-semibold gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Send Message</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setBlockConfirmOpen(true)}
            className="h-9 px-3 rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold gap-1.5"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Block</span>
          </Button>
        </div>
      </div>

      {/* Block Customer Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
        title="Block Customer Account"
        description={`Are you sure you want to block ${customerName}? They will no longer be able to place bookings with your business.`}
        actionType="danger"
        confirmLabel="Block Customer"
        onConfirm={async () => {
          toast({
            title: "Customer Blocked",
            description: `Blocked customer ${customerName} successfully.`,
          });
          setBlockConfirmOpen(false);
          onClose();
        }}
      />
    </BaseDrawer>
  );
}

export default CustomerDrawer;
