"use client";

import React, { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, MessageSquare, ArrowRight, DollarSign } from "lucide-react";
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
}

export function DisputeDrawer({
  open,
  onClose,
  dispute,
  onStatusChange,
  isUpdating = false,
}: DisputeDrawerProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");

  if (!dispute) return null;

  const disputeIdDisplay = dispute.id?.toString().slice(0, 8);
  const statusVariant = 
    dispute.status === "resolved" ? "success" :
    dispute.status === "under_review" ? "warning" :
    dispute.status === "dismissed" ? "neutral" : "danger";

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={dispute.reason || "Dispute Case Review"}
      subtitle={`Case #${disputeIdDisplay} • Booking #${dispute.bookingId || "N/A"}`}
      width="xl"
      headerIcon={ShieldAlert}
    >
      <div className="flex flex-col h-full bg-background relative font-sans text-slate-900">
        {/* Status Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border",
                statusVariant === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                statusVariant === "warning" && "bg-amber-50 text-amber-700 border-amber-200",
                statusVariant === "danger" && "bg-rose-50 text-rose-700 border-rose-200",
                statusVariant === "neutral" && "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              {dispute.status.replace("_", " ")}
            </span>
            {dispute.amount && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Disputed: ${dispute.amount.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Filed: {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : "Recent"}
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Parties Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{dispute.customerName || "Customer Account"}</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Service Provider</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{dispute.companyName || "Service Provider"}</p>
            </div>
          </div>

          {/* Dispute Statement */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Statement</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-md border border-slate-100">
              {dispute.description || "Customer reported service issues or incomplete delivery on this job."}
            </p>
          </div>

          {/* Action Decision Form */}
          {dispute.status !== "resolved" && dispute.status !== "dismissed" && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Mediation Note</h4>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Enter mediation finding or audit reason..."
                className="min-h-[80px] bg-slate-50 border-slate-200 text-sm"
              />
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => onStatusChange?.("under_review", resolutionNotes)}
                  className="text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                >
                  Mark Under Review
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => onStatusChange?.("dismissed", resolutionNotes)}
                  className="text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1 text-slate-400" /> Dismiss Case
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onStatusChange?.("resolved", resolutionNotes)}
                  className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 ml-auto"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolve Dispute
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </BaseDrawer>
  );
}

export default DisputeDrawer;
