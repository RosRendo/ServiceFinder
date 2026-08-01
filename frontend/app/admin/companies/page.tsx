"use client";

import { useState, useCallback, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { CompanyDrawer, CompanyRow } from "@/components/drawers/CompanyDrawer";
import { AddCompanyModal } from "@/components/admin/AddCompanyModal";
import { Search, Download, Building2, Star, Loader2, Plus } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<CompanyRow | null>(null);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/companies?limit=100');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      setCompanies(dataList);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load companies", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filtered = companies.filter((c) => {
    const matchSearch = !search || [c.name, c.owner?.fullName, c.id].some((v) => v?.toString().toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || c.verificationStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const mappedCompanies: CompanyRow[] = filtered.map(c => ({
    id: c.id.toString(),
    name: c.name || "Unknown Company",
    owner: c.owner?.fullName || "Unknown Owner",
    phone: c.phone || "No phone",
    staffCount: c._count?.staffMembers || 0,
    platformFee: c.platformFeePercent || 15, // default
    rating: 5.0,
    totalRevenue: 0,
    totalBookings: 0,
    status: c.verificationStatus || "pending_verification",
    joinedDate: new Date(c.createdAt).toLocaleDateString(),
    verified: c.verificationStatus === "active" || c.verificationStatus === "verified",
    services: [],
    documents: c.verificationDocumentUrl ? [{ label: "KYC Documents", verified: c.verificationStatus === "active" || c.verificationStatus === "verified" }] : [],
    verificationDocumentUrl: c.verificationDocumentUrl || undefined,
  }));

  const columns: Column<CompanyRow>[] = [
    {
      key: "name", header: "Company", sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium text-foreground">{r.name}</span>
        </div>
      ),
    },
    { key: "owner", header: "Owner", sortable: true, render: (r) => <span className="text-foreground">{r.owner}</span> },
    { key: "staffCount", header: "Staff", sortable: true, render: (r) => <span className="text-muted-foreground">{r.staffCount}</span> },
    { key: "platformFee", header: "Platform Fee", sortable: true, render: (r) => <span className="font-medium text-amber-500">{r.platformFee}%</span> },
    {
      key: "rating", header: "Rating", sortable: true,
      render: (r) => <span className="flex items-center gap-1 text-amber-500 text-sm"><Star className="w-3 h-3 fill-current" />{r.rating}</span>,
    },
    { key: "totalRevenue", header: "Revenue", sortable: true, render: (r) => <span className="text-emerald-500 font-semibold">${r.totalRevenue.toLocaleString()}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "active", "pending_verification", "suspended"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export
        </button>
        <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Company
        </button>
      </div>

      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Companies", value: mappedCompanies.length, color: "text-foreground" },
          { label: "Active", value: mappedCompanies.filter((c) => c.status === "active").length, color: "text-emerald-500" },
          { label: "Pending Verification", value: mappedCompanies.filter((c) => c.status === "pending_verification").length, color: "text-amber-500" },
          { label: "Suspended", value: mappedCompanies.filter((c) => c.status === "suspended").length, color: "text-rose-500" },
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
          <DataGrid columns={columns} data={mappedCompanies} onRowClick={(r) => { setActiveCompany(r); setDrawerOpen(true); }}
            selectedIds={selectedIds} onSelectRow={toggleRow}
            onSelectAll={() => setSelectedIds((prev) => prev.size === mappedCompanies.length ? new Set() : new Set(mappedCompanies.map((c) => c.id)))}
            emptyMessage="No companies found." />
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[{ icon: Download, label: "Export", onClick: () => {} }]} />

      <AddCompanyModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchCompanies} />
      <CompanyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} company={activeCompany} onSuccess={fetchCompanies} />
    </div>
  );
}
