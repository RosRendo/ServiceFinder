"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { FileText, Calendar, Building, CheckCircle, XCircle, Download, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ComplianceDocument } from "@/lib/hooks/useAdminCompliance";

interface ComplianceDrawerProps {
  open: boolean;
  onClose: () => void;
  document: ComplianceDocument | null;
  onApprove: (docId: string) => Promise<void>;
  onReject: (docId: string, reason: string) => Promise<void>;
  actionLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
  rejected: "bg-rose-500/10 border-rose-500/20 text-rose-500",
  pending: "bg-amber-500/10 border-amber-500/20 text-amber-500",
};

const LABEL = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function ComplianceDrawer({ open, onClose, document: doc, onApprove, onReject, actionLoading = false }: ComplianceDrawerProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // Reset state when doc changes or drawer closes
  useEffect(() => {
    if (!open) {
      setRejecting(false);
      setReason("");
    }
  }, [open, doc]);

  if (!doc) return null;

  const isPending = doc.status === "pending";

  const handleApprove = async () => {
    await onApprove(doc.id);
  };

  const handleRejectSubmit = async () => {
    if (!reason.trim()) return;
    await onReject(doc.id, reason);
  };

  const footer = isPending ? (
    rejecting ? (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={actionLoading}
          onClick={() => setRejecting(false)}
          className="h-9 text-xs rounded-xl"
        >
          Back
        </Button>
        <Button
          disabled={actionLoading || !reason.trim()}
          onClick={handleRejectSubmit}
          className="flex-1 h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
        >
          {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
          Confirm Rejection
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          disabled={actionLoading}
          onClick={() => setRejecting(true)}
          className="h-9 text-xs rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
        >
          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
        </Button>
        <Button
          disabled={actionLoading}
          onClick={handleApprove}
          className="flex-1 h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        >
          {actionLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
          Approve Document
        </Button>
      </div>
    )
  ) : undefined;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={doc.companyName || "Compliance Document"}
      subtitle={`${doc.documentType} · Doc #${doc.id ? doc.id.toString().substring(0, 8) : ""}`}
      headerIcon={FileText}
      width="md"
      badge={
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
          STATUS_STYLES[doc.status] || "bg-muted border-border text-muted-foreground"
        )}>
          {doc.status}
        </span>
      }
      footer={footer}
    >
      <div className="p-6 space-y-4 font-sans text-xs">
        {/* Company */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground truncate">{doc.companyName}</p>
            <p className={cn(LABEL, "mt-0.5")}>{doc.documentType}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className={LABEL}>Document Details</p>
          <div className="flex justify-between items-center gap-3">
            <span className="text-muted-foreground">Document ID</span>
            <span className="font-mono text-foreground font-semibold truncate">{doc.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold text-foreground">{doc.documentType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Uploaded</span>
            <span className="font-semibold text-foreground">
              {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy h:mm a") : "Unknown"}
            </span>
          </div>
        </div>

        {/* File */}
        <div className="bg-card border border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 bg-muted/40 rounded-xl border border-border flex items-center justify-center mb-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-semibold mb-3">Preview not available</p>
          {doc.fileUrl && (
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-muted/50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Open Original File
            </a>
          )}
        </div>

        {/* Rejection notes (already rejected) */}
        {doc.status === "rejected" && doc.notes && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-rose-500 mb-1.5"><XCircle className="w-3.5 h-3.5" /> Rejection Reason</p>
            <p className="text-foreground/80 leading-relaxed">{doc.notes}</p>
          </div>
        )}

        {/* Reject reason input */}
        {isPending && rejecting && (
          <div className="bg-card border border-rose-500/20 rounded-2xl p-4 space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            <p className="flex items-center gap-1.5 font-bold text-rose-500"><AlertTriangle className="w-3.5 h-3.5" /> Rejection reason required</p>
            <Textarea
              autoFocus
              placeholder="e.g. expired business license, blurred photo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[90px] bg-background border-border text-xs rounded-xl"
            />
          </div>
        )}

        {isPending && !rejecting && (
          <p className="text-muted-foreground text-[11px]">Ensure the document meets all regulatory requirements before approving.</p>
        )}
      </div>
    </BaseDrawer>
  );
}
