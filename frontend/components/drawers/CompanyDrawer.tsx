"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Building2, CheckCircle2, Circle, MessageSquare, Ban, TrendingUp, ShieldCheck, Percent, Users, Layers, Activity, Search, ExternalLink, Phone, Mail, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { VerifyCompanyModal } from "../admin/VerifyCompanyModal";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Loader2, Edit2, Save, X } from "lucide-react";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600", label: "Active" },
  verified: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-600", label: "Verified" },
  suspended: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-600", label: "Suspended" },
  pending_verification: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600", label: "Pending Vetting" },
};

export function CompanyDrawer({ open, onClose, company, onSuccess }: CompanyDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [fee, setFee] = useState(15);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);
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
      onSuccess?.();
    } catch {
      toast({ title: "Error", description: "Failed to update details.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!company) return null;

  const ownerName = typeof company.owner === "object" ? (company.owner as any)?.fullName : (company.owner || "Owner");
  const ownerEmail = typeof company.owner === "object" ? (company.owner as any)?.email : (company.ownerEmail || (company as any).email || "No email");
  const statusConfig = STATUS_COLORS[company.status] || {
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    label: company.status || "Unknown",
  };

  return (
    <>
      <BaseDrawer
        open={open}
        onClose={onClose}
        title={company.name}
        subtitle={`Merchant ID: #${company.id}`}
        badge={
          <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", statusConfig.bg, statusConfig.border, statusConfig.text)}>
            {statusConfig.label}
          </span>
        }
        headerActions={
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
            onClick={() => {
              router.push(`/admin/companies/${company.id}`);
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
          {/* Company Identity Header */}
          <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
            <Avatar className="w-12 h-12 rounded-xl border border-border">
              <AvatarImage src={getFullLogoUrl(company.logoUrl, company.name)} />
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
                {company.name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{company.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{company.phone || "No phone listed"}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Joined {company.joinedDate || "Recent"}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 text-xs font-semibold border-border"
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
          </div>

          {/* Quick Edit Form */}
          {isEditing && (
            <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3 animate-in fade-in duration-200">
              <p className="text-xs font-bold text-foreground">Update Organization Info</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Business Name"
                  className="h-8.5 px-3 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
                />
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone Number"
                  className="h-8.5 px-3 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary font-mono"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-8.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Details
              </Button>
            </div>
          )}

          {/* Business KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border border-border bg-card text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Active Staff
              </span>
              <span className="text-xl font-extrabold text-foreground font-mono">{company.staffCount ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-border bg-card text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Completed
              </span>
              <span className="text-xl font-extrabold text-foreground font-mono">{company.totalBookings ?? 0}</span>
            </div>
            <div className="p-3.5 rounded-2xl border border-border bg-card text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Gross Vol.
              </span>
              <span className="text-xl font-extrabold text-foreground font-mono">
                ${Number(company.totalRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Owner & Account Details */}
          <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
            <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Primary Account Holder
            </p>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Owner Name</span>
              <span className="font-semibold text-foreground">{ownerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Owner Email</span>
              <span className="font-medium text-foreground">{ownerEmail}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Platform Commission Rate</span>
              <span className="font-mono font-bold text-foreground">{company.platformFee ?? 15}%</span>
            </div>
          </div>

          {/* Documents & Verification Proof */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Compliance Credentials
            </p>
            <div className="space-y-1.5">
              {(company.documents || []).length > 0 ? (
                company.documents.map((d) => (
                  <div key={d.label} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-border text-xs">
                    <span className="font-medium text-foreground">{d.label}</span>
                    {d.verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                        <Circle className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-3 text-xs text-muted-foreground">No verification documents uploaded</div>
              )}
            </div>
          </div>

          {/* Bottom Administrative Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            {company.status !== "active" && company.status !== "verified" && (
              <Button
                variant="outline"
                onClick={() => setVerifyModalOpen(true)}
                className="h-9 text-xs font-bold rounded-xl border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 gap-1.5 col-span-2"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify Business Application</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                if (company.ownerId) {
                  router.push(`/admin/messages?new=${company.ownerId}`);
                  onClose();
                } else {
                  toast({ title: "Notice", description: "No owner direct message channel available." });
                }
              }}
              className="h-9 text-xs font-semibold rounded-xl border border-border gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Contact Merchant</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setSuspendConfirmOpen(true)}
              className={cn(
                "h-9 text-xs font-semibold rounded-xl border gap-1.5",
                company.status === "suspended"
                  ? "border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
                  : "border-rose-500/20 text-rose-600 hover:bg-rose-500/10"
              )}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{company.status === "suspended" ? "Reactivate Account" : "Suspend Merchant"}</span>
            </Button>
          </div>
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

      {/* Suspend / Reactivate Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={suspendConfirmOpen}
        onClose={() => setSuspendConfirmOpen(false)}
        title={company.status === "suspended" ? "Reactivate Company Account" : "Suspend Company Account"}
        description={
          company.status === "suspended"
            ? `Are you sure you want to reactivate "${company.name}"? This will restore merchant services and customer dispatch.`
            : `Are you sure you want to suspend "${company.name}"? This will freeze all merchant services, staff dispatch, and incoming bookings.`
        }
        actionType={company.status === "suspended" ? "warning" : "danger"}
        confirmLabel={company.status === "suspended" ? "Reactivate Company" : "Suspend Company"}
        onConfirm={async () => {
          try {
            if (company.status === "suspended") {
              await api.patch(`/admin/companies/${company.id}`, { status: "active" });
              toast({ title: "Company Reactivated", description: `${company.name} is now active.` });
            } else {
              await api.post(`/admin/companies/${company.id}/suspend`);
              toast({ title: "Company Suspended", description: `${company.name} has been suspended.` });
            }
            onSuccess?.();
            onClose();
          } catch (err) {
            console.error("Failed to update company status", err);
            toast({ title: "Error", description: "Failed to update company status", variant: "destructive" });
          } finally {
            setSuspendConfirmOpen(false);
          }
        }}
      />
    </>
  );
}

export default CompanyDrawer;
