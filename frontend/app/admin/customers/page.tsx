"use client";

import { useState, useEffect, useCallback } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { CustomerDrawer, CustomerRow } from "@/components/drawers/CustomerDrawer";
import { Search, Download, Bell, ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<CustomerRow | null>(null);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users?role=customer&limit=100');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || payload.users || []);
      setCustomers(dataList);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    !search || [c.fullName, c.phone, c.id, c.email].some((v) => v?.toString().toLowerCase().includes(search.toLowerCase()))
  );

  const mappedCustomers: CustomerRow[] = filtered.map(c => ({
    id: c.id.toString(),
    name: c.fullName || "Unknown",
    phone: c.phone || "No phone",
    email: c.email || "No email",
    location: "Unknown", // Backend doesn't return default location easily in the root
    ltv: 0, // Mock for now since stats aren't pulled in /users base endpoint
    totalBookings: c._count?.bookingsAsCustomer || 0,
    activeDisputes: 0,
    rating: 5.0,
    lastBooking: "Never",
    joinedDate: new Date(c.createdAt).toLocaleDateString(),
    recentBookings: []
  }));

  const columns: Column<CustomerRow>[] = [
    { key: "id", header: "#ID", width: "w-20", render: (r) => <span className="text-violet-400 font-mono text-xs">#{r.id.slice(0,6)}</span> },
    { key: "name", header: "Name", sortable: true, render: (r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 font-bold text-xs shrink-0 border border-violet-500/20">
          {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <span className="font-medium text-foreground">{r.name}</span>
      </div>
    ) },
    { key: "phone", header: "Phone", render: (r) => <span className="text-muted-foreground">{r.phone}</span> },
    { key: "ltv", header: "LTV", sortable: true, render: (r) => <span className="text-emerald-500 font-semibold">${r.ltv.toLocaleString()}</span> },
    { key: "totalBookings", header: "Bookings", sortable: true, render: (r) => <span className="text-muted-foreground">{r.totalBookings}</span> },
    {
      key: "activeDisputes", header: "Disputes", sortable: true,
      render: (r) => r.activeDisputes > 0
        ? <span className="text-rose-500 font-semibold flex items-center gap-1"><ShieldAlert className="w-3 h-3" />{r.activeDisputes}</span>
        : <span className="text-muted-foreground opacity-50">—</span>,
    },
    { key: "joinedDate", header: "Joined Date", render: (r) => <span className="text-muted-foreground text-xs">{r.joinedDate}</span> },
  ];

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground hover:bg-muted/50">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export
        </button>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-amber-500/20 text-amber-500 text-sm hover:bg-amber-500/10 bg-amber-500/5">
          <ShieldAlert className="w-3.5 h-3.5" /> {mappedCustomers.filter((c) => c.activeDisputes > 0).length} Disputes
        </button>
      </div>
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        <div className="text-xs text-muted-foreground">Total Customers <span className="text-foreground font-bold ml-1">{mappedCustomers.length}</span></div>
        <div className="text-xs text-muted-foreground">Total LTV <span className="text-emerald-500 font-bold ml-1">${mappedCustomers.reduce((a, c) => a + c.ltv, 0).toLocaleString()}</span></div>
        <div className="text-xs text-muted-foreground">Active Disputes <span className="text-rose-500 font-bold ml-1">{mappedCustomers.filter((c) => c.activeDisputes > 0).length}</span></div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid columns={columns} data={mappedCustomers} onRowClick={(r) => { setActiveCustomer(r); setDrawerOpen(true); }}
            selectedIds={selectedIds} onSelectRow={toggleRow} onSelectAll={() => {
              setSelectedIds((prev) => prev.size === mappedCustomers.length ? new Set() : new Set(mappedCustomers.map((c) => c.id)));
            }} emptyMessage="No customers found." />
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[
          { icon: Bell, label: "Send Push Notification", onClick: () => {} },
          { icon: Download, label: "Export CSV", onClick: () => {} },
        ]} />

      <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={activeCustomer} />
    </div>
  );
}
