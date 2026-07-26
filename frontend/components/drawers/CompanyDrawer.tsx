"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Building2, Phone, Star, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, ShieldCheck, Percent, Users, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CompanyRow {
  id: string;
  name: string;
  owner: string;
  phone: string;
  staffCount: number;
  platformFee: number;
  rating: number;
  totalRevenue: number;
  totalBookings: number;
  status: "active" | "suspended" | "pending_verification";
  joinedDate: string;
  verified: boolean;
  services: { name: string; price: string }[];
  documents: { label: string; verified: boolean }[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-6 py-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

interface CompanyDrawerProps {
  open: boolean;
  onClose: () => void;
  company: CompanyRow | null;
}

export function CompanyDrawer({ open, onClose, company }: CompanyDrawerProps) {
  const [fee, setFee] = useState(company?.platformFee ?? 15);
  const [feeEditing, setFeeEditing] = useState(false);
  if (!company) return null;

  const statusCfg = {
    active: "text-emerald-400 bg-emerald-400/10",
    suspended: "text-red-400 bg-red-400/10",
    pending_verification: "text-amber-400 bg-amber-400/10",
  };

  return (
    <BaseDrawer open={open} onClose={onClose} title={company.name} subtitle={`Company #${company.id} · Joined ${company.joinedDate}`}>
      {/* Status */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", statusCfg[company.status])}>
            {company.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">{company.verified ? "✓ Verified" : "Pending Verification"}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="px-6 py-4 border-b border-border grid grid-cols-3 gap-3">
        {[
          { label: "Total Revenue", value: `$${company.totalRevenue.toLocaleString()}` },
          { label: "Total Bookings", value: String(company.totalBookings) },
          { label: "Avg Rating", value: `★ ${company.rating}` },
        ].map((s) => (
          <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Platform Fee (inline editable) */}
      <Section title="Platform Fee">
        <div className="flex items-center gap-3">
          <Percent className="w-4 h-4 text-muted-foreground" />
          {feeEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={fee}
                min={0}
                max={50}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-20 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none focus:border-violet-500"
              />
              <span className="text-sm text-muted-foreground">%</span>
              <button onClick={() => setFeeEditing(false)} className="text-xs text-emerald-400 font-medium hover:text-emerald-300">Save</button>
              <button onClick={() => { setFee(company.platformFee); setFeeEditing(false); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">{fee}%</span>
              <button onClick={() => setFeeEditing(true)} className="text-xs text-violet-400 hover:text-violet-300">Adjust</button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-7">Platform commission per completed booking</p>
      </Section>

      {/* Staff */}
      <Section title="Staff">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{company.staffCount} active staff members</span>
        </div>
      </Section>

      {/* Services */}
      <Section title="Services Offered">
        <div className="space-y-1.5">
          {company.services.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><Layers className="w-3 h-3 text-muted-foreground" /> {s.name}</div>
              <span className="text-muted-foreground">{s.price}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Documents */}
      <Section title="Documents">
        <div className="space-y-2">
          {company.documents.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5">
              {d.verified
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                : <Circle className="w-4 h-4 text-amber-400 shrink-0" />
              }
              <span className="text-sm text-foreground">{d.label}</span>
              <span className={cn("text-xs ml-auto", d.verified ? "text-emerald-400" : "text-amber-400")}>
                {d.verified ? "Verified" : "Pending"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Quick Actions */}
      <Section title="Quick Actions">
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ShieldCheck, label: "Verify Company", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
            { icon: MessageSquare, label: "Contact Owner", color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
            { icon: TrendingUp, label: "View Analytics", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
            { icon: Ban, label: "Suspend Company", color: "bg-red-500/10 text-red-400 hover:bg-red-500/20" },
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
