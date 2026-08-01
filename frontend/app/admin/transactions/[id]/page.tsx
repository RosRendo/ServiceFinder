"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Receipt,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAPI, useMutation } from "@/lib/hooks/useAPI";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_PAYMENT = {
  id: "PAY-9823-XYZ",
  bookingId: "BKG-5521",
  amount: 250.0,
  currency: "USD",
  status: "succeeded",
  date: new Date().toISOString(),
  method: {
    type: "card",
    brand: "Visa",
    last4: "4242",
  },
  customer: {
    id: "USR-123",
    name: "John Doe",
    email: "john@example.com",
  },
  provider: {
    id: "COM-456",
    name: "Elite Plumbing Co.",
  },
  refunds: [],
};

export default function AdminPaymentDetailPage() {
  const params = useParams();
  const paymentId = params.id as string;

  const { data: paymentData, loading, error, refetch } = useAPI<any>(`/admin/payments/${paymentId}`);
  const { mutate } = useMutation();
  
  const [localPayment, setLocalPayment] = useState(INITIAL_PAYMENT);

  useEffect(() => {
    if (paymentData) {
      setLocalPayment(paymentData);
    }
  }, [paymentData]);

  const payment = localPayment;

  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState<string>("");
  const [refundNotes, setRefundNotes] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessRefund = async () => {
    if (!refundReason) {
      toast.error("Please select a refund reason.");
      return;
    }
    if (
      refundType === "partial" &&
      (!refundAmount ||
        parseFloat(refundAmount) <= 0 ||
        parseFloat(refundAmount) > payment.amount)
    ) {
      toast.error("Please enter a valid partial refund amount.");
      return;
    }

    setIsProcessing(true);

    try {
      const refundValue = refundType === "full" ? payment.amount : parseFloat(refundAmount);
      
      // Real API Call
      await mutate(`/admin/payments/${paymentId}/refund`, {
        amount: refundValue,
        reason: refundReason,
        notes: refundNotes
      }, 'POST');

      setLocalPayment((prev) => ({
        ...prev,
        status: refundType === "full" ? "refunded" : "partial_refund",
        refunds: [
          ...prev.refunds,
          {
            id: `RFD-${Math.floor(Math.random() * 10000)}`,
            amount: refundValue,
            date: new Date().toISOString(),
            reason: refundReason,
            notes: refundNotes,
          } as never,
        ],
      }));

      toast.success(
        `Refund of $${refundValue.toFixed(2)} processed successfully`,
      );

      setRefundAmount("");
      setRefundReason("");
      setRefundNotes("");
    } catch (error) {
      toast.error("Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            Succeeded
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            Refunded
          </span>
        );
      case "partial_refund":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            Partial Refund
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
            Failed
          </span>
        );
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">{status}</span>;
    }
  };

  const totalRefunded = payment.refunds.reduce(
    (sum: number, r: any) => sum + r.amount,
    0,
  );
  const remainingBalance = payment.amount - totalRefunded;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {loading && <div className="absolute top-4 right-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="mb-4 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-white/40 rounded-xl"
              >
                <Link href="/admin/payments">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments
                </Link>
              </Button>
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Payment Details
                </h1>
                {getStatusBadge(payment.status)}
              </div>
              <p className="text-gray-500 mt-2 text-sm font-medium">
                Transaction ID:{" "}
                <span className="font-mono bg-white/60 px-2 py-0.5 rounded-lg border border-gray-200 shadow-sm">{payment.id || paymentId}</span>
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button variant="outline" className="rounded-2xl h-12 px-6 border-white/60 bg-white/60 backdrop-blur-xl font-bold hover:bg-white shadow-sm gap-2">
                <Receipt className="w-4 h-4" /> Receipt
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Transaction Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-white/40 bg-white/40">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-500" />
                  Transaction Summary
                </h2>
              </div>
              <div className="p-6 space-y-8 bg-white/20">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">Amount</p>
                    <p className="text-2xl font-black text-gray-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">Date</p>
                    <p className="font-bold text-gray-900 text-sm">
                      {new Date(payment.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">
                      {new Date(payment.date).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">Method</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="font-bold text-gray-900 text-sm">
                        {payment.method.brand} •••• {payment.method.last4}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/40 p-4 rounded-2xl border border-white/60 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">
                      Booking Ref
                    </p>
                    <Link
                      href={`/admin/bookings/${payment.bookingId}`}
                      className="font-mono text-indigo-600 hover:text-indigo-700 font-bold text-sm bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 block truncate"
                    >
                      {payment.bookingId}
                    </Link>
                  </div>
                </div>

                <div className="h-px bg-white/40 w-full" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/40 p-5 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" /> Customer (Payer)
                    </h3>
                    <div className="space-y-1.5">
                      <p className="font-bold text-gray-900">{payment.customer.name}</p>
                      <p className="text-sm font-medium text-gray-500">
                        {payment.customer.email}
                      </p>
                      <p className="text-xs font-mono font-medium text-slate-400 mt-2 bg-white inline-flex px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">
                        ID: {payment.customer.id}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/40 p-5 rounded-2xl border border-white/60 shadow-sm">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Service Provider (Payee)
                    </h3>
                    <div className="space-y-1.5">
                      <p className="font-bold text-gray-900">{payment.provider.name}</p>
                      <p className="text-xs font-mono font-medium text-slate-400 mt-2 bg-white inline-flex px-2 py-0.5 rounded-md border border-gray-200 shadow-sm">
                        ID: {payment.provider.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Refund History (if any) */}
            <AnimatePresence>
              {payment.refunds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-white/40 bg-white/40">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-500" />
                      Refund History
                    </h2>
                  </div>
                  <div className="p-6 space-y-4 bg-white/20">
                    {payment.refunds.map((refund: any, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-white/60 rounded-2xl bg-white/60 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-black text-amber-600 text-lg">
                              -${refund.amount.toFixed(2)}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {refund.reason.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 mt-2">
                            {new Date(refund.date).toLocaleString()} • Ref: <span className="font-mono">{refund.id}</span>
                          </p>
                          {refund.notes && (
                            <p className="text-sm mt-3 font-medium italic text-slate-600 bg-white/60 p-3 rounded-xl border border-gray-200">
                              "{refund.notes}"
                            </p>
                          )}
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                            Processed
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="bg-white/40 rounded-2xl border border-white/60 p-4 shadow-sm space-y-3 mt-6">
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                          Total Refunded:
                        </span>
                        <span className="font-black text-amber-600 text-lg">
                          -${totalRefunded.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-px bg-white/60 w-full" />
                      <div className="flex justify-between items-center px-2">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                          Remaining Balance:
                        </span>
                        <span className="font-black text-gray-900 text-xl">
                          ${remainingBalance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Refund Action */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden sticky top-6"
            >
              <div className="bg-gray-50 border-b border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Process Refund
                </h2>
                <p className="text-sm font-medium text-gray-500 mt-2">
                  Issue a refund back to the customer's original payment method.
                </p>
              </div>
              <div className="p-6 bg-white/20">
                {remainingBalance <= 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="font-bold text-lg text-emerald-700">Fully Refunded</p>
                    <p className="text-sm font-medium text-gray-500 max-w-[200px] mx-auto">
                      This transaction has been completely refunded. No further action can be taken.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-gray-500 font-medium">Refund Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={refundType === "full" ? "default" : "outline"}
                          onClick={() => setRefundType("full")}
                          className={`rounded-2xl h-12 font-bold shadow-sm ${refundType === "full" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white/60 border-white/60 hover:bg-white text-slate-700"}`}
                        >
                          Full Refund
                        </Button>
                        <Button
                          type="button"
                          variant={refundType === "partial" ? "default" : "outline"}
                          onClick={() => setRefundType("partial")}
                          className={`rounded-2xl h-12 font-bold shadow-sm ${refundType === "partial" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white/60 border-white/60 hover:bg-white text-slate-700"}`}
                        >
                          Partial
                        </Button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {refundType === "partial" && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <Label htmlFor="amount" className="text-xs font-bold text-gray-500 font-medium">
                            Refund Amount (Max: ${remainingBalance.toFixed(2)})
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={remainingBalance}
                              placeholder="0.00"
                              className="pl-10 h-12 rounded-2xl border border-white/60 bg-white/50 text-base font-bold shadow-sm"
                              value={refundAmount}
                              onChange={(e) => setRefundAmount(e.target.value)}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-3">
                      <Label htmlFor="reason" className="text-xs font-bold text-gray-500 font-medium">
                        Reason for Refund <span className="text-rose-500">*</span>
                      </Label>
                      <Select
                        value={refundReason}
                        onValueChange={setRefundReason}
                      >
                        <SelectTrigger id="reason" className="h-12 rounded-2xl border border-white/60 bg-white/50 font-bold shadow-sm text-slate-700 focus:ring-indigo-500">
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-white/60 bg-white/80 backdrop-blur-xl shadow-xl">
                          <SelectItem value="dispute_resolution" className="font-medium rounded-xl focus:bg-indigo-50">
                            Dispute Resolution (Admin)
                          </SelectItem>
                          <SelectItem value="cancellation" className="font-medium rounded-xl focus:bg-indigo-50">
                            Booking Cancellation
                          </SelectItem>
                          <SelectItem value="duplicate_charge" className="font-medium rounded-xl focus:bg-indigo-50">
                            Duplicate Charge Error
                          </SelectItem>
                          <SelectItem value="fraudulent" className="font-medium rounded-xl focus:bg-indigo-50">
                            Fraudulent Transaction
                          </SelectItem>
                          <SelectItem value="other" className="font-medium rounded-xl focus:bg-indigo-50">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="notes" className="text-xs font-bold text-gray-500 font-medium">Admin Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add internal notes about this refund..."
                        className="resize-none rounded-2xl border border-white/60 bg-white/50 font-medium shadow-sm focus:ring-indigo-500 min-h-[100px] p-4"
                        value={refundNotes}
                        onChange={(e) => setRefundNotes(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              {remainingBalance > 0 && (
                <div className="bg-white/40 border-t border-white/40 p-6">
                  <Button
                    className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm shadow-rose-500/20 text-base"
                    onClick={handleProcessRefund}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                        Processing...
                      </>
                    ) : (
                      `Issue ${refundType === "full" ? `Full Refund ($${remainingBalance.toFixed(2)})` : "Partial Refund"}`
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
