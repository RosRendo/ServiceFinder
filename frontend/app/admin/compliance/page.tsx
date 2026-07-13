"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle, XCircle, Search, Filter, Eye, FileText, Download, Building, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAdminCompliance, ComplianceDocument } from "@/lib/hooks/useAdminCompliance";
type DocumentStatus = "pending" | "approved" | "rejected";

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
    } catch (error) {
      toast.error("Failed to update document status.");
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">Approved</span>;
      case "pending":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">Review Required</span>;
      case "rejected":
        return <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">Rejected</span>;
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-6 flex flex-col h-full lg:h-[calc(100vh-2rem)] py-6">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Compliance & Verification
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl">
              Review business licenses, insurance, and background checks to maintain trusted service providers.
            </p>
          </div>
          <div className="relative z-10 flex gap-3 mt-4 lg:mt-0">
            <Button variant="outline" className="gap-2 rounded-2xl h-12 border-white/60 bg-white/60 backdrop-blur-xl font-bold hover:bg-white shadow-sm">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-6 lg:px-8">
          {/* Filter Card */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 sm:p-6 border-b border-white/40 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 shrink-0">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by company or document type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-white/50 border-white/60 rounded-2xl w-full font-medium shadow-sm focus-visible:ring-indigo-500"
                />
              </div>
              
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-12 pl-11 pr-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-bold text-slate-700 w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : filteredDocs.length > 0 ? (
                <div className="overflow-x-auto min-h-full bg-white/20">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document Type</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Uploaded</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      <AnimatePresence>
                        {filteredDocs.map((doc, idx) => (
                          <motion.tr 
                            key={doc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="hover:bg-white/40 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                  <Building className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-gray-900">{doc.companyName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 bg-white/60 inline-flex px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                                <FileCheck className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-slate-700 text-sm">{doc.documentType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-bold text-gray-500 bg-white/60 inline-flex px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(doc.status)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 px-4 rounded-xl hover:bg-white border-transparent hover:border-white/60 font-bold shadow-none hover:shadow-sm transition-all text-indigo-700 hover:text-indigo-800"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setIsReviewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="p-20 text-center flex flex-col items-center justify-center h-full min-h-[400px]"
                >
                  <div className="w-24 h-24 bg-white/80 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white shadow-sm shadow-slate-200/50 rotate-3">
                    <Shield className="w-12 h-12 text-slate-300 -rotate-3" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">No documents found</h3>
                  <p className="text-gray-500 text-lg font-medium mt-2 max-w-md">Try adjusting your filters or search query to find what you're looking for.</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Review Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={(open) => !open && setIsReviewModalOpen(false)}>
          <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-3xl border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl">
            <div className="p-8 border-b border-white/40 bg-white/40">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Document Review</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium mt-2 text-base">
                  Verify compliance documentation for <span className="text-gray-900 font-bold bg-white/60 px-2 py-0.5 rounded-md border border-gray-200">{selectedDoc?.companyName}</span>.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            {selectedDoc && (
              <div className="p-8 space-y-8 bg-white/20">
                <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-2xl border border-white/60 shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-2">Document Type</p>
                    <p className="font-bold text-gray-900 bg-white inline-flex px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-sm">{selectedDoc.documentType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-2 text-center">Status</p>
                    <div className="text-center">{getStatusBadge(selectedDoc.status)}</div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-2">Uploaded On</p>
                    <p className="font-bold text-gray-900 bg-white inline-flex px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-sm">{new Date(selectedDoc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Placeholder for Document Preview */}
                <div className="bg-white/40 rounded-3xl border-2 border-white/60 border-dashed flex items-center justify-center flex-col p-12 h-72 hover:bg-white/60 transition-colors shadow-sm">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-200 flex items-center justify-center mb-6 rotate-3">
                    <FileText className="h-10 w-10 text-slate-400 -rotate-3" />
                  </div>
                  <p className="text-gray-500 font-bold mb-6 text-lg">Document Preview Not Available</p>
                  <Button variant="outline" size="sm" className="bg-white/80 border-white hover:bg-white font-bold rounded-2xl h-12 px-6 shadow-sm">
                    <Download className="w-5 h-5 mr-2" />
                    Download Original File
                  </Button>
                </div>

                {selectedDoc.status === "pending" && (
                  <div className="space-y-5 pt-8 border-t border-white/40">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Review Action</h4>
                      <p className="text-base font-medium text-gray-500 mt-1">
                        Please ensure the document meets all regulatory and platform requirements before approving.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm shadow-emerald-500/20 text-base" 
                        onClick={() => handleAction(selectedDoc.id, "approved")}
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Approve Document
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 h-14 rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold bg-white/60 backdrop-blur-xl shadow-sm text-base"
                        onClick={() => {
                          const reason = prompt("Enter reason for rejection:");
                          if (reason) handleAction(selectedDoc.id, "rejected", reason);
                        }}
                      >
                        <XCircle className="w-5 h-5 mr-2" />
                        Reject Document
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedDoc.notes && (
                  <div className="bg-rose-50/80 text-rose-900 p-6 rounded-2xl border border-rose-200/60 text-sm font-medium shadow-sm shadow-rose-500/5">
                    <div className="flex items-center gap-2 font-bold mb-2 text-rose-700">
                      <XCircle className="w-5 h-5" />
                      Rejection Reason:
                    </div>
                    <p className="bg-white/60 p-3 rounded-xl border border-rose-100/50 leading-relaxed text-rose-800">
                      {selectedDoc.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
