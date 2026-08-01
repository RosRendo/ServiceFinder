"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ShieldAlert,
  User,
  Building,
  Calendar,
  DollarSign,
  MessageCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  XCircle,
  MapPin,
  Image as ImageIcon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDisputeDetailQuery, useResolveDisputeMutation, Dispute } from "@/lib/hooks/useDisputes";

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  open: { label: "Open", class: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle },
  responded: { label: "Responded", class: "bg-blue-50 text-blue-700 border-blue-200", icon: MessageCircle },
  investigating: { label: "Investigating", class: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  resolved: { label: "Resolved", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  closed: { label: "Closed", class: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle },
};

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: disputeRaw, isLoading } = useDisputeDetailQuery(id as string, "admin");
  const resolveMutation = useResolveDisputeMutation();

  const dispute = disputeRaw as any; // Need to map to the actual properties from NestJS

  const [decisionNotes, setDecisionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [decisionType, setDecisionType] = useState<"accept_claim" | "accept_company" | "mediation" | "">("");

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
    </div>
  );

  if (!dispute) return (
    <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-rose-200/50 bg-rose-50/50 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-3xl text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-bold text-lg">Dispute not found</p>
            <Button variant="outline" className="border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl px-8 h-11 font-semibold" onClick={() => router.push("/admin/disputes")}>Back to Disputes</Button>
        </div>
    </div>
  );

  const status = statusConfig[dispute.status] || statusConfig.open;
  const StatusIcon = status.icon;

  const handleResolve = async () => {
    if (!decisionType) return toast.error("Please select a decision type");
    if (!decisionNotes.trim()) return toast.error("Please provide resolution notes");

    resolveMutation.mutate(
      {
        id: id as string,
        decision: decisionType as "accept_claim" | "accept_company" | "mediation",
        notes: decisionNotes,
        refundAmount: decisionType === 'accept_company' ? 0 : parseFloat(refundAmount) || 0
      },
      {
        onSuccess: () => {
          setDecisionNotes("");
          setRefundAmount("");
          setDecisionType("");
        }
      }
    );
  };

  const parsedPhotos = dispute.photos ? JSON.parse(dispute.photos) : [];

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/admin/disputes")} className="rounded-xl h-10 w-10 hover:bg-slate-50 shrink-0 border-gray-200">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Dispute #{dispute.id ? dispute.id.toString().padStart(6, '0') : "----"}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black border ${status.class}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-gray-500">Filed on {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "N/A"}</p>
                </div>
            </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column: Details & Evidence */}
            <div className="lg:col-span-8 space-y-6">
                
                {/* Dispute Information */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Dispute Details
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 font-medium mb-1">Type of Dispute</p>
                            <p className="font-bold text-gray-900 text-lg">{dispute.type}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <p className="text-[10px] font-black text-gray-500 font-medium mb-2">Customer Description</p>
                            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
                        </div>

                        {dispute.companyResponse && (
                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 relative overflow-hidden">
                                <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MessageCircle className="w-3.5 h-3.5" /> Company Response
                                </p>
                                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{dispute.companyResponse}</p>
                            </div>
                        )}

                        {parsedPhotos.length > 0 && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 font-medium mb-3 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5" /> Evidence
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {parsedPhotos.map((photo: string, index: number) => (
                                        <div key={index} className="aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group relative cursor-pointer">
                                            <img src={photo} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Resolution Action Area */}
                {dispute.status !== 'resolved' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/60 backdrop-blur-xl border border-rose-200 rounded-3xl p-6 shadow-xl shadow-rose-500/5 relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full" />
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-rose-500" /> Admin Resolution
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex flex-wrap gap-3">
                                {["accept_claim", "mediation", "accept_company"].map((type) => (
                                    <Button
                                        key={type}
                                        variant={decisionType === type ? "default" : "outline"}
                                        onClick={() => setDecisionType(type as any)}
                                        className={`rounded-xl h-11 px-6 font-bold capitalize ${
                                            decisionType === type 
                                            ? "bg-slate-900 text-white shadow-md hover:bg-slate-800" 
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {type.replace("_", " ")}
                                    </Button>
                                ))}
                            </div>

                            {decisionType && decisionType !== "accept_company" && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 font-medium ml-1">Refund Amount ($)</label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 50.00"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="h-12 bg-white border-slate-200 rounded-xl"
                                    />
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 font-medium ml-1">Resolution Decision & Notes (Visible to both parties)</label>
                                <Textarea
                                    placeholder="Explain the final decision..."
                                    value={decisionNotes}
                                    onChange={(e) => setDecisionNotes(e.target.value)}
                                    className="min-h-[120px] bg-white border-slate-200 rounded-xl resize-none"
                                />
                            </div>

                            <Button 
                                onClick={handleResolve} 
                                disabled={resolveMutation.isPending || !decisionType || !decisionNotes.trim()}
                                className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-500/30"
                            >
                                {resolveMutation.isPending ? "Resolving..." : "Submit Final Resolution"}
                            </Button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" /> Resolution Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider mb-1">Decision</p>
                                <p className="font-medium text-emerald-900 bg-white border border-emerald-100 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">{dispute.adminDecision}</p>
                            </div>
                            {dispute.refundAmount != null && (
                                <div className="flex items-center gap-2 bg-white border border-emerald-100 rounded-xl p-3 w-fit">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    <span className="font-bold text-emerald-900">Refunded: ${parseFloat(dispute.refundAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <p className="text-xs font-semibold text-emerald-700">Resolved on {new Date(dispute.resolvedAt).toLocaleString()}</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Right Column: Entities */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Booking Context */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                        <Calendar className="w-4 h-4 text-slate-400" /> Booking Context
                    </h3>
                    {dispute.booking ? (
                        <>
                            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <span className="text-xs font-semibold text-gray-500">Booking ID</span>
                                <span className="font-bold text-gray-900">#{dispute.booking.id}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <span className="text-xs font-semibold text-gray-500">Date</span>
                                <span className="font-bold text-gray-900">{new Date(dispute.booking.bookingDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                                <span className="text-xs font-semibold text-gray-500">Total Value</span>
                                <span className="font-bold text-indigo-600">${parseFloat(dispute.booking.totalPrice || 0).toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Booking data unavailable</p>
                    )}
                </motion.div>

                {/* Customer */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                        <User className="w-4 h-4 text-blue-500" /> Customer
                    </h3>
                    {dispute.customer ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                {dispute.customer.avatar ? (
                                    <img src={dispute.customer.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-blue-500" />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 text-sm truncate">{dispute.customer.fullName}</p>
                                <p className="text-xs font-medium text-gray-500 truncate">{dispute.customer.email}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Customer data unavailable</p>
                    )}
                </motion.div>

                {/* Company */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
                        <Building className="w-4 h-4 text-emerald-500" /> Service Provider
                    </h3>
                    {dispute.company ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                                {dispute.company.logoUrl ? (
                                    <img src={dispute.company.logoUrl} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <Building className="w-5 h-5 text-emerald-500" />
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-gray-900 text-sm truncate">{dispute.company.name}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Company data unavailable</p>
                    )}
                </motion.div>

            </div>
        </div>
      </main>
    </div>
  );
}
