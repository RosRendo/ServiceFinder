"use client";
import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Wallet, Search, CreditCard, RefreshCw, Banknote, Building, Receipt, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api/client";

type Transaction = { id: string; customer: string; service: string; method: string; status: "paid" | "pending" | "failed" | "refunded" | "completed"; amount: number; date: string; bookingId: string; };

const S: Record<string, { label: string; class: string }> = {
  paid: { label: "Paid", class: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700" },
  pending: { label: "Pending", class: "bg-amber-50 text-amber-700" },
  failed: { label: "Failed", class: "bg-rose-50 text-rose-700" },
  refunded: { label: "Refunded", class: "bg-gray-100 text-gray-600" },
};

import { usePayouts } from "@/lib/hooks/usePayouts";

export default function Payments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transactions" | "payouts">("transactions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { payouts, availableBalance } = usePayouts();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments?limit=100");
      const data = res.data?.data?.payments || res.data?.payments || [];
      setTransactions(data.map((p: any) => ({
        id: p.id, customer: p.user?.fullName || "Guest", service: p.booking?.service?.name || "Service",
        method: p.method === "card" ? "Credit Card" : p.method, status: p.status,
        amount: Number(p.amount) || 0, date: new Date(p.createdAt).toLocaleDateString(), bookingId: p.bookingId,
      })));
    } catch { toast.error("Failed to load payments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const totalRevenue = availableBalance || (transactions.filter((t) => t.status === "paid" || t.status === "completed").reduce((s, t) => s + t.amount, 0) || 0);
  const pendingAmount = transactions.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0) || 0;
  const refundedAmount = transactions.filter((t) => t.status === "refunded").reduce((s, t) => s + t.amount, 0) || 0;

  const filtered = transactions.filter((tx) => {
    const s = `${tx.customer} ${tx.service} ${tx.id}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (statusFilter === "all" || tx.status === statusFilter);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Wallet & Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track revenue, monitor transactions, and manage payouts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPayments} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                <Banknote className="w-4 h-4" /> Request Payout
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <DialogHeader><DialogTitle className="text-base font-semibold text-gray-900">Request Payout</DialogTitle></DialogHeader>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-emerald-50 rounded-md p-4 border border-emerald-100 flex items-center justify-between">
                  <div><div className="text-xs text-emerald-600 font-medium">Available Balance</div><div className="text-2xl font-bold text-emerald-700">${totalRevenue.toFixed(2)}</div></div>
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold text-gray-600">Amount</Label><input type="number" placeholder="Enter amount" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" /></div>
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100 flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div><div className="text-sm font-medium text-gray-900">Chase Business</div><div className="text-xs text-gray-400">****4521</div></div>
                </div>
                <button onClick={() => toast.success("Payout requested!")} className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">Confirm Request</button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available Balance", value: `$${totalRevenue.toFixed(2)}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending", value: `$${pendingAmount.toFixed(2)}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Refunded", value: `$${refundedAmount.toFixed(2)}`, icon: RefreshCw, color: "text-gray-600", bg: "bg-gray-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div><div className="text-xs text-gray-500 font-medium">{s.label}</div><div className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</div></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {(["transactions", "payouts"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${activeTab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {["all", "paid", "pending", "failed", "refunded"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${statusFilter === s ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64"><Receipt className="w-10 h-10 text-gray-200 mb-3" /><p className="text-sm font-medium text-gray-500">No transactions found</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                    <th className="px-5 py-3 text-left">Customer</th>
                    <th className="px-5 py-3 text-left">Service</th>
                    <th className="px-5 py-3 text-left">Method</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{tx.customer}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">{tx.service}</td>
                        <td className="px-5 py-3.5"><span className="flex items-center gap-1 text-xs text-gray-500"><CreditCard className="w-3 h-3 text-gray-400" />{tx.method}</span></td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${S[tx.status]?.class || S.pending.class}`}>{S[tx.status]?.label || tx.status}</span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{tx.date}</td>
                        <td className={`px-5 py-3.5 text-right font-bold ${tx.status === "refunded" ? "text-gray-400 line-through" : tx.status === "failed" ? "text-rose-500" : "text-gray-900"}`}>${tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "payouts" && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64"><Wallet className="w-10 h-10 text-gray-200 mb-3" /><p className="text-sm font-medium text-gray-500">No payouts yet</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payouts.map((payout) => (
                <div key={payout.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${payout.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                      {payout.status === "completed" ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-gray-400">{payout.date} · ****{payout.accountLast4}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${S[payout.status]?.class || S.pending.class}`}>{S[payout.status]?.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
