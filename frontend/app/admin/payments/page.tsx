"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  AlertTriangle,
  Receipt,
  Loader2,
  Building2,
  User,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type PaymentStatus = "succeeded" | "refunded" | "partial_refund" | "failed";

interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  date: string;
  customerName: string;
  providerName: string;
  method: string;
}

const statusConfig: Record<PaymentStatus, { label: string; class: string; icon: any }> = {
  succeeded: { label: "Succeeded", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle },
  refunded: { label: "Refunded", class: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
  partial_refund: { label: "Partial Refund", class: "bg-amber-50 text-amber-700 border-amber-200", icon: RefreshCw },
  failed: { label: "Failed", class: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
};

import { RefreshCw } from "lucide-react";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock fetching payments
    setTimeout(() => {
      setPayments([
        {
          id: "PAY-9823-XYZ",
          bookingId: "BKG-5521",
          amount: 250.0,
          currency: "USD",
          status: "succeeded",
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          customerName: "John Doe",
          providerName: "Elite Plumbing Co.",
          method: "Visa •••• 4242",
        },
        {
          id: "PAY-9824-ABC",
          bookingId: "BKG-5522",
          amount: 120.0,
          currency: "USD",
          status: "refunded",
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          customerName: "Sarah Smith",
          providerName: "Quick Fix Electric",
          method: "Mastercard •••• 5555",
        },
        {
          id: "PAY-9825-DEF",
          bookingId: "BKG-5523",
          amount: 45.0,
          currency: "USD",
          status: "failed",
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          customerName: "Mike Johnson",
          providerName: "Sparkle Cleaners",
          method: "Visa •••• 1234",
        },
        {
          id: "PAY-9826-GHI",
          bookingId: "BKG-5524",
          amount: 300.0,
          currency: "USD",
          status: "succeeded",
          date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          customerName: "Emily Davis",
          providerName: "Green Thumb Landscaping",
          method: "Amex •••• 9876",
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");

  const stats = useMemo(() => {
    const succeeded = payments.filter(p => p.status === "succeeded");
    const succeededAmount = succeeded.reduce((sum, p) => sum + p.amount, 0);
    const refunded = payments.filter(p => p.status === "refunded" || p.status === "partial_refund");
    const refundedAmount = refunded.reduce((sum, p) => sum + p.amount, 0);
    const failed = payments.filter(p => p.status === "failed");
    
    return {
      succeeded: succeeded.length,
      succeededAmount,
      refunded: refunded.length,
      refundedAmount,
      failed: failed.length,
      total: payments.length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const searchStr = `${payment.customerName} ${payment.providerName} ${payment.id} ${payment.bookingId}`.toLowerCase();
      const matchesSearch = !searchQuery || searchStr.includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter || (statusFilter === "refunded" && payment.status === "partial_refund");
      
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Payments</h1>
              <p className="text-gray-500 mt-2 text-sm font-medium">Monitor transactions, handle refunds, and track revenue.</p>
            </div>
            <Button variant="outline" className="rounded-2xl h-12 px-6 border-white/60 bg-white/60 backdrop-blur-xl font-bold hover:bg-white shadow-sm gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Successful", value: stats.succeeded, amount: stats.succeededAmount, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Refunded", value: stats.refunded, amount: stats.refundedAmount, icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Failed", value: stats.failed, amount: 0, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50" },
            { label: "Total Transactions", value: stats.total, amount: 0, icon: Receipt, color: "text-indigo-500", bg: "bg-indigo-50" },
          ].map((stat) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-[10px] font-bold text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 mt-2">{loading ? "-" : stat.value}</p>
                {stat.amount > 0 && <p className="text-sm font-bold text-gray-500 mt-1">${stat.amount.toFixed(2)}</p>}
              </div>
              <div className={`p-3.5 rounded-2xl border border-white/60 shadow-sm ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-5 border-b border-white/40 bg-white/40 flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search payments by ID, customer, or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl border-white/60 bg-white/50 text-sm font-medium shadow-sm w-full focus:ring-emerald-500"
              />
            </div>
            
            <div className="flex w-full lg:w-auto gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | "all")}
                className="h-12 px-4 rounded-2xl border border-white/60 bg-white/50 text-sm font-bold text-slate-700 w-full lg:w-48 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="succeeded">Succeeded</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="p-0 bg-white/20">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-white/60 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/60 shadow-sm">
                  <CreditCard className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No payments found</h3>
                <p className="text-gray-500 text-sm mt-2 font-medium">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block lg:hidden divide-y divide-white/40">
                  <AnimatePresence>
                    {filteredPayments.map((payment) => {
                      const status = statusConfig[payment.status];
                      return (
                        <motion.div 
                          key={payment.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-5 space-y-4 hover:bg-white/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{payment.customerName}</p>
                              <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1.5"><ArrowLeft className="w-3 h-3"/> {payment.providerName}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border shadow-sm ${status.class}`}>{status.label}</span>
                          </div>
                          <div className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">Amount</p>
                              <p className="text-base font-black text-gray-900">${payment.amount.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-500 font-medium mb-1">Method</p>
                              <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-slate-400"/> {payment.method}</p>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full rounded-2xl h-11 border-white/60 bg-white/40 hover:bg-white shadow-sm font-bold" asChild>
                            <Link href={`/admin/payments/${payment.id}`}>
                              <Eye className="w-4 h-4 mr-2 text-gray-500"/> View Details
                            </Link>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/40 border-b border-white/60">
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium">Transaction</th>
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium">Parties</th>
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium">Method</th>
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium text-right">Amount</th>
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium">Status</th>
                        <th className="px-6 py-5 text-[11px] font-bold text-gray-500 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      <AnimatePresence>
                        {filteredPayments.map((payment) => {
                          const status = statusConfig[payment.status];
                          return (
                            <motion.tr 
                              key={payment.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-white/50 transition-colors"
                            >
                              <td className="px-6 py-5">
                                <p className="font-mono text-sm font-bold text-gray-900 bg-white/60 inline-flex px-2 py-0.5 rounded-lg border border-gray-200">{payment.id}</p>
                                <p className="text-xs font-medium text-gray-500 mt-2">
                                  {new Date(payment.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                              </td>
                              <td className="px-6 py-5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-sm font-bold text-gray-900">{payment.customerName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-sm font-medium text-slate-600">{payment.providerName}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5 text-sm font-bold text-slate-600">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-slate-400" /> {payment.method}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <span className="font-black text-gray-900 text-base">${payment.amount.toFixed(2)}</span>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-sm ${status.class}`}>
                                  <status.icon className="w-3.5 h-3.5" /> {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <Button variant="outline" size="sm" className="rounded-xl border-white/60 bg-white/40 hover:bg-white shadow-sm font-bold" asChild>
                                  <Link href={`/admin/payments/${payment.id}`}>
                                    <Eye className="w-4 h-4 mr-2 text-gray-500" /> View
                                  </Link>
                                </Button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
