"use client";

import { useState } from "react";
import { DollarSign, Search, Check, X, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RefundRequest {
  id: string;
  bookingId?: string;
  customerName: string;
  companyName: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Declined";
  createdAt: string;
}

export default function AdminRefundsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RefundRequest[]>([
    { id: "ref-101", bookingId: "bk-8821", customerName: "Vicheka Sok", companyName: "Phnom Penh Cleaners Ltd", amount: 45.00, reason: "AC cleaner did not show up on time", status: "Pending", createdAt: "2026-09-24" },
    { id: "ref-102", bookingId: "bk-8835", customerName: "Dara Khorn", companyName: "Angkor Aircon Repair", amount: 120.00, reason: "Broken repair parts; unit leaking water", status: "Pending", createdAt: "2026-09-23" },
    { id: "ref-103", bookingId: "bk-8790", customerName: "Seyha Men", companyName: "Siem Reap Plumbing Pros", amount: 35.00, reason: "Wrong pipe sizes fitted during service", status: "Approved", createdAt: "2026-09-21" },
  ]);

  const handleAction = (id: string, action: "Approved" | "Declined") => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    toast.success(`Refund claim #${id} marked as ${action.toLowerCase()}.`);
  };

  const filtered = requests.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(search.toLowerCase()) || 
      r.companyName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.bookingId && r.bookingId.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background font-sans text-foreground">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-4 p-6 pb-4 border-b border-border bg-background">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-foreground/90" /> Customer Refund Queue & Reversals
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Audit customer compensation requests, chargeback disputes, and platform reversals.
          </p>
        </div>
      </div>

      {/* Directory Toolbar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search claims, customers, ID..." 
              className="w-full pl-8.5 pr-3 h-8.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-ring font-medium" 
            />
          </div>
          <div className="flex items-center gap-1">
            {["all", "pending", "approved", "declined"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors",
                  statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>Pending Claims: <strong className="text-amber-700 font-bold">{requests.filter(r => r.status === "Pending").length}</strong></span>
          <span>Total Volume: <strong className="text-foreground font-bold">${requests.reduce((s, r) => s + r.amount, 0).toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-background sticky top-0 z-10 border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Claim Reference</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Customer</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Service Merchant</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Requested Refund</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Dispute Reason</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-center">Status</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Adjudicate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr 
                  key={r.id} 
                  onClick={() => setSelectedRefund(r)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <td className="px-4.5 py-3 font-mono font-bold text-foreground">
                    #{r.id}
                    {r.bookingId && (
                      <span className="block text-[10px] text-muted-foreground/70 font-normal">Job: {r.bookingId}</span>
                    )}
                  </td>
                  <td className="px-4.5 py-3 font-bold text-foreground">{r.customerName}</td>
                  <td className="px-4.5 py-3 font-medium text-muted-foreground">{r.companyName}</td>
                  <td className="px-4.5 py-3 text-right font-extrabold text-foreground">${r.amount.toFixed(2)}</td>
                  <td className="px-4.5 py-3 text-muted-foreground max-w-xs truncate">{r.reason}</td>
                  
                  <td className="px-4.5 py-3 text-center">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                      r.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    )}>
                      {r.status}
                    </span>
                  </td>

                  <td className="px-4.5 py-3 text-right">
                    {r.status === 'Pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(r.id, "Approved");
                          }} 
                          className="h-7 px-2.5 text-xs font-semibold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeclineTargetId(r.id);
                          }} 
                          className="h-7 px-2.5 text-xs font-semibold text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Decline
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/70 font-semibold px-2">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Claim Detail Drawer */}
      <BaseDrawer
        open={!!selectedRefund}
        onClose={() => setSelectedRefund(null)}
        title="Refund Claim Review"
        subtitle={selectedRefund ? `Claim Ref: #${selectedRefund.id}` : undefined}
      >
        {selectedRefund && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Claim Amount</p>
                <p className="text-3xl font-bold text-foreground mt-1">${selectedRefund.amount.toFixed(2)}</p>
              </div>
              <span className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                selectedRefund.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                selectedRefund.status === 'Declined' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              )}>
                {selectedRefund.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispute Reason</span>
                <p className="font-medium text-foreground bg-muted/20 p-3 rounded-lg border border-border">{selectedRefund.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Customer</span>
                  <span className="font-semibold text-foreground">{selectedRefund.customerName}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Service Merchant</span>
                  <span className="font-semibold text-foreground">{selectedRefund.companyName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Booking Reference</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{selectedRefund.bookingId || "—"}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Claim Date</span>
                  <span className="font-semibold text-foreground">{selectedRefund.createdAt}</span>
                </div>
              </div>

              {selectedRefund.status === 'Pending' && (
                <div className="pt-4 border-t border-border flex items-center gap-3">
                  <Button
                    onClick={() => {
                      handleAction(selectedRefund.id, "Approved");
                      setSelectedRefund(prev => prev ? { ...prev, status: "Approved" } : null);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve Refund (${selectedRefund.amount.toFixed(2)})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeclineTargetId(selectedRefund.id)}
                    className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
                  >
                    <X className="w-4 h-4 mr-2" /> Decline Claim
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseDrawer>

      {/* Decline Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!declineTargetId}
        onClose={() => setDeclineTargetId(null)}
        title="Decline Refund Claim"
        description="Are you sure you want to decline this refund claim? The customer and merchant will be notified that the claim was rejected."
        actionType="danger"
        confirmLabel="Decline Claim"
        onConfirm={async () => {
          if (declineTargetId) {
            handleAction(declineTargetId, "Declined");
            if (selectedRefund?.id === declineTargetId) {
              setSelectedRefund(prev => prev ? { ...prev, status: "Declined" } : null);
            }
            setDeclineTargetId(null);
          }
        }}
      />

    </div>
  );
}
