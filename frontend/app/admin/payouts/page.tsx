"use client";
import { useState, useMemo, useEffect } from "react";
import { Wallet, Search, DollarSign, Clock, CheckCircle, XCircle, Eye, CreditCard, Building2, User, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PayoutStatus = "pending" | "approved" | "rejected" | "paid" | "completed";
interface Payout {
  id: string; payoutType: "company" | "staff"; companyName?: string; ownerName?: string; staffName?: string; email?: string;
  amount: number; method: string; status: PayoutStatus; requestedAt: string; processedAt?: string; bankName?: string; accountNumber?: string;
}

const STATUS: Record<string, { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", class: "bg-indigo-50 text-indigo-700" },
  rejected: { label: "Rejected", class: "bg-rose-50 text-rose-700" },
  paid: { label: "Paid", class: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700" },
};

const METHOD: Record<string, string> = {
  bank_transfer: "Bank Transfer", cash: "Cash Pickup", "e-wallet": "E-Wallet",
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"company" | "staff" | "all">("all");
  const [selected, setSelected] = useState<Payout | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payouts`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setPayouts((data.payouts || []).map((p: any) => ({ ...p, companyName: p.company?.name, ownerName: p.company?.owner?.fullName, staffName: p.staff?.user?.fullName, email: p.company?.owner?.email || p.staff?.user?.email || "" })));
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleProcess = async (id: string) => {
    setProcessingId(id);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/payouts/${id}/process`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ transactionId: `TXN-${Math.floor(Math.random() * 1000000)}` }),
    });
    if (res.ok) {
      setPayouts((p) => p.map((x) => x.id === id ? { ...x, status: "completed" as PayoutStatus } : x));
      if (selected?.id === id) setSelected((s) => s ? { ...s, status: "completed" as PayoutStatus } : null);
    }
    setProcessingId(null);
  };

  const stats = useMemo(() => ({
    pending: payouts.filter((p) => p.status === "pending").length,
    pendingAmount: payouts.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    paid: payouts.filter((p) => p.status === "paid" || p.status === "completed").length,
    total: payouts.length,
  }), [payouts]);

  const filtered = useMemo(() => payouts.filter((p) => {
    const s = `${p.companyName || ""} ${p.staffName || ""} ${p.email || ""}`.toLowerCase();
    return (!search || s.includes(search.toLowerCase())) && (statusFilter === "all" || p.status === statusFilter) && (typeFilter === "all" || p.payoutType === typeFilter);
  }), [payouts, search, statusFilter, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and process payout requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", value: stats.pending, sub: `$${stats.pendingAmount.toFixed(2)}`, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
          { label: "Paid This Month", value: stats.paid, sub: null, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
          { label: "Total Requests", value: stats.total, sub: null, color: "text-gray-700", bg: "bg-gray-100", icon: Wallet },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color} mt-0.5`}>{loading ? "—" : s.value}</div>
              {s.sub && <div className="text-xs text-gray-400">{s.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Search payouts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
          <option value="all">All Types</option><option value="company">Company</option><option value="staff">Staff</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
          <option value="all">All Status</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64"><Wallet className="w-10 h-10 text-gray-200 mb-3" /><p className="text-sm font-medium text-gray-500">No payouts found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Recipient</th>
                  <th className="px-5 py-3 text-left">Type</th>
                  <th className="px-5 py-3 text-left">Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Requested</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelected(payout)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${payout.payoutType === "company" ? "bg-indigo-50" : "bg-purple-50"}`}>
                          {payout.payoutType === "company" ? <Building2 className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{payout.payoutType === "company" ? payout.companyName : payout.staffName}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[150px]">{payout.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${payout.payoutType === "company" ? "bg-indigo-50 text-indigo-700" : "bg-purple-50 text-purple-700"}`}>
                        {payout.payoutType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-gray-400" />{METHOD[payout.method] || payout.method}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-900">${payout.amount.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS[payout.status]?.class}`}>{STATUS[payout.status]?.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(payout.requestedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl p-0 overflow-hidden">
          {selected && (
            <>
              <div className="px-6 py-4 border-b border-gray-100">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-gray-900">{selected.payoutType === "company" ? selected.companyName : selected.staffName}</DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">{selected.payoutType} Payout · #{selected.id}</DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">Amount</div>
                    <div className="text-xl font-bold text-gray-900 mt-0.5">${selected.amount.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                    <div className="text-xs text-gray-400">Status</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${STATUS[selected.status]?.class}`}>{STATUS[selected.status]?.label}</span>
                  </div>
                </div>
                {selected.email && <div className="bg-gray-50 rounded-md p-3 border border-gray-100"><div className="text-xs text-gray-400">Contact</div><div className="text-sm font-medium text-gray-900 mt-0.5">{selected.email}</div></div>}
                {selected.method === "bank_transfer" && (
                  <div className="bg-indigo-50 rounded-md p-3 border border-indigo-100">
                    <div className="text-xs font-semibold text-indigo-600 mb-2">Bank Details</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><div className="text-xs text-indigo-400">Bank Name</div><div className="text-sm font-medium text-indigo-900">{selected.bankName || "N/A"}</div></div>
                      <div><div className="text-xs text-indigo-400">Account No.</div><div className="text-sm font-mono font-medium text-indigo-900">{selected.accountNumber || "N/A"}</div></div>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-md p-3 border border-gray-100">
                  <div className="text-xs text-gray-400">Requested</div>
                  <div className="text-sm font-medium text-gray-900 mt-0.5">{new Date(selected.requestedAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Close</button>
                {selected.status === "pending" && (
                  <button onClick={() => handleProcess(selected.id)} disabled={processingId === selected.id} className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
                    {processingId === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Mark Completed
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}