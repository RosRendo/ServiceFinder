"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, CreditCard, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, DollarSign, Receipt, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAPI, useMutation } from "@/lib/hooks/useAPI";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_PAYMENT = {
  id: "PAY-9823-XYZ", bookingId: "BKG-5521", amount: 250.0, currency: "USD",
  status: "succeeded", date: new Date().toISOString(),
  method: { type: "card", brand: "Visa", last4: "4242" },
  customer: { id: "USR-123", name: "John Doe", email: "john@example.com" },
  provider: { id: "COM-456", name: "Elite Plumbing Co." },
  refunds: [],
};

const statusBadge: Record<string, string> = {
  succeeded: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  refunded: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  partial_refund: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const paymentId = params.id as string;

  const { data: paymentData, loading } = useAPI<any>(`/api/admin/payments/${paymentId}`);
  const { mutate } = useMutation();

  const [localPayment, setLocalPayment] = useState(INITIAL_PAYMENT);
  useEffect(() => { if (paymentData) setLocalPayment(paymentData); }, [paymentData]);

  const payment = localPayment;
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalRefunded = payment.refunds.reduce((sum: number, r: any) => sum + r.amount, 0);
  const remainingBalance = payment.amount - totalRefunded;

  const handleProcessRefund = async () => {
    if (!refundReason) return toast.error("Please select a refund reason.");
    if (refundType === "partial" && (!refundAmount || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > payment.amount))
      return toast.error("Please enter a valid partial refund amount.");

    setIsProcessing(true);
    try {
      const refundValue = refundType === "full" ? payment.amount : parseFloat(refundAmount);
      await mutate(`/api/admin/payments/${paymentId}/refund`, { amount: refundValue, reason: refundReason, notes: refundNotes }, "POST");
      setLocalPayment((prev) => ({
        ...prev,
        status: refundType === "full" ? "refunded" : "partial_refund",
        refunds: [...prev.refunds, { id: `RFD-${Math.floor(Math.random() * 10000)}`, amount: refundValue, date: new Date().toISOString(), reason: refundReason, notes: refundNotes } as never],
      }));
      toast.success(`Refund of $${refundValue.toFixed(2)} processed successfully`);
      setRefundAmount(""); setRefundReason(""); setRefundNotes("");
    } catch {
      toast.error("Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-lg h-9 w-9 border-border shrink-0">
            <Link href="/admin/payments"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">Payment Details</h1>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge[payment.status] || "bg-muted text-muted-foreground border-border"}`}>
                {payment.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Transaction:{" "}
              <span className="font-mono bg-muted/50 px-2 py-0.5 rounded border border-border text-xs">{payment.id || paymentId}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-lg h-10 border-border font-bold gap-2">
          <Receipt className="w-4 h-4" /> Receipt
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background border border-border rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" /> Transaction Summary
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Amount", value: `$${payment.amount.toFixed(2)}`, large: true },
                  { label: "Date", value: new Date(payment.date).toLocaleDateString(), sub: new Date(payment.date).toLocaleTimeString() },
                  { label: "Method", value: `${payment.method.brand} •••• ${payment.method.last4}`, icon: CreditCard },
                  { label: "Booking Ref", value: payment.bookingId, link: `/admin/bookings/${payment.bookingId}` },
                ].map((item, i) => (
                  <div key={i} className="bg-muted/30 p-4 rounded-xl border border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{item.label}</p>
                    {item.link
                      ? <Link href={item.link} className="font-mono text-primary hover:text-primary/80 font-bold text-sm">{item.value}</Link>
                      : <p className={`font-bold text-foreground ${item.large ? "text-2xl tracking-tight" : "text-sm"}`}>{item.value}</p>
                    }
                    {item.sub && <p className="text-xs font-medium text-muted-foreground mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>

              <div className="h-px bg-border" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" /> Customer (Payer)
                  </h3>
                  <p className="font-bold text-foreground">{payment.customer.name}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{payment.customer.email}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-2 bg-background inline-flex px-2 py-0.5 rounded border border-border">
                    ID: {payment.customer.id}
                  </p>
                </div>
                <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Service Provider (Payee)
                  </h3>
                  <p className="font-bold text-foreground">{payment.provider.name}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-2 bg-background inline-flex px-2 py-0.5 rounded border border-border">
                    ID: {payment.provider.id}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Refund History */}
          <AnimatePresence>
            {payment.refunds.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                className="bg-background border border-border rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-border">
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-500" /> Refund History
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  {payment.refunds.map((refund: any, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-border rounded-xl bg-muted/20">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-amber-600 text-lg">-${refund.amount.toFixed(2)}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                            {refund.reason.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                          {new Date(refund.date).toLocaleString()} • <span className="font-mono">{refund.id}</span>
                        </p>
                        {refund.notes && <p className="text-sm mt-2 font-medium italic text-muted-foreground bg-background p-3 rounded-lg border border-border">"{refund.notes}"</p>}
                      </div>
                      <span className="mt-3 sm:mt-0 inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Processed
                      </span>
                    </div>
                  ))}
                  <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-muted-foreground">Total Refunded:</span>
                      <span className="font-bold text-amber-600 text-lg">-${totalRefunded.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-muted-foreground">Remaining Balance:</span>
                      <span className="font-bold text-foreground text-xl">${remainingBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Refund Action */}
        <div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-background border border-border rounded-xl shadow-sm overflow-hidden sticky top-6"
          >
            <div className="p-5 border-b border-border bg-muted/20">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Process Refund
              </h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">Issue a refund to the customer's original payment method.</p>
            </div>
            <div className="p-6">
              {remainingBalance <= 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="font-bold text-lg text-emerald-600">Fully Refunded</p>
                  <p className="text-sm font-medium text-muted-foreground max-w-[200px] mx-auto">This transaction has been completely refunded.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Refund Type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["full", "partial"].map((type) => (
                        <Button key={type} type="button" variant={refundType === type ? "default" : "outline"}
                          onClick={() => setRefundType(type as any)}
                          className={`rounded-lg h-10 font-bold capitalize ${refundType !== type ? "border-border text-muted-foreground" : ""}`}
                        >
                          {type === "full" ? "Full Refund" : "Partial"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {refundType === "partial" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (Max: ${remainingBalance.toFixed(2)})</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" min="0.01" max={remainingBalance} placeholder="0.00"
                            className="pl-9 h-11 rounded-lg border-border bg-background font-bold"
                            value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Reason <span className="text-rose-500">*</span></Label>
                    <Select value={refundReason} onValueChange={setRefundReason}>
                      <SelectTrigger className="h-11 rounded-lg border-border bg-background font-semibold">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="dispute_resolution">Dispute Resolution (Admin)</SelectItem>
                        <SelectItem value="cancellation">Booking Cancellation</SelectItem>
                        <SelectItem value="duplicate_charge">Duplicate Charge Error</SelectItem>
                        <SelectItem value="fraudulent">Fraudulent Transaction</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Admin Notes</Label>
                    <Textarea placeholder="Add internal notes about this refund..."
                      className="resize-none rounded-lg border-border bg-background font-medium min-h-[90px] p-3"
                      value={refundNotes} onChange={(e) => setRefundNotes(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            {remainingBalance > 0 && (
              <div className="p-5 border-t border-border bg-muted/20">
                <Button className="w-full h-12 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm"
                  onClick={handleProcessRefund} disabled={isProcessing}>
                  {isProcessing
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    : `Issue ${refundType === "full" ? `Full Refund ($${remainingBalance.toFixed(2)})` : "Partial Refund"}`
                  }
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
