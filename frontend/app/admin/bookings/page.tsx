"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { CreateBookingDrawer } from "@/components/drawers/CreateBookingDrawer";
import { Search, Loader2, Calendar, Clock, Download, Plus, SlidersHorizontal, Eye, Edit } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { ErrorState } from "@/components/common/ErrorState";

// ─── Columns ──────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  const exportCSV = () => {
    const rows = filtered.length ? filtered : bookings;
    if (!rows.length) { toast({ title: "No data", description: "No bookings to export.", variant: "destructive" }); return; }
    const header = "ID,Customer,Company,Service,Status,Date,Total";
    const lines = rows.map((b: any) =>
      `${b.id},"${b.customer?.fullName || ''}","${b.company?.name || ''}","${b.service?.name || ''}",${b.status},${b.bookingDate || ''},${b.totalPrice || 0}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `bookings-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data.data || response.data;
      setBookings(payload.bookings || []);
      setFetchError(null);
    } catch {
      setFetchError("Check your connection and try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return b.customer?.fullName?.toLowerCase().includes(query) || 
           b.company?.name?.toLowerCase().includes(query) || 
           b.assignedStaff?.user?.fullName?.toLowerCase().includes(query) || 
           b.service?.name?.toLowerCase().includes(query) || 
           b.id.toLowerCase().includes(query);
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const openDrawer = (id: string) => {
      router.push(`/admin/bookings/${id}`);
  };

  const columns: Column<any>[] = [
    { key: "id", header: "#ID", width: "w-20", sortable: true, render: (r) => <span className="text-violet-400 font-mono text-xs">#{r.id}</span> },
    { key: "customerName", header: "Customer", sortable: true, render: (r) => <span className="font-medium text-sm text-foreground">{r.customer?.fullName || "N/A"}</span> },
    { key: "companyName", header: "Company", sortable: true, render: (r) => <span className="font-medium text-sm text-foreground">{r.company?.name || "N/A"}</span> },
    { key: "staffName", header: "Staff", sortable: true, render: (r) => <span className="text-sm text-muted-foreground">{r.assignedStaff?.user?.fullName || "Unassigned"}</span> },
    { key: "service", header: "Service", sortable: true, render: (r) => <span className="text-sm text-foreground">{r.service?.name}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-medium">${Number(r.totalPrice).toFixed(2)}</span> },
    { key: "date", header: "Date", sortable: true, render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.bookingDate).toLocaleDateString()}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${activeTab === s ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}
            >
              {s === "all" ? "All Bookings" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
          <Calendar className="w-3.5 h-3.5" /> Date Range
        </button>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button 
          onClick={() => setCreateDrawerOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Booking
        </button>
      </div>

      {/* Stats row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-background">
        {[
          { label: "Total", value: bookings.length, color: "text-foreground" },
          { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, color: "text-amber-400" },
          { label: "In Progress", value: bookings.filter((b) => b.status === "in_progress").length, color: "text-violet-400" },
          { label: "Completed", value: bookings.filter((b) => b.status === "completed").length, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-6 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : fetchError && bookings.length === 0 ? (
          <ErrorState title="Couldn't load bookings" message={fetchError} onRetry={fetchBookings} />
        ) : (
          <DataGrid
            columns={columns}
            data={filtered}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(row) => openDrawer(row.id)}
            emptyMessage={search ? "No bookings found matching your search." : "No bookings found in the system."}
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          ...(selectedIds.size === 1 ? [
            { icon: Eye, label: "View Details", onClick: () => router.push(`/admin/bookings/${Array.from(selectedIds)[0]}`) },
            { icon: Edit, label: "Manage", onClick: () => openDrawer(Array.from(selectedIds)[0]) }
          ] : []),
          { icon: Download, label: "Export CSV", onClick: exportCSV },
          { icon: SlidersHorizontal, label: "View All Bookings", onClick: () => router.push("/admin/bookings") },
        ]}
      />

      <CreateBookingDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={fetchBookings}
      />
    </div>
  );
}
