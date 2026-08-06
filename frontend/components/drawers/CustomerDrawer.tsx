"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Phone, MapPin, ShieldAlert, MessageSquare, Ban, CalendarClock, TrendingUp, User, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";


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
  if (!customer) return null;

  return (
    <BaseDrawer open={open} onClose={onClose} title={customer.name} subtitle={`Customer #${customer.id.substring(0,8)}`}>
      <div className="p-6 space-y-6">
        
        {/* Customer Identity */}
        <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
          <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm">
            {customer.avatar ? <AvatarImage src={customer.avatar} /> : <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground">{customer.name?.charAt(0) || "?"}</AvatarFallback>}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-foreground truncate">{customer.name}</p>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1.5 uppercase tracking-widest",
                customer.workingStatus === "online" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-muted-foreground bg-muted border-border"
              )}>
                <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                {customer.workingStatus === "online" ? "Online" : "Offline"}
              </span>
            </div>
            {customer.workingStatus !== "online" && customer.lastSeen ? (
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Last seen {formatDistanceToNow(new Date(customer.lastSeen), { addSuffix: true })}</p>
            ) : (
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{customer.email}</p>
            )}
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Customer Analytics
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Lifetime Value (LTV)</span>
            <span className="font-bold text-foreground text-sm">${Number(customer.stats?.ltv || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Total Bookings</span>
            <span className="font-medium text-foreground text-sm">{customer.stats?.totalBookings || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
              Active Disputes
              {Number(customer.stats?.activeDisputes) > 0 && <AlertCircle className="w-3 h-3 text-rose-500" />}
            </span>
            <span className={cn("font-medium text-sm", Number(customer.stats?.activeDisputes) > 0 ? "text-rose-500" : "text-foreground")}>
              {customer.stats?.activeDisputes || 0}
            </span>
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Contact & Location
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</span>
            <span className="font-medium text-sm text-foreground">{customer.phone || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Location</span>
            <span className="font-medium text-sm text-foreground truncate max-w-[180px] text-right">{customer.location || "—"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><CalendarClock className="w-3.5 h-3.5" /> Last Job</span>
            <span className="font-medium text-sm text-foreground">{customer.lastBooking || "None"}</span>
          </div>
        </div>

        {/* Recent Bookings Block */}
        {(customer.recentBookings || []).length > 0 && (
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Recent Bookings
            </p>
            <div className="space-y-2">
              {(customer.recentBookings || []).slice(0, 3).map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-background border border-border/50 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-foreground">{b.service}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{b.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${b.amount}</p>
                    <span className={cn("text-[10px] font-bold mt-0.5 block uppercase tracking-widest", STATUS_COLORS[b.status] ?? "text-muted-foreground")}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { id: "message", icon: MessageSquare, label: "Message", color: "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent" },
            { id: "disputes", icon: ShieldAlert, label: "Disputes", color: "bg-background text-foreground hover:bg-muted border-border" },
            { id: "block", icon: Ban, label: "Block", color: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20" },
          ].map(({ id, icon: Icon, label, color }) => (
            <Button 
              key={label}
              variant="outline"
              onClick={() => {
                if (id === "message") {
                  const basePath = user?.role === 'admin' ? '/admin' : '/company';
                  router.push(`${basePath}/messages?new=${customer.id}`);
                  onClose();
                } else if (id === "disputes") {
                  toast({
                    title: "Simulated",
                    description: "Navigating to customer disputes dashboard...",
                  });
                } else if (id === "block") {
                  if (confirm(`Are you sure you want to block ${customer.name}?`)) {
                    toast({
                      title: "Simulated",
                      description: `Blocked customer ${customer.name} successfully.`,
                    });
                  }
                }
              }}
              className={cn("h-10 text-xs font-bold rounded-lg border shadow-sm transition-colors justify-center gap-2", color)}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </Button>
          ))}
        </div>
      </div>
    </BaseDrawer>
  );
}
