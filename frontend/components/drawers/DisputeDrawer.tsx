"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BaseDrawer } from "./BaseDrawer";
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, MessageSquare, ArrowRight, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface DisputeRecord {
  id: string | number;
  bookingId?: string | number;
  customerName?: string;
  companyName?: string;
  reason?: string;
  amount?: number;
  status: "open" | "under_review" | "resolved" | "dismissed";
  createdAt?: string;
  description?: string;
  evidenceUrls?: string[];
  proposedResolution?: string;
}

interface DisputeDrawerProps {
  open: boolean;
  onClose: () => void;
  dispute: DisputeRecord | null;
  onStatusChange?: (status: "resolved" | "dismissed" | "under_review", notes?: string) => void;
  isUpdating?: boolean;
  isAdmin?: boolean;
}

export function DisputeDrawer({
  open,
  onClose,
  dispute,
  onStatusChange,
  isUpdating = false,
  isAdmin = true,
}: DisputeDrawerProps) {
  const router = useRouter();
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!dispute) return null;

  const disputeIdDisplay = dispute.id?.toString().slice(0, 8);
  const statusConfig = {
    resolved: { label: "Resolved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    under_review: { label: "Under Review", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    dismissed: { label: "Dismissed", class: "bg-muted text-muted-foreground border-border" },
    open: { label: "Open Dispute", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  }[dispute.status] || { label: dispute.status, class: "bg-muted text-muted-foreground border-border" };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={dispute.reason || "Dispute Case Investigation"}
      subtitle={`Case #${disputeIdDisplay} • Order #${dispute.bookingId || "N/A"}`}
      badge={
        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", statusConfig.class)}>
          {statusConfig.label}
        </span>
      }
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
          onClick={() => {
            const basePath = isAdmin ? "/admin" : "/company";
            router.push(`${basePath}/disputes/${dispute.id}`);
            onClose();
          }}
        >
          <span>Mediation Desk</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </Button>
      }
      width="xl"
    >
      <div className="p-6 space-y-5 font-sans">
        {/* Parties Involved Hero Card */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl border border-border bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Customer Account
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {dispute.customerName || "Customer Client"}
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
              Service Merchant
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {dispute.companyName || "Service Merchant"}
            </p>
          </div>
        </div>

        {/* Disputed Amount & Claim Meta */}
        {dispute.amount && (
          <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] font-bold uppercase tracking-wider">
                Claim Value in Escrow
              </span>
              <span className="font-mono text-xl font-extrabold text-foreground mt-0.5 block">
                ${dispute.amount.toFixed(2)}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Logged {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : "Recent"}
            </span>
          </div>
        )}

        {/* Dispute Statement */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Client Dispute Statement</h4>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-xl border border-border">
            {dispute.description || "Customer reported service discrepancy or incomplete delivery on this job."}
          </p>
        </div>

        {/* Admin Mediation Decision Form */}
        {isAdmin && dispute.status !== "resolved" && dispute.status !== "dismissed" && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Official Mediation Finding
            </h4>
            <Textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter mediation audit notes or justification..."
              className="min-h-[85px] bg-background border-border text-xs rounded-xl"
            />
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={() => onStatusChange?.("under_review", resolutionNotes)}
                className="text-xs font-semibold text-amber-600 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl"
              >
                Mark Under Review
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isUpdating}
                onClick={() => onStatusChange?.("dismissed", resolutionNotes)}
                className="text-xs font-semibold text-muted-foreground border-border hover:bg-muted rounded-xl"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Dismiss Claim
              </Button>
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => onStatusChange?.("resolved", resolutionNotes)}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white ml-auto rounded-xl"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve & Settle
              </Button>
            </div>
          </div>
        )}

        {/* Company Owner Quick Actions */}
        {!isAdmin && (
          <div className="pt-2 flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/company/messages?topic=dispute_${dispute.id}`);
                onClose();
              }}
              className="flex-1 text-xs font-semibold h-9 rounded-xl border border-border"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Contact Client
            </Button>
            <Button
              onClick={() => {
                router.push(`/company/disputes/${dispute.id}`);
                onClose();
              }}
              className="flex-1 text-xs font-bold h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Review Case Desk <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </BaseDrawer>
  );
}

export default DisputeDrawer;
