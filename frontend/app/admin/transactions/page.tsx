"use client";

import { useState, useEffect } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { StatusPill } from "@/components/admin/StatusPill";
import { Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface TransactionRow {
  id: string;
  type: "credit" | "debit" | string;
  category: string;
  description: string;
  amount: number;
  ownerId: string;
  bookingId?: string;
  date: string;
  rawDate: string;
}

const TYPE_FILTERS = [
  { id: "all", label: "All Transactions" },
  { id: "credit", label: "Credits (Inflow)" },
  { id: "debit", label: "Debits (Outflow)" },
];

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/transactions?limit=150");
      const payload = response.data?.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      
      const formatted = dataList.map((t: any) => ({
        id: `TXN-${t.id}`,
        type: t.type || "credit",
        category: t.category || "General",
        description: t.description || "Platform Transaction",
        amount: parseFloat(t.amount) || 0,
        ownerId: t.ownerId ? `USER-${t.ownerId}` : "—",
        bookingId: t.bookingId ? `BKG-${t.bookingId}` : undefined,
        date: new Date(t.createdAt).toLocaleString(),
        rawDate: t.createdAt,
      }));
      setTransactions(formatted);
    } catch {
      toast.error("Failed to load transaction ledger records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const exportCSV = (rows: TransactionRow[]) => {
    if (!rows.length) {
      toast.error("No transactions to export.");
      return;
    }
    const header = "Transaction ID,Date,Type,Category,Description,Amount,Owner,Booking ID";
    const lines = rows.map((t) =>
      `${t.id},"${t.date}",${t.type},"${t.category}","${t.description}",${t.type === "credit" ? "+" : "-"}${t.amount.toFixed(2)},${t.ownerId},${t.bookingId || "—"}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} transactions.`);
  };

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      (t.bookingId && t.bookingId.toLowerCase().includes(search.toLowerCase()));
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns: ColumnDef<TransactionRow>[] = [
    {
      id: "id",
      header: "Reference",
      sortable: true,
      accessorFn: (r) => r.id,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {r.id}
        </span>
      ),
    },
    {
      id: "date",
      header: "Timestamp",
      sortable: true,
      accessorFn: (r) => r.rawDate,
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.date}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description & Category",
      sortable: true,
      accessorFn: (r) => r.description,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">{r.description}</span>
          <span className="text-xs text-muted-foreground">{r.category}</span>
        </div>
      ),
    },
    {
      id: "type",
      header: "Flow",
      sortable: true,
      accessorFn: (r) => r.type,
      cell: (r) => (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground uppercase">
          {r.type === "credit" ? (
            <ArrowDownRight className="w-3.5 h-3.5 text-foreground" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {r.type}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      sortable: true,
      accessorFn: (r) => r.amount,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {r.type === "credit" ? "+" : "-"}${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: "ownerId",
      header: "Account",
      accessorFn: (r) => r.ownerId,
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.ownerId}
        </span>
      ),
    },
    {
      id: "bookingId",
      header: "Related Booking",
      accessorFn: (r) => r.bookingId || "—",
      cell: (r) => (
        r.bookingId ? (
          <span className="font-mono text-xs text-foreground font-medium">
            {r.bookingId}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">—</span>
        )
      ),
    },
  ];

  const totalCredit = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCredit - totalDebit;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Ledger</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete immutable ledger of platform commissions, payment inflows, and provider disbursements
          </p>
        </div>
        <div>
          <Button
            onClick={() => exportCSV(filtered.length ? filtered : transactions)}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Inflow (Credits)
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            +${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Customer payments & commissions</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Outflow (Debits)
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            -${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Provider payouts & refunds</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Net Ledger Delta
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            ${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Retained platform margin</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TYPE_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setTypeFilter(tab.id);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
              typeFilter === tab.id
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DataGrid */}
      <ManagementDataGrid
        data={filtered}
        columns={columns}
        isLoading={loading}
        onRowClick={(row) => setSelectedTx(row)}
        searchPlaceholder="Filter transactions by description, ID, category..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={20}
        totalItems={filtered.length}
        onPageChange={setPage}
        emptyState={{
          title: "No transaction records found",
          description: typeFilter === "all"
            ? "There are currently no recorded transactions on the platform."
            : `No transactions found under filter "${typeFilter}".`,
        }}
      />

      {/* Transaction Inspection Drawer */}
      <BaseDrawer
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Transaction Ledger Record"
        subtitle={selectedTx ? `Ref: ${selectedTx.id}` : undefined}
      >
        {selectedTx && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ledger Amount</p>
                <p className={cn("text-2xl font-bold font-mono mt-1", selectedTx.type === 'credit' ? "text-foreground" : "text-muted-foreground")}>
                  {selectedTx.type === 'credit' ? "+" : "-"}${selectedTx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border border-border bg-background text-foreground">
                {selectedTx.type === 'credit' ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                {selectedTx.type}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</span>
                <p className="font-medium text-foreground text-base">{selectedTx.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Category</span>
                  <span className="font-semibold text-foreground">{selectedTx.category}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Timestamp</span>
                  <span className="font-semibold text-foreground text-xs">{selectedTx.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Account Owner</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{selectedTx.ownerId}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Associated Booking</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{selectedTx.bookingId || "—"}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border bg-muted/5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Ledger Verification</span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This transaction has been cryptographically logged in the platform ledger. Immutable ledger audit records cannot be deleted or modified.
                </p>
              </div>
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
