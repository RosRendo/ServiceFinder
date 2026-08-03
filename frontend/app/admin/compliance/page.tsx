"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, XCircle, Search, Filter, Eye, FileText, Download, Building, FileCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdminCompliance, ComplianceDocument } from "@/lib/hooks/useAdminCompliance";

type DocumentStatus = "pending" | "approved" | "rejected";

const STATUS_BADGE: Record<DocumentStatus, string> = {
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};
const STATUS_LABEL: Record<DocumentStatus, string> = {
  approved: "Approved", pending: "Review Required", rejected: "Rejected",
};

export default function ComplianceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("pending");
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { documents, loading, updateDocumentStatus } = useAdminCompliance();

  const handleAction = async (docId: string, newStatus: "approved" | "rejected", reason?: string) => {
    try {
      await updateDocumentStatus(docId, newStatus, reason);
      toast.success(`Document ${newStatus} successfully.`);
      setIsReviewModalOpen(false);
      setSelectedDoc(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to update document status.");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI counts
  const pending = documents.filter((d) => d.status === "pending").length;
  const approved = documents.filter((d) => d.status === "approved").length;
  const rejected = documents.filter((d) => d.status === "rejected").length;

  return (
    <div className="h-full flex flex-col p-6 font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Compliance & Verification</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Review business licenses, insurance, and background checks.</p>
        </div>
        <Button variant="outline" className="rounded-lg h-10 border-border font-bold gap-2 self-start sm:self-auto">
          <Download className="w-4 h-4" /> Export Report
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4 mb-6 shrink-0">
        {[
          { label: "Pending Review", value: pending, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
          { label: "Approved", value: approved, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Rejected", value: rejected, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/20" },
        ].map((kpi) => (
          <div key={kpi.label} className={`bg-background border rounded-xl p-4 ${kpi.bg}`}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className={`text-3xl font-bold tracking-tight ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar + Table */}
      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center gap-3 shrink-0 bg-muted/20">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by company or type..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-background border-border rounded-lg w-full font-medium" />
          </div>
          <div className="relative w-full sm:w-44">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm font-semibold text-foreground w-full focus:outline-none focus:ring-2 focus:ring-primary appearance-none">
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-7 h-7 animate-spin text-primary opacity-50" />
            </div>
          ) : filteredDocs.length > 0 ? (
            <table className="w-full text-left">
              <thead className="bg-muted/20 border-b border-border sticky top-0 z-10">
                <tr>
                  {["Company", "Document Type", "Uploaded", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <AnimatePresence>
                  {filteredDocs.map((doc, idx) => (
                    <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: idx * 0.03 }} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Building className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-bold text-foreground text-sm">{doc.companyName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50 w-fit">
                          <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground text-sm">{doc.documentType}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-muted-foreground">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${STATUS_BADGE[doc.status]}`}>
                          {STATUS_LABEL[doc.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="sm" className="h-9 px-3 rounded-lg text-primary hover:bg-primary/10 font-bold"
                          onClick={() => { setSelectedDoc(doc); setIsReviewModalOpen(true); }}>
                          <Eye className="h-4 w-4 mr-1.5" /> Review
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] py-16">
              <div className="w-14 h-14 bg-muted/30 rounded-2xl flex items-center justify-center mb-4 border border-border">
                <Shield className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-base font-bold text-foreground">No documents found</h3>
              <p className="text-muted-foreground text-sm font-medium mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={(open) => !open && setIsReviewModalOpen(false)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-xl border-border bg-background shadow-2xl">
          <div className="p-6 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Document Review</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium mt-1">
                Verify compliance documentation for <span className="text-foreground font-bold">{selectedDoc?.companyName}</span>.
              </DialogDescription>
            </DialogHeader>
          </div>

          {selectedDoc && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Document Type", value: selectedDoc.documentType },
                  { label: "Status", value: STATUS_LABEL[selectedDoc.status], badge: STATUS_BADGE[selectedDoc.status] },
                  { label: "Uploaded On", value: new Date(selectedDoc.uploadedAt).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/30 rounded-xl border border-border p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{item.label}</p>
                    {item.badge
                      ? <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${item.badge}`}>{item.value}</span>
                      : <p className="font-bold text-foreground text-sm">{item.value}</p>
                    }
                  </div>
                ))}
              </div>

              <div className="bg-muted/20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-12 h-56">
                <div className="w-14 h-14 bg-background rounded-xl shadow-sm border border-border flex items-center justify-center mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-semibold mb-4">Document Preview Not Available</p>
                <Button variant="outline" size="sm" className="rounded-lg h-9 border-border font-bold">
                  <Download className="w-4 h-4 mr-2" /> Download Original File
                </Button>
              </div>

              {selectedDoc.status === "pending" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <h4 className="font-bold text-foreground">Review Action</h4>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">Ensure the document meets all regulatory and platform requirements before approving.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="flex-1 h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
                      onClick={() => handleAction(selectedDoc.id, "approved")}>
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve Document
                    </Button>
                    <Button variant="outline" className="flex-1 h-11 rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-500/10 font-bold"
                      onClick={() => { const reason = prompt("Enter reason for rejection:"); if (reason) handleAction(selectedDoc.id, "rejected", reason); }}>
                      <XCircle className="w-4 h-4 mr-2" /> Reject Document
                    </Button>
                  </div>
                </div>
              )}

              {selectedDoc.notes && (
                <div className="bg-rose-500/5 text-rose-700 p-4 rounded-xl border border-rose-500/20 text-sm font-medium">
                  <div className="flex items-center gap-2 font-bold mb-1.5 text-rose-600">
                    <XCircle className="w-4 h-4" /> Rejection Reason:
                  </div>
                  <p className="text-foreground/80 leading-relaxed">{selectedDoc.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
