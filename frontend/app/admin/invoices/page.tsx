"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { Search, Download, FileText, Loader2, Link as LinkIcon } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import Link from "next/link";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  issuedAt: string;
  bookingId: string;
  customerName: string;
  companyName: string;
}

export default function AdminInvoicesPage() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/invoices?limit=150');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      
      const formatted = dataList.map((i: any) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        totalAmount: parseFloat(i.totalAmount) || 0,
        issuedAt: new Date(i.issuedAt).toLocaleDateString(),
        bookingId: i.bookingId,
        customerName: i.booking?.customer?.fullName || "Unknown Customer",
        companyName: i.booking?.company?.name || "Unknown Company",
      }));
      setInvoices(formatted);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((i) => {
    const query = search.toLowerCase();
    return !search || 
      i.invoiceNumber.toLowerCase().includes(query) || 
      i.customerName.toLowerCase().includes(query) || 
      i.companyName.toLowerCase().includes(query);
  });

  const columns: Column<InvoiceRow>[] = [
    { key: "invoiceNumber", header: "Invoice #", width: "w-32", render: (r) => (
      <span className="font-mono text-xs text-violet-500 font-semibold">{r.invoiceNumber}</span>
    )},
    { key: "issuedAt", header: "Issued Date", render: (r) => <span className="text-muted-foreground text-xs">{r.issuedAt}</span> },
    { key: "customerName", header: "Customer", sortable: true, render: (r) => (
      <span className="font-medium text-foreground text-sm">{r.customerName}</span>
    )},
    { key: "companyName", header: "Provider Company", sortable: true, render: (r) => (
      <span className="text-muted-foreground text-xs">{r.companyName}</span>
    )},
    { key: "totalAmount", header: "Total Amount", sortable: true, render: (r) => (
      <span className="font-bold text-foreground">
        ${r.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
      </span>
    )},
    { key: "bookingId", header: "Booking Ref", render: (r) => (
      <div className="flex items-center gap-1.5 text-blue-500 hover:text-blue-600 transition-colors cursor-pointer text-xs font-mono group">
        BKG-{r.bookingId}
        <LinkIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )},
    { key: "id", header: "", width: "w-10", render: (r) => (
      <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
        <FileText className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background">
        <div>
          <h1 className="text-lg font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track billing records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..."
              className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" />
          </div>
          <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/50 bg-background transition-colors">
            <Download className="w-4 h-4 opacity-70" /> Export
          </button>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-3 gap-6 px-6 py-4 border-b border-border bg-muted/10">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Billed</span>
          <span className="font-bold text-lg text-foreground">
            ${invoices.reduce((a, i) => a + i.totalAmount, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-violet-500 uppercase tracking-wider font-semibold mb-1">Invoices Generated</span>
          <span className="font-bold text-lg text-violet-500">
            {invoices.length.toLocaleString()}
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
            emptyMessage="No invoices found in the system." 
          />
        )}
      </div>
    </div>
  );
}
