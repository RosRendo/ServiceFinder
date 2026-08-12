"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { Search, Download, RotateCcw, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

interface PayoutRow {
  id: string;
  recipient: string;
  type: "company" | "staff";
  amount: number;
  method: string;
  status: "paid" | "processing" | "failed";
  scheduledDate: string;
}

export default function PayoutsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const exportCSV = (rows: PayoutRow[]) => {
    if (!rows.length) { toast({ title: "No data", description: "No payouts to export.", variant: "destructive" }); return; }
    const header = "ID,Recipient,Type,Amount,Method,Status,Date";
    const lines = rows.map((p) =>
      `${p.id},"${p.recipient}",${p.type},$${p.amount.toFixed(2)},${p.method},${p.status},${p.scheduledDate}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `payouts-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/payouts?limit=100');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      const formatted = dataList.map((p: any) => {
        let recipient = "Unknown";
        let type: "company" | "staff" = "company";
        if (p.staff) { type = "staff"; recipient = p.staff.user?.fullName || "Staff Worker"; }
        else if (p.company) { type = "company"; recipient = p.company.name || "Company"; }
        let method = "Bank Transfer";
        if (p.company?.paymentMethods?.length) method = p.company.paymentMethods[0].provider || method;
        else if (p.staff?.paymentMethods?.length) method = p.staff.paymentMethods[0].provider || method;
        let status = p.status;
        if (status === 'completed') status = 'paid';
        if (status === 'pending') status = 'processing';
        return {
          id: `PAY-${p.id}`,
          recipient,
          type,
          amount: parseFloat(p.amount) || 0,
          method,
          status: status as "paid" | "processing" | "failed",
          scheduledDate: new Date(p.requestedAt || Date.now()).toLocaleDateString(),
        };
      });
      setPayouts(formatted);
    } catch {
      toast({ title: "Error", description: "Failed to load payouts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const filtered = payouts.filter((p) => {
    const matchSearch = !search || p.recipient.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<PayoutRow>[] = [
    { key: "id", header: "#ID", width: "w-28", render: (r) => <span className="text-violet-500 font-mono text-xs font-semibold">{r.id}</span> },
    { key: "recipient", header: "Recipient", sortable: true, render: (r) => <span className="font-medium text-foreground">{r.recipient}</span> },
    { key: "type", header: "Type", render: (r) => <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.type === "company" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-violet-500/10 text-violet-500 border border-violet-500/20"}`}>{r.type.toUpperCase()}</span> },
    { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-bold text-emerald-500">${r.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span> },
    { key: "method", header: "Method", render: (r) => <span className="text-muted-foreground text-xs">{r.method}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "scheduledDate", header: "Date", render: (r) => <span className="text-muted-foreground text-xs">{r.scheduledDate}</span> },
  ];

  const handleProcessPayouts = async () => {
    // State guard: only process rows that are still pending (shown as "processing")
    const ineligible = Array.from(selectedIds).filter((id) => {
      const row = payouts.find((p) => p.id === id);
      return row && row.status !== "processing";
    });
    if (ineligible.length > 0) {
      toast({ title: "Invalid Selection", description: `${ineligible.length} row(s) are already paid or failed and cannot be re-processed.`, variant: "destructive" });
      return;
    }
    if (!confirm(`Process ${selectedIds.size} pending payout(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          api.post(`/admin/payouts/${id.replace("PAY-", "")}/approve`)
        )
      );
      toast({ title: "Payouts Processed", description: `${selectedIds.size} payout(s) processed successfully.` });
      setSelectedIds(new Set());
      fetchPayouts();
    } catch {
      toast({ title: "Error", description: "Failed to process one or more payouts.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payouts..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "paid", "processing", "failed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/10 bg-rose-500/5">
          <RotateCcw className="w-3.5 h-3.5" /> {payouts.filter((p) => p.status === "failed").length} Failed
        </button>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export
        </button>
      </div>

      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Disbursed", value: `$${payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, color: "text-emerald-500" },
          { label: "Processing", value: `$${payouts.filter((p) => p.status === "processing").reduce((a, p) => a + p.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`, color: "text-amber-500" },
          { label: "Failed", value: String(payouts.filter((p) => p.status === "failed").length), color: "text-rose-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid columns={columns} data={filtered}
            selectedIds={selectedIds}
            onToggleRow={(id) => setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; })}
            onToggleAll={() => setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)))}
            emptyMessage="No payouts found." />
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[
          { icon: RotateCcw, label: "Process Payout", onClick: handleProcessPayouts },
          { icon: Download, label: "Export CSV", onClick: () => {
            const selected = payouts.filter((p) => selectedIds.has(p.id));
            exportCSV(selected.length ? selected : payouts);
          }},
        ]} />
    </div>
  );
}
