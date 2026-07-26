"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { Search, Download, Receipt, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

interface TransactionRow {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  ownerId: string;
  bookingId?: string;
  date: string;
}

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/transactions?limit=150');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      
      const formatted = dataList.map((t: any) => ({
        id: `TXN-${t.id}`,
        type: t.type,
        category: t.category,
        description: t.description || "N/A",
        amount: parseFloat(t.amount) || 0,
        ownerId: t.ownerId,
        bookingId: t.bookingId ? `BKG-${t.bookingId}` : undefined,
        date: new Date(t.createdAt).toLocaleString(),
      }));
      setTransactions(formatted);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load transactions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || t.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns: Column<TransactionRow>[] = [
    { key: "id", header: "Transaction ID", width: "w-32", render: (r) => <span className="font-mono text-xs text-violet-500 font-semibold">{r.id}</span> },
    { key: "date", header: "Date & Time", render: (r) => <span className="text-muted-foreground text-xs">{r.date}</span> },
    { key: "description", header: "Description", sortable: true, render: (r) => (
      <div>
        <p className="font-medium text-foreground text-sm">{r.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{r.category}</p>
      </div>
    )},
    { key: "type", header: "Type", render: (r) => (
      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider w-fit ${r.type === "credit" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"}`}>
        {r.type === 'credit' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
        {r.type}
      </span>
    )},
    { key: "amount", header: "Amount", sortable: true, render: (r) => (
      <span className={`font-bold ${r.type === "credit" ? "text-emerald-500" : "text-rose-500"}`}>
        {r.type === 'credit' ? '+' : '-'}${r.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
      </span>
    )},
    { key: "ownerId", header: "Owner ID", render: (r) => <span className="text-muted-foreground text-xs font-mono">USER-{r.ownerId}</span> },
    { key: "bookingId", header: "Related Booking", render: (r) => r.bookingId ? <span className="text-blue-500 text-xs font-mono cursor-pointer hover:underline">{r.bookingId}</span> : <span className="text-muted-foreground/50 text-xs">-</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transactions..."
            className="w-full pl-9 pr-3 h-10 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "credit", "debit"].map((s) => (
            <button key={s} onClick={() => setTypeFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${typeFilter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 bg-background transition-colors">
          <Download className="w-4 h-4 opacity-70" /> Export CSV
        </button>
      </div>

      <div className="shrink-0 grid grid-cols-3 gap-6 px-6 py-4 border-b border-border bg-muted/10">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Volume</span>
          <span className="font-bold text-lg text-foreground">
            ${transactions.reduce((a, t) => a + t.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-emerald-500 uppercase tracking-wider font-semibold mb-1">Total Credits</span>
          <span className="font-bold text-lg text-emerald-500">
            +${transactions.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-rose-500 uppercase tracking-wider font-semibold mb-1">Total Debits</span>
          <span className="font-bold text-lg text-rose-500">
            -${transactions.filter(t => t.type === 'debit').reduce((a, t) => a + t.amount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-6 pt-2">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid 
            columns={columns} 
            data={filtered}
            emptyMessage="No financial transactions found." 
          />
        )}
      </div>
    </div>
  );
}
