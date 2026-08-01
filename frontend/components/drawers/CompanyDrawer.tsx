"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Building2, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, ShieldCheck, Percent, Users, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifyCompanyModal } from "../admin/VerifyCompanyModal";

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
  verificationDocumentUrl?: string;
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
  onSuccess?: () => void;
}

export function CompanyDrawer({ open, onClose, company, onSuccess }: CompanyDrawerProps) {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [fee, setFee] = useState(15);
  
  useEffect(() => {
    if (company) {
      setFee(company.platformFee);
    }
  }, [company]);

  if (!company) return null;

  const statusCfg = {
    active: "text-emerald-400 bg-emerald-400/10",
    suspended: "text-red-400 bg-red-400/10",
    pending_verification: "text-amber-400 bg-amber-400/10",
  };

  return (
    <>
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

        {/* Platform Fee (read-only as it's governed globally) */}
        <Section title="Platform Fee">
          <div className="flex items-center gap-3">
            <Percent className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{fee}%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-7">Platform commission rate (adjusted via settings)</p>
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
            {company.documents.length > 0 ? (
              company.documents.map((d) => (
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
              ))
            ) : (
              <span className="text-xs text-muted-foreground">No documents uploaded</span>
            )}
          </div>
        </Section>

        {/* Quick Actions */}
        <Section title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setVerifyModalOpen(true)} 
              disabled={company.status === "active"}
              className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", 
                company.status === "active" 
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50" 
                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Verify Company
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-violet-500/10 text-violet-400 hover:bg-violet-500/20">
              <MessageSquare className="w-3.5 h-3.5" /> Contact Owner
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
              <TrendingUp className="w-3.5 h-3.5" /> View Analytics
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-red-500/10 text-red-400 hover:bg-red-500/20">
              <Ban className="w-3.5 h-3.5" /> Suspend Company
            </button>
          </div>
        </Section>
        <div className="h-6" />
      </BaseDrawer>

      <VerifyCompanyModal 
        open={verifyModalOpen} 
        onClose={() => setVerifyModalOpen(false)} 
        companyId={company.id}
        companyName={company.name}
        documentUrl={company.verificationDocumentUrl}
        onSuccess={() => {
          onSuccess?.();
          onClose();
        }}
      />
    </>
  );
}
