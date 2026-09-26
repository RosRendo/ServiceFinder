"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { FileText, Calendar, Building, CheckCircle, XCircle, Download, AlertTriangle } from "lucide-react";
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

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  approved: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500" },
  rejected: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-500" },
  pending: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500" },
};

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

  const statusConfig = STATUS_COLORS[doc.status] || { bg: "bg-muted", border: "border-border", text: "text-muted-foreground" };

  const handleApprove = async () => {
    await onApprove(doc.id);
  };

  const handleRejectSubmit = async () => {
    if (!reason.trim()) return;
    await onReject(doc.id, reason);
  };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title="Compliance Document Details"
      subtitle={`Doc #${doc.id ? doc.id.toString().substring(0, 8) : ''}`}
      headerIcon={FileText}
    >
      <div className="p-6 space-y-6">
        {/* Document Header Status */}
        <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <Building className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm text-foreground truncate">{doc.companyName}</p>
              <span className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded border flex items-center gap-1.5 uppercase tracking-widest shrink-0",
                statusConfig.bg, statusConfig.border, statusConfig.text
              )}>
                {doc.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 uppercase tracking-wider">{doc.documentType}</p>
          </div>
        </div>

        {/* Document Details Grid */}
        <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-primary" /> Document Parameters
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2">Document ID</span>
            <span className="font-mono text-xs text-foreground font-semibold">{doc.id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2">Type</span>
            <span className="font-medium text-sm text-foreground">{doc.documentType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Uploaded On</span>
            <span className="font-medium text-sm text-foreground">
              {doc.uploadedAt ? format(new Date(doc.uploadedAt), "MMM d, yyyy h:mm a") : "Unknown"}
            </span>
          </div>
        </div>

        {/* Document Preview Placeholder */}
        <div className="bg-muted/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center p-8 h-48">
          <div className="w-12 h-12 bg-background rounded-xl shadow-sm border border-border flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-muted-foreground font-semibold text-sm mb-3">Document Preview Not Available</p>
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg border border-border bg-background text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download Original File
          </a>
        </div>

        {/* Rejection Notes (if already rejected) */}
        {doc.status === "rejected" && doc.notes && (
          <div className="bg-rose-500/5 text-rose-700 p-4 rounded-xl border border-rose-500/20 text-sm font-medium">
            <div className="flex items-center gap-2 font-bold mb-1.5 text-rose-600">
              <XCircle className="w-4 h-4" /> Rejection Reason:
            </div>
            <p className="text-foreground/80 leading-relaxed font-medium">{doc.notes}</p>
          </div>
        )}

        {/* Action Panel (if pending) */}
        {doc.status === "pending" && !rejecting && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h4 className="font-bold text-sm text-foreground">Review Actions</h4>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Ensure the document meets all regulatory requirements before approving.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                disabled={actionLoading}
                onClick={handleApprove}
                className="flex-1 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve Document
              </Button>
              <Button
                disabled={actionLoading}
                onClick={() => setRejecting(true)}
                variant="outline"
                className="flex-1 h-11 rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject Document
              </Button>
            </div>
          </div>
        )}

        {/* Inline Reject Form */}
        {doc.status === "pending" && rejecting && (
          <div className="space-y-4 pt-4 border-t border-border animate-in fade-in-50 slide-in-from-bottom-5 duration-200">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" /> Rejection Reason Required
            </div>
            <Textarea
              placeholder="Explain why this document is being rejected (e.g. expired business license, blurred photo)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] rounded-lg border-border font-medium placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <Button
                disabled={actionLoading || !reason.trim()}
                onClick={handleRejectSubmit}
                className="flex-1 h-10 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Rejection
              </Button>
              <Button
                disabled={actionLoading}
                onClick={() => setRejecting(false)}
                variant="ghost"
                className="h-10 px-4 rounded-lg font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseDrawer>
  );
}
