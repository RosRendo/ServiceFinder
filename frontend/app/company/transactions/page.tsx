"use client";
import { useState, useEffect } from "react";
import { Receipt, Download, Loader2, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";
import { useAPI } from "@/lib/hooks/useAPI";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  bookingId?: string;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  credit: "text-emerald-500 bg-emerald-500/10",
  debit: "text-rose-500 bg-rose-500/10",
};

export default function CompanyTransactionsPage() {
  const { data, loading } = useAPI<{ transactions: Transaction[] }>('/api/wallets/my-company');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const exportCSV = () => {
    const rows = [
      ["Date", "Transaction ID", "Description", "Category", "Type", "Amount"],
      ...transactions.map((t) => [
        new Date(t.createdAt).toLocaleDateString(),
        t.id,
        `"${t.description.replace(/"/g, '""')}"`,
        t.category,
        t.type,
        `${t.type === 'credit' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (data?.transactions) {
      setTransactions(data.transactions);
    }
  }, [data]);

  const columns: Column<Transaction>[] = [
    { key: "createdAt", header: "Date", sortable: true, render: (t) => <span className="text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString()}</span> },
    { key: "id", header: "Transaction ID", render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.id}</span> },
    { key: "description", header: "Description", render: (t) => (
      <div>
        <p className="text-sm font-medium text-foreground">{t.description}</p>
        {t.bookingId && <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Booking #{t.bookingId}</p>}
      </div>
    )},
    { key: "category", header: "Category", render: (t) => (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Tag className="w-3.5 h-3.5" />
        <span className="capitalize">{t.category.replace('_', ' ')}</span>
      </div>
    )},
    { key: "type", header: "Type", sortable: true, render: (t) => (
      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit", TYPE_COLORS[t.type] || "text-muted-foreground bg-muted")}>
        {t.type === 'credit' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
        {t.type}
      </span>
    )},
    { key: "amount", header: "Amount", sortable: true, render: (t) => (
      <span className={cn("font-bold text-base", t.type === 'credit' ? "text-emerald-600" : "text-foreground")}>
        {t.type === 'credit' ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
      </span>
    )}
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">A complete ledger of all your earnings, fees, and payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Overview Cards (Optional - can summarize total inflow/outflow) */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border-b border-border bg-muted/20">
         <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wider">Total Inflow (All Time)</p>
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${loading ? "..." : transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-semibold uppercase tracking-wider">Total Outflow (Fees & Payouts)</p>
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${loading ? "..." : transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + Math.abs(t.amount), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Transaction Ledger</h2>
        {loading ? (
          <div className="flex items-center justify-center h-48 border border-border rounded-lg bg-muted/10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground opacity-50" />
          </div>
        ) : (
          <DataGrid 
            columns={columns} 
            data={transactions} 
            onRowClick={(row) => setSelectedTx(row)}
            emptyMessage="No transactions found. Your ledger will populate when you complete bookings." 
          />
        )}
      </div>

      <BaseDrawer
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Details"
        subtitle={selectedTx ? `ID: ${selectedTx.id}` : undefined}
      >
        {selectedTx && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</p>
                <p className={cn("text-2xl font-bold mt-1", selectedTx.type === 'credit' ? "text-emerald-500" : "text-foreground")}>
                  {selectedTx.type === 'credit' ? "+" : "-"}${Math.abs(selectedTx.amount).toFixed(2)}
                </p>
              </div>
              <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1", TYPE_COLORS[selectedTx.type] || "text-muted-foreground bg-muted")}>
                {selectedTx.type === 'credit' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {selectedTx.type}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="font-medium text-foreground">{selectedTx.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Category</span>
                  <span className="font-semibold text-foreground capitalize">{selectedTx.category.replace('_', ' ')}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Date</span>
                  <span className="font-semibold text-foreground">{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {selectedTx.bookingId && (
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Associated Booking</span>
                  <span className="font-mono text-xs font-semibold text-foreground">#{selectedTx.bookingId}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}

