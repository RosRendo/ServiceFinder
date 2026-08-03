"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, ShieldAlert, User, Building, Calendar, DollarSign,
  MessageCircle, FileText, CheckCircle, AlertTriangle, Clock,
  XCircle, Loader2, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useDisputeDetailQuery, useRespondToDisputeMutation } from "@/lib/hooks/useDisputes";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: AlertTriangle },
  responded: { label: "Responded", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: MessageCircle },
  investigating: { label: "Investigating", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: XCircle },
};

export default function CompanyDisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: disputeRaw, isLoading } = useDisputeDetailQuery(id as string, "company");
  const respondMutation = useRespondToDisputeMutation();
  const dispute = disputeRaw as any;

  const [responseMessage, setResponseMessage] = useState("");

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
    </div>
  );

  if (!dispute) return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="bg-rose-500/10 border border-rose-500/20 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-xl text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <p className="text-rose-500 font-bold text-lg">Dispute not found</p>
        <Button variant="outline" className="rounded-lg" onClick={() => router.push("/company/disputes")}>Back to Disputes</Button>
      </div>
    </div>
  );

  const status = statusConfig[dispute.status] || statusConfig.open;
  const StatusIcon = status.icon;

  const handleRespond = async () => {
    if (!responseMessage.trim()) return toast.error("Please provide a response message");
    respondMutation.mutate(
      { id: id as string, message: responseMessage },
      { onSuccess: () => setResponseMessage("") }
    );
  };

  const parsedPhotos = dispute.photos ? JSON.parse(dispute.photos) : [];

  return (
    <div className="h-full flex flex-col p-6 font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <Button variant="outline" size="icon" onClick={() => router.push("/company/disputes")} className="rounded-lg h-9 w-9 border-border shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Dispute #{dispute.id ? dispute.id.toString().padStart(6, "0") : "----"}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black border ${status.color}`}>
              <StatusIcon className="w-3 h-3" /> {status.label}
            </span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Filed on {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Details & Evidence */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Dispute Details
            </h3>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Type of Dispute</p>
                <p className="font-bold text-foreground text-lg">{dispute.type}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Customer Description</p>
                <p className="text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">{dispute.description}</p>
              </div>
              {dispute.companyResponse && (
                <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20 relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 rounded-r-sm" />
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Your Response
                  </p>
                  <p className="text-foreground/80 font-medium leading-relaxed whitespace-pre-wrap">{dispute.companyResponse}</p>
                </div>
              )}
              {parsedPhotos.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Evidence
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {parsedPhotos.map((photo: string, index: number) => (
                      <div key={index} className="aspect-square rounded-xl overflow-hidden border border-border bg-muted/30 group relative cursor-pointer">
                        <img src={photo} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Response / Resolution */}
          {dispute.status !== "resolved" ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-background border border-primary/20 rounded-xl p-6 shadow-sm"
            >
              <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> Company Response
              </h3>
              {!dispute.companyResponse ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Response (Visible to Admin)</label>
                    <Textarea placeholder="Provide your side of the story or offer a resolution..."
                      value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)}
                      className="min-h-[120px] bg-background border-border rounded-lg resize-none" />
                  </div>
                  <Button onClick={handleRespond} disabled={respondMutation.isPending || !responseMessage.trim()}
                    className="w-full h-11 rounded-lg font-bold">
                    {respondMutation.isPending ? "Submitting..." : "Submit Response"}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="font-bold text-foreground">Response Submitted</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">Waiting for Admin to resolve the dispute.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6"
            >
              <h3 className="text-base font-bold text-emerald-600 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Resolution Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Decision</p>
                  <p className="font-medium text-foreground bg-background border border-emerald-500/20 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{dispute.adminDecision}</p>
                </div>
                {dispute.refundAmount != null && (
                  <div className="flex items-center gap-2 bg-background border border-emerald-500/20 rounded-lg p-3 w-fit">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-foreground">Refunded: ${parseFloat(dispute.refundAmount).toFixed(2)}</span>
                  </div>
                )}
                <p className="text-xs font-semibold text-emerald-600">Resolved on {new Date(dispute.resolvedAt).toLocaleString()}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Entities */}
        <div className="lg:col-span-4 space-y-4">
          {/* Booking Context */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="bg-background border border-border rounded-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Booking Context
            </h3>
            {dispute.booking ? (
              <div className="space-y-2">
                {[
                  { label: "Booking ID", value: `#${dispute.booking.id}` },
                  { label: "Date", value: new Date(dispute.booking.bookingDate).toLocaleDateString() },
                  { label: "Total Value", value: `$${parseFloat(dispute.booking.totalPrice || 0).toFixed(2)}`, highlight: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center bg-muted/30 rounded-lg p-3 border border-border/50">
                    <span className="text-xs font-semibold text-muted-foreground">{row.label}</span>
                    <span className={`font-bold text-sm ${row.highlight ? "text-primary" : "text-foreground"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground italic">Booking data unavailable</p>}
          </motion.div>

          {/* Customer */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="bg-background border border-border rounded-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border pb-3">
              <User className="w-4 h-4 text-blue-500" /> Customer
            </h3>
            {dispute.customer ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  {dispute.customer.avatar
                    ? <img src={dispute.customer.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    : <User className="w-5 h-5 text-blue-500" />}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-foreground text-sm truncate">{dispute.customer.fullName}</p>
                  <p className="text-xs font-medium text-muted-foreground truncate">{dispute.customer.email}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground italic">Customer data unavailable</p>}
          </motion.div>

          {/* Company */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            className="bg-background border border-border rounded-xl p-5 shadow-sm"
          >
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 border-b border-border pb-3">
              <Building className="w-4 h-4 text-emerald-500" /> Service Provider
            </h3>
            {dispute.company ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  {dispute.company.logoUrl
                    ? <img src={dispute.company.logoUrl} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                    : <Building className="w-5 h-5 text-emerald-500" />}
                </div>
                <p className="font-bold text-foreground text-sm truncate">{dispute.company.name}</p>
              </div>
            ) : <p className="text-sm text-muted-foreground italic">Company data unavailable</p>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
