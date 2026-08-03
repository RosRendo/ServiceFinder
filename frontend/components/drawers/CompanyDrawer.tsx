"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Building2, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, ShieldCheck, Percent, Users, Layers, Activity, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifyCompanyModal } from "../admin/VerifyCompanyModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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

interface CompanyDrawerProps {
  open: boolean;
  onClose: () => void;
  company: CompanyRow | null;
  onSuccess?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  suspended: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
  pending_verification: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
};

export function CompanyDrawer({ open, onClose, company, onSuccess }: CompanyDrawerProps) {
  const router = useRouter();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [fee, setFee] = useState(15);
  
  useEffect(() => {
    if (company) {
      setFee(company.platformFee);
    }
  }, [company]);

  if (!company) return null;

  const statusConfig = STATUS_COLORS[company.status] || { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" };

  return (
    <>
      <BaseDrawer open={open} onClose={onClose} title={company.name} subtitle={`Company #${company.id}`}>
        <div className="p-6 space-y-6">
          
          {/* Identity & Status */}
          <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-foreground truncate">{company.name}</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest",
                  statusConfig.bg, statusConfig.border, statusConfig.text
                )}>
                  {company.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className={cn("text-xs font-bold mt-0.5 flex items-center gap-1.5", company.verified ? "text-emerald-500" : "text-amber-500")}>
                {company.verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {company.verified ? "Verified Partner" : "Pending Verification"}
              </p>
            </div>
          </div>

          {/* Performance KPIs */}
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Platform Performance
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total Revenue (Gross)</span>
              <span className="font-bold text-foreground text-sm">${company.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total Bookings</span>
              <span className="font-medium text-foreground text-sm">{company.totalBookings}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Average Rating</span>
              <span className="font-bold text-amber-500 text-sm flex items-center gap-1">★ {company.rating}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
              <span className="text-muted-foreground text-sm flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" /> Platform Fee</span>
              <span className="font-bold text-primary text-sm">{fee}%</span>
            </div>
          </div>

          {/* Operations Overview */}
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Operations
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Active Staff Members</span>
              <span className="font-bold text-foreground text-sm">{company.staffCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Joined Date</span>
              <span className="font-medium text-foreground text-sm">{company.joinedDate}</span>
            </div>
          </div>

          {/* Services Offered */}
          {company.services.length > 0 && (
            <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Services Offered
              </p>
              <div className="space-y-2">
                {company.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-2 bg-background border border-border/50 rounded-lg">
                    <span className="text-sm font-bold text-foreground">{s.name}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{s.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
              <Search className="w-3.5 h-3.5" /> Verification Documents
            </p>
            <div className="space-y-2">
              {company.documents.length > 0 ? (
                company.documents.map((d) => (
                  <div key={d.label} className="flex items-center justify-between p-2 bg-background border border-border/50 rounded-lg">
                    <span className="text-sm font-medium text-foreground">{d.label}</span>
                    {d.verified ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        <Circle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">No documents uploaded</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { id: "verify", icon: ShieldCheck, label: "Verify Company", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20", disabled: company.status === "active" },
              { id: "message", icon: MessageSquare, label: "Contact Owner", color: "bg-background text-foreground hover:bg-muted border-border" },
              { id: "profile", icon: TrendingUp, label: "Full Profile", color: "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent" },
              { id: "suspend", icon: Ban, label: "Suspend Company", color: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20" },
            ].map(({ id, icon: Icon, label, color, disabled }) => (
              <Button 
                key={label}
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  if (id === "verify") setVerifyModalOpen(true);
                  if (id === "profile") {
                    router.push(`/admin/companies/${company.id}`);
                    onClose();
                  }
                }}
                className={cn("h-10 text-xs font-bold rounded-lg border shadow-sm transition-colors justify-center gap-2", color)}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </Button>
            ))}
          </div>
          <div className="h-4" />
        </div>
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
