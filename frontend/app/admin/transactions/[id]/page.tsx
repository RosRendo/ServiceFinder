"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CreditCard, Clock, CheckCircle2, AlertTriangle,
  RefreshCw, DollarSign, Receipt, Loader2, ArrowUpRight,
  ArrowDownRight, Building2, User, FileText, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/StatusPill";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AdminTransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/admin/transactions/${transactionId}`);
      const payload = res.data?.data || res.data;
      setTransaction(payload);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Transaction record could not be found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Loading Ledger Record...
        </p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="h-full flex items-center justify-center px-4 bg-background">
        <div className="bg-card border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-2xl text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Record Not Found</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {error || "The requested transaction record does not exist or has been archived."}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl h-9 text-xs">
            <Link href="/admin/transactions">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Ledger
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCredit = transaction.type === "credit";
  const amount = Number(transaction.amount || 0);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 font-sans overflow-y-auto custom-scrollbar bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild className="rounded-xl h-9 w-9 border-border shrink-0">
            <Link href="/admin/transactions">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">Ledger Transaction</h1>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                isCredit
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-border"
              )}>
                {isCredit ? <ArrowDownRight className="w-3 h-3 text-emerald-600" /> : <ArrowUpRight className="w-3 h-3" />}
                {transaction.type}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Reference:{" "}
              <span className="font-mono text-foreground font-semibold">
                TX-{transaction.id}
              </span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => window.print()}
          className="rounded-xl h-9 text-xs font-semibold border-border gap-2"
        >
          <Receipt className="w-3.5 h-3.5" /> Print Statement
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transaction Details */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden"
          >
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" /> Financial Summary
              </h2>
              <span className="text-xs font-mono text-muted-foreground">
                Logged: {new Date(transaction.createdAt || Date.now()).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Amount</p>
                  <p className={cn("text-xl font-bold font-mono tracking-tight", isCredit ? "text-emerald-600" : "text-foreground")}>
                    {isCredit ? "+" : "-"}${amount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Flow</p>
                  <p className="text-xs font-mono font-bold uppercase text-foreground">{transaction.type}</p>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Category</p>
                  <p className="text-xs font-bold capitalize text-foreground truncate">{transaction.category || "General"}</p>
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Related Booking</p>
                  {transaction.bookingId ? (
                    <Link
                      href={`/admin/bookings/${transaction.bookingId}`}
                      className="font-mono text-xs font-bold text-primary hover:underline"
                    >
                      #{transaction.bookingId} ↗
                    </Link>
                  ) : (
                    <p className="text-xs font-mono text-muted-foreground">—</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 bg-muted/20 p-4 rounded-xl border border-border/60">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Transaction Memo / Description</p>
                <p className="text-sm font-medium text-foreground">{transaction.description || "Platform ledger entry"}</p>
              </div>

              {/* Related Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Account Owner
                  </h3>
                  <p className="font-semibold text-foreground text-xs">{transaction.owner?.fullName || "System Platform"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{transaction.owner?.email || "internal@servicefinder.com"}</p>
                  <span className="text-[10px] font-mono text-muted-foreground mt-2 bg-background inline-flex px-1.5 py-0.5 rounded border border-border">
                    Owner ID: {transaction.ownerId}
                  </span>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Merchant / Company
                  </h3>
                  <p className="font-semibold text-foreground text-xs">{transaction.booking?.company?.name || "Direct Customer Transaction"}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{transaction.booking?.company?.email || "N/A"}</p>
                  {transaction.booking?.company?.id && (
                    <Link
                      href={`/admin/companies/${transaction.booking.company.id}`}
                      className="text-[10px] font-bold text-primary hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      View Company Profile ↗
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Col: Ledger Audit & Verification */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Immutable Audit Ledger
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This record has been written to the permanent transaction ledger. In compliance with financial reporting guidelines, ledger lines cannot be deleted or edited.
            </p>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ledger Timestamp:</span>
                <span className="font-mono text-foreground font-medium">
                  {new Date(transaction.createdAt || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-emerald-600">Committed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
