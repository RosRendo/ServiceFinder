"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Phone, MapPin, ShieldAlert, MessageSquare, Ban, Bell, CalendarClock, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  ltv: number;
  totalBookings: number;
  activeDisputes: number;
  rating: number;
  lastBooking: string;
  joinedDate: string;
  recentBookings: { id: string; service: string; date: string; amount: number; status: string }[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-6 py-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

interface CustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: CustomerRow | null;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-400",
  pending: "text-amber-400",
  in_progress: "text-violet-400",
  cancelled: "text-red-400",
};

export function CustomerDrawer({ open, onClose, customer }: CustomerDrawerProps) {
  if (!customer) return null;

  return (
    <BaseDrawer open={open} onClose={onClose} title={customer.name} subtitle={`Customer #${customer.id} · Joined ${customer.joinedDate}`}>
      {/* Stats */}
      <div className="px-6 py-4 border-b border-border grid grid-cols-3 gap-3">
        {[
          { label: "Lifetime Value", value: `$${customer.ltv.toLocaleString()}` },
          { label: "Total Bookings", value: String(customer.totalBookings) },
          { label: "Disputes", value: String(customer.activeDisputes), red: customer.activeDisputes > 0 },
        ].map((s) => (
          <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
            <p className={cn("text-lg font-bold", s.red ? "text-red-400" : "text-foreground")}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> {customer.phone}</div>
          <div className="flex items-center gap-2.5 text-sm"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {customer.location}</div>
          <div className="flex items-center gap-2.5 text-sm"><CalendarClock className="w-3.5 h-3.5 text-muted-foreground" /> Last booking: {customer.lastBooking}</div>
        </div>
      </Section>

      {/* Booking History */}
      <Section title="Recent Bookings">
        <div className="space-y-2">
          {customer.recentBookings.slice(0, 5).map((b) => (
            <div key={b.id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium">{b.service}</p>
                <p className="text-xs text-muted-foreground">{b.date}</p>
              </div>
              <span className={cn("text-xs font-semibold", STATUS_COLORS[b.status] ?? "text-muted-foreground")}>{b.status}</span>
              <span className="text-sm text-foreground font-medium">${b.amount}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: MessageSquare, label: "Message", color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
            { icon: Bell, label: "Push Notification", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
            { icon: ShieldAlert, label: "View Disputes", color: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" },
            { icon: TrendingUp, label: "Export History", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
            { icon: Ban, label: "Block Customer", color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
          ].map(({ icon: Icon, label, color }) => (
            <button key={label} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", color)}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </Section>
      <div className="h-6" />
    </BaseDrawer>
  );
}
