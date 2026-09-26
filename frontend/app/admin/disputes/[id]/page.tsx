"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  User,
  Building,
  Calendar,
  DollarSign,
  MessageCircle,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/admin/StatusPill";
import { toast } from "sonner";
import { useDisputeDetailQuery, useResolveDisputeMutation } from "@/lib/hooks/useDisputes";
import { cn } from "@/lib/utils";

export default function DisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: disputeRaw, isLoading } = useDisputeDetailQuery(id as string, "admin");
  const resolveMutation = useResolveDisputeMutation();
  const dispute = disputeRaw as any;

  const [decisionNotes, setDecisionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [decisionType, setDecisionType] = useState<"accept_claim" | "accept_company" | "mediation" | "">("");

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="h-96 flex items-center justify-center px-4">
        <div className="management-card p-8 flex flex-col items-center gap-4 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-muted-foreground" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Dispute Not Found</h2>
            <p className="text-xs text-muted-foreground mt-1">
              The requested dispute record does not exist or has been archived.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/disputes")}>
            Return to Disputes
          </Button>
        </div>
      </div>
    );
  }

  const handleResolve = async () => {
    if (!decisionType) return toast.error("Please select an adjudication decision");
    if (!decisionNotes.trim()) return toast.error("Please provide resolution notes for the audit trail");
    
    resolveMutation.mutate(
      {
        id: id as string,
        decision: decisionType as "accept_claim" | "accept_company" | "mediation",
        notes: decisionNotes,
        refundAmount: decisionType === "accept_company" ? 0 : parseFloat(refundAmount) || 0
      },
      { 
        onSuccess: () => { 
          toast.success("Dispute successfully adjudicated and closed");
          setDecisionNotes(""); 
          setRefundAmount(""); 
          setDecisionType(""); 
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || "Failed to resolve dispute");
        }
      }
    );
  };

  let parsedPhotos: string[] = [];
  try {
    if (dispute.photos) {
      parsedPhotos = typeof dispute.photos === "string" ? JSON.parse(dispute.photos) : dispute.photos;
    }
  } catch {
    parsedPhotos = [];
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/disputes" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5 mr-0.5" /> Disputes
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-mono">#{String(dispute.id).slice(0, 8)}</span>
      </div>

      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Dispute #{String(dispute.id).slice(0, 8)}
            </h1>
            <StatusPill status={dispute.status} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Filed on {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Arguments & Evidence (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Dispute Context */}
          <div className="management-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Claim Overview
              </h2>
              <span className="text-xs text-muted-foreground font-medium capitalize">
                Category: {dispute.type?.replace(/_/g, " ") || "General"}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Customer Description
                </p>
                <div className="p-3.5 rounded-md border border-border bg-muted/20 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {dispute.description || "No description provided."}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Service Provider Statement
                </p>
                <div className="p-3.5 rounded-md border border-border bg-muted/20 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {dispute.companyResponse || (
                    <span className="text-muted-foreground italic">
                      No response submitted by the service provider.
                    </span>
                  )}
                </div>
              </div>

              {parsedPhotos.length > 0 && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> Customer Photo Evidence ({parsedPhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {parsedPhotos.map((photo: string, index: number) => (
                      <a
                        key={index}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-md overflow-hidden border border-border bg-muted/20 hover:opacity-90 transition-opacity"
                      >
                        <img src={photo} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Adjudication Action Box */}
          {dispute.status !== "resolved" ? (
            <div className="management-card p-6 space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Adjudication Decision
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select a binding resolution for this dispute and record formal justification
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "accept_claim", label: "Rule For Customer", sub: "Issue customer refund" },
                    { id: "accept_company", label: "Rule For Company", sub: "Release funds to provider" },
                    { id: "mediation", label: "Split / Dismiss", sub: "No fault or partial agreement" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDecisionType(item.id as any)}
                      className={cn(
                        "p-3 rounded-md border text-left transition-colors",
                        decisionType === item.id
                          ? "border-foreground bg-muted text-foreground"
                          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <p className="text-xs font-semibold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                    </button>
                  ))}
                </div>

                {decisionType && decisionType !== "accept_company" && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                      Refund Amount ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={Number(dispute.booking?.totalPrice || 0)}
                      placeholder="e.g. 50.00"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="h-9 font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Maximum allowable refund: ${parseFloat(dispute.booking?.totalPrice || 0).toFixed(2)}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    Audit Trail & Adjudication Notes
                  </label>
                  <Textarea
                    placeholder="Document the exact basis for this decision (visible in regulatory audit logs)..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="min-h-[100px] text-xs resize-none"
                  />
                </div>

                <Button
                  onClick={handleResolve}
                  disabled={resolveMutation.isPending || !decisionType || !decisionNotes.trim()}
                  className="w-full h-9 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                >
                  {resolveMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                  Submit Formal Adjudication
                </Button>
              </div>
            </div>
          ) : (
            <div className="management-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Dispute Final Resolution
                </h2>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <p className="text-[11px] text-muted-foreground">Adjudication Notes</p>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed mt-1 p-3 rounded-md bg-muted/20 border border-border">
                    {dispute.adminDecision || "No written notes attached."}
                  </p>
                </div>
                {dispute.refundAmount != null && Number(dispute.refundAmount) > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Authorized Customer Refund</p>
                    <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                      ${parseFloat(dispute.refundAmount).toFixed(2)}
                    </p>
                  </div>
                )}
                {dispute.resolvedAt && (
                  <p className="text-[11px] text-muted-foreground">
                    Resolved at {new Date(dispute.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Entity Cards (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Booking Context */}
          <div className="management-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Booking Context
            </h3>
            {dispute.booking ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono text-foreground">#{dispute.booking.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Scheduled Date</span>
                  <span className="text-foreground">
                    {dispute.booking.bookingDate ? new Date(dispute.booking.bookingDate).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium">Total Value</span>
                  <span className="font-mono font-bold text-foreground">
                    ${parseFloat(dispute.booking.totalPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Booking record unavailable.</p>
            )}
          </div>

          {/* Customer */}
          <div className="management-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> Customer
            </h3>
            {dispute.customer ? (
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">{dispute.customer.fullName || "Guest Customer"}</p>
                <p className="text-muted-foreground">{dispute.customer.email || "No email"}</p>
                {dispute.customer.phone && (
                  <p className="text-muted-foreground font-mono">{dispute.customer.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Customer profile not found.</p>
            )}
          </div>

          {/* Provider */}
          <div className="management-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-muted-foreground" /> Provider
            </h3>
            {dispute.company ? (
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-foreground">{dispute.company.name}</p>
                {dispute.company.id && (
                  <Link
                    href={`/admin/companies/${dispute.company.id}`}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 block pt-1"
                  >
                    View Provider Profile →
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Provider record unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
