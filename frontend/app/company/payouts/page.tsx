"use client";
import { useState, useEffect } from "react";
import { DollarSign, Download, ArrowUpRight, History, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requestedAt: string;
  processedAt?: string;
  reference?: string;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "text-emerald-500 bg-emerald-500/10",
  paid: "text-emerald-500 bg-emerald-500/10",
  pending: "text-amber-500 bg-amber-500/10",
  processing: "text-blue-500 bg-blue-500/10",
  failed: "text-rose-500 bg-rose-500/10",
};

export default function CompanyPayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallets/my-company');
      const payload = res.data?.data || res.data;
      
      const p = payload.payouts || [];
      setPayouts(p);
      
      setBalance({
        available: parseFloat(payload.balance || 0),
        pending: parseFloat(payload.pendingWithdrawals || 0)
      });
    } catch (err: any) {
      toast.error("Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance.available) {
      toast.error("Invalid payout amount.");
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/wallets/my-company/payout', { amount, methodId: 'bank_transfer' });
      toast.success("Payout request submitted successfully.");
      setIsRequestModalOpen(false);
      setPayoutAmount("");
      fetchWallet();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit payout request.");
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Payout>[] = [
    { key: "requestedAt", header: "Date", sortable: true, render: (p) => <span className="text-muted-foreground text-xs">{new Date(p.requestedAt || (p as any).date || Date.now()).toLocaleDateString()}</span> },
    { key: "id", header: "Transaction ID", render: (p) => <span className="font-mono text-xs text-muted-foreground">{p.id}</span> },
    { key: "method", header: "Method", render: (p) => (
      <div className="flex items-center gap-2 text-xs text-foreground">
        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
        {p.method === 'bank_transfer' ? 'Bank Transfer' : p.method}
      </div>
    )},
    { key: "status", header: "Status", sortable: true, render: (p) => (
      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider", STATUS_COLORS[p.status] || STATUS_COLORS.pending)}>
        {p.status}
      </span>
    )},
    { key: "amount", header: "Amount", sortable: true, render: (p) => <span className="font-bold text-foreground">${parseFloat(p.amount as any).toFixed(2)}</span> }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Payouts & Earnings</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Manage your available balance and track payout history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button 
            onClick={() => { setPayoutAmount(balance.available.toString()); setIsRequestModalOpen(true); }}
            disabled={loading || balance.available <= 0}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Request Payout
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-3 gap-4 p-6 border-b border-border bg-muted/20">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Available for Payout</p>
          </div>
          <p className="text-3xl font-bold text-foreground">${loading ? "..." : balance.available.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">Funds cleared and ready to be transferred.</p>
        </div>
        
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <History className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Pending Clearance</p>
          </div>
          <p className="text-3xl font-bold text-foreground">${loading ? "..." : balance.pending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-2">Funds from recent bookings currently in escrow.</p>
        </div>
        
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm hidden lg:block">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Payout Method</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-base font-bold text-foreground">MY COMPANY LTD</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">ABA Bank - 001 234 567</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Primary</span>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-6 relative">
        <h2 className="text-sm font-semibold text-foreground mb-4">Payout History</h2>
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataGrid 
            columns={columns} 
            data={payouts} 
            emptyMessage="No payout history found. Complete bookings to earn balance." 
          />
        )}
      </div>

      {/* Request Payout Dialog */}
      <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && setIsRequestModalOpen(false)}>
        <DialogContent className="sm:max-w-md p-6 gap-6 bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Request Payout</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Transfer your available balance to your linked bank account.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">Available Balance</p>
              <p className="text-2xl font-bold text-foreground mt-1">${balance.available.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount" className="text-foreground">Transfer Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="amount"
                type="number" 
                value={payoutAmount}
                onChange={(e: any) => setPayoutAmount(e.target.value)}
                className="pl-9 bg-muted/50 border-border text-foreground"
                placeholder="0.00"
                step="0.01"
                min="0"
                max={balance.available}
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map(percent => (
                <button 
                  key={percent}
                  onClick={() => setPayoutAmount((balance.available * (percent / 100)).toFixed(2))}
                  className="flex-1 py-1.5 text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground rounded-md transition-colors"
                >
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transfer to</span>
              <span className="font-medium text-foreground">ABA Bank (ends in 567)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Processing Time</span>
              <span className="font-medium text-foreground">1-2 Business Days</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border/50 pt-2 mt-2">
              <span className="text-foreground font-medium">Total Received</span>
              <span className="font-bold text-emerald-500">
                ${(parseFloat(payoutAmount) || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleRequestPayout}
            disabled={actionLoading || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > balance.available}
            className="w-full flex items-center justify-center h-10 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Transfer'}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

