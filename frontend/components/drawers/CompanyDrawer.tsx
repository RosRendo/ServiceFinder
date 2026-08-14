"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Building2, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, ShieldCheck, Percent, Users, Layers, Activity, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifyCompanyModal } from "../admin/VerifyCompanyModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Loader2, Edit2, Save, X } from "lucide-react";

export interface CompanyRow {
  id: string;
  name: string;
  owner: string;
  ownerEmail: string;
  phone: string;
  staffCount: number;
  platformFee: number;
  rating: number;
  totalRevenue: number;
  totalBookings: number;
  status: "active" | "suspended" | "pending_verification" | "verified";
  joinedDate: string;
  lastActive?: string;
  workingStatus?: string;
  verified: boolean;
  services: { name: string; price: string }[];
  documents: { label: string; verified: boolean }[];
  verificationDocumentUrl?: string;
  ownerId?: string;
  logoUrl?: string;
}

interface CompanyDrawerProps {
  open: boolean;
  onClose: () => void;
  company: CompanyRow | null;
  onSuccess?: () => void;
}

function getFullLogoUrl(src?: string, name?: string) {
  if (!src) {
    return name ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}` : undefined;
  }
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  const slash = src.startsWith("/") ? "" : "/";
  return `${backendUrl}${slash}${src}`;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  active: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  suspended: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
  pending_verification: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
};

export function CompanyDrawer({ open, onClose, company, onSuccess }: CompanyDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [fee, setFee] = useState(15);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  
  useEffect(() => {
    if (company) {
      setFee(company.platformFee);
      setEditForm({ name: company.name, phone: company.phone });
      setIsEditing(false);
    }
  }, [company]);

  const handleSave = async () => {
    if (!company) return;
    setIsSaving(true);
    try {
      await api.patch(`/admin/companies/${company.id}`, editForm);
      toast({ title: "Saved", description: "Company details updated successfully." });
      setIsEditing(false);
      onSuccess?.(); // trigger table refresh
    } catch (err) {
      toast({ title: "Error", description: "Failed to update details.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!company) return null;

  const statusConfig = STATUS_COLORS[company.status] || { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" };

  return (
    <>
      <BaseDrawer open={open} onClose={onClose} title={company.name} subtitle={`Company #${company.id}`}>
        <div className="p-6 space-y-6">
          
          {/* Identity & Status */}
          <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm border border-primary/20 overflow-hidden">
              {getFullLogoUrl(company.logoUrl, company.name) ? (
                <img src={getFullLogoUrl(company.logoUrl, company.name)} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <input 
                    value={editForm.name} 
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 h-7 px-2 text-sm font-bold bg-background border border-border rounded focus:outline-none focus:border-primary"
                  />
                ) : (
                  <p className="font-bold text-sm text-foreground truncate">{company.name}</p>
                )}
                {!isEditing && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest shrink-0",
                    statusConfig.bg, statusConfig.border, statusConfig.text
                  )}>
                    {company.status?.replace(/_/g, " ") || 'Unknown'}
                  </span>
                )}
              </div>
              <p className={cn("text-xs font-bold mt-1 flex items-center gap-1.5", company.verified ? "text-emerald-500" : "text-amber-500")}>
                {company.verified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                {company.verified ? "Verified Partner" : "Pending Verification"}
              </p>
            </div>
          </div>

          {/* Contact & Owner Info */}
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Contact Details
              </p>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${company.ownerEmail}\nPassword: Password123!`);
                  toast({ title: "Copied!", description: "Credentials copied to clipboard." });
                }}
                className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase hover:bg-primary/20 transition-colors"
              >
                Copy Credentials
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Owner Name</span>
              <span className="font-bold text-foreground text-sm">{company.owner}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="font-medium text-foreground text-sm">{company.ownerEmail || "No email"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm shrink-0 mr-4">Phone</span>
              {isEditing ? (
                <input 
                  value={editForm.phone} 
                  onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                  className="h-7 w-32 px-2 text-sm font-bold bg-background border border-border rounded focus:outline-none focus:border-primary text-right"
                />
              ) : (
                <span className="font-medium text-foreground text-sm truncate">{company.phone || "No phone"}</span>
              )}
            </div>
            
            {/* Inline Edit Controls */}
            {isEditing ? (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
                <Button size="sm" className="flex-1 h-8" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />} Save
                </Button>
              </div>
            ) : (
              <div className="pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-3 h-3 mr-1" /> Quick Edit Details
                </Button>
              </div>
            )}
          </div>

          {/* Performance KPIs */}
          <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Platform Performance
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total Revenue (Gross)</span>
              <span className="font-bold text-foreground text-sm">${(company.totalRevenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Total Bookings</span>
              <span className="font-medium text-foreground text-sm">{company.totalBookings || 0}</span>
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
          {(company.services || []).length > 0 && (
            <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Services Offered
              </p>
              <div className="space-y-2">
                {(company.services || []).map((s) => (
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
              {(company.documents || []).length > 0 ? (
                (company.documents || []).map((d) => (
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
              { id: "verify", icon: ShieldCheck, label: "Verify Company", color: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20", show: company.status !== "active" && company.status !== "verified" },
              { id: "message", icon: MessageSquare, label: "Contact Owner", color: "bg-background text-foreground hover:bg-muted border-border" },
              { id: "profile", icon: TrendingUp, label: "Full Profile", color: "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent" },
              { id: "suspend", icon: Ban, label: "Suspend Company", color: "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20" },
            ]
            .filter((action) => action.show !== false)
            .map(({ id, icon: Icon, label, color }) => (
              <Button 
                key={label}
                variant="outline"
                onClick={async () => {
                  if (id === "verify") setVerifyModalOpen(true);
                  if (id === "profile") {
                    router.push(`/admin/companies/${company.id}`);
                    onClose();
                  }
                  if (id === "message") {
                    if (company.ownerId) {
                      router.push(`/admin/messages?new=${company.ownerId}`);
                      onClose();
                    } else {
                      alert("No owner ID associated with this company.");
                    }
                  }
                  if (id === "suspend") {
                    if (confirm(`Are you sure you want to suspend ${company.name}?`)) {
                      try {
                        await api.post(`/admin/companies/${company.id}/suspend`);
                        onSuccess?.();
                        onClose();
                      } catch (err) {
                        console.error("Failed to suspend company", err);
                      }
                    }
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
