"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { CompanyDrawer, CompanyRow } from "@/components/drawers/CompanyDrawer";
import { AddCompanyModal } from "@/components/admin/AddCompanyModal";
import { EditCompanyModal } from "@/components/admin/EditCompanyModal";
import { Search, Download, Building2, Star, Loader2, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

function CompanyLogo({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [error, setError] = useState(false);
  const initials = name?.[0]?.toUpperCase() || "C";

  if (!src || error) {
    return (
      <div className={cn("bg-violet-600 text-white flex items-center justify-center font-bold text-xs uppercase", className)}>
        {initials}
      </div>
    );
  }

  let imageUrl = src;
  if (src.startsWith("/")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    imageUrl = `${backendUrl}${src}`;
  }

  return (
    <img 
      src={imageUrl} 
      alt={name} 
      className={cn("object-cover", className)} 
      onError={() => setError(true)} 
    />
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<CompanyRow | null>(null);
  const [rawActiveCompany, setRawActiveCompany] = useState<any>(null);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const exportCSV = () => {
    const rows = mappedCompanies.filter((c) => !selectedIds.size || selectedIds.has(c.id));
    if (!rows.length) { toast({ title: "No data", description: "No companies to export.", variant: "destructive" }); return; }
    const header = "ID,Name,Owner,Phone,Staff Count,Platform Fee,Rating,Total Revenue,Total Bookings,Status";
    const lines = rows.map((c) =>
      `${c.id},"${c.name}","${c.owner}","${c.phone}",${c.staffCount},${c.platformFee}%,${c.rating},${c.totalRevenue},${c.totalBookings},${c.status}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `companies-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

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
    const displayStatus = c.subscriptionStatus === "suspended" ? "suspended" : (c.verificationStatus || "pending_verification");
    const matchStatus = statusFilter === "all" || displayStatus === statusFilter;
    
    let matchTime = true;
    if (timeFilter !== "all") {
      const activeTime = new Date(c.owner?.lastLoginAt || c.owner?.lastSeen || c.updatedAt || c.createdAt).getTime();
      const now = Date.now();
      const diffHrs = (now - activeTime) / (1000 * 60 * 60);
      if (timeFilter === "1h") matchTime = diffHrs <= 1;
      if (timeFilter === "1d") matchTime = diffHrs <= 24;
      if (timeFilter === "1m") matchTime = diffHrs <= 24 * 30;
      if (timeFilter === "inactive") matchTime = diffHrs > 24 * 30; // Inactive for > 1 month
    }

    return matchSearch && matchStatus && matchTime;
  });

  const mappedCompanies: CompanyRow[] = filtered.map(c => ({
    id: c.id.toString(),
    name: c.name || "Unknown Company",
    owner: c.owner?.fullName || "Unknown Owner",
    ownerEmail: c.owner?.email || "No email",
    phone: c.phone || "No phone",
    staffCount: c.staffCount || c._count?.staffMembers || 0,
    platformFee: c.platformFeePercent || 15, // default
    rating: c.rating || 5.0,
    totalRevenue: c.totalRevenue || 0,
    totalBookings: c.totalBookings || 0,
    status: c.subscriptionStatus === "suspended" ? "suspended" : (c.verificationStatus || "pending_verification"),
    joinedDate: new Date(c.createdAt).toLocaleDateString(),
    lastActive: c.owner?.lastLoginAt || c.owner?.lastSeen || c.updatedAt || c.createdAt,
    workingStatus: c.owner?.workingStatus || "offline",
    verified: c.verificationStatus === "active" || c.verificationStatus === "verified",
    services: [],
    documents: c.verificationDocumentUrl ? [{ label: "KYC Documents", verified: c.verificationStatus === "active" || c.verificationStatus === "verified" }] : [],
    verificationDocumentUrl: c.verificationDocumentUrl || undefined,
    ownerId: c.ownerId?.toString(),
    logoUrl: c.logoUrl || undefined,
  })).sort((a, b) => {
    const timeA = new Date(a.lastActive || 0).getTime();
    const timeB = new Date(b.lastActive || 0).getTime();
    return timeB - timeA; // Descending (most recently active on top)
  });

  const columns: Column<CompanyRow>[] = [
    {
      key: "name", header: "Company", sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border bg-muted">
            <CompanyLogo src={r.logoUrl} name={r.name} className="w-full h-full" />
          </div>
          <span className="font-medium text-foreground">{r.name}</span>
        </div>
      ),
    },
    { 
      key: "owner", 
      header: "Owner", 
      sortable: true, 
      render: (r) => (
        <div className="flex flex-col">
          <span className="text-foreground">{r.owner}</span>
          <span className="text-xs text-muted-foreground">{r.ownerEmail}</span>
        </div>
      ) 
    },
    { 
      key: "phone", 
      header: "Contact", 
      sortable: true, 
      render: (r) => <span className="text-muted-foreground">{r.phone}</span> 
    },
    { key: "staffCount", header: "Staff", sortable: true, render: (r) => <span className="text-muted-foreground">{r.staffCount}</span> },
    { key: "platformFee", header: "Platform Fee", sortable: true, render: (r) => <span className="font-medium text-amber-500">{r.platformFee}%</span> },
    {
      key: "rating", header: "Rating", sortable: true,
      render: (r) => <span className="flex items-center gap-1 text-amber-500 text-sm"><Star className="w-3 h-3 fill-current" />{r.rating}</span>,
    },
    { key: "totalRevenue", header: "Revenue", sortable: true, render: (r) => <span className="text-emerald-500 font-semibold">${r.totalRevenue.toLocaleString()}</span> },
    { 
      key: "lastActive", 
      header: "Last Active", 
      sortable: true, 
      render: (r) => {
        if (r.workingStatus === "online") {
          return (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500 font-bold">Online</span>
            </div>
          );
        }

        if (!r.lastActive) return <span className="text-muted-foreground text-xs">Unknown</span>;
        const activeDate = new Date(r.lastActive);
        const diffHrs = (Date.now() - activeDate.getTime()) / (1000 * 60 * 60);
        
        let text = "";
        let color = "text-muted-foreground";
        
        if (diffHrs <= 1) { 
          text = "< 1h ago"; 
          color = "text-amber-500 font-medium"; 
        }
        else if (diffHrs <= 24) { 
          text = "Today"; 
          color = "text-muted-foreground"; 
        }
        else if (diffHrs <= 24 * 30) { 
          text = "This Month"; 
          color = "text-muted-foreground/70"; 
        }
        else { 
          text = activeDate.toLocaleDateString(); 
          color = "text-rose-500/70"; 
        }
        
        return <span className={`text-xs ${color}`}>{text}</span>;
      }
    },
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
          <div className="w-px h-6 bg-border mx-2" />
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-8 px-2 bg-muted/30 border border-border rounded-lg text-xs text-foreground outline-none focus:border-violet-500/60"
          >
            <option value="all">Any Time</option>
            <option value="1h">Active &lt; 1h</option>
            <option value="1d">Active Today</option>
            <option value="1m">Active This Month</option>
            <option value="inactive">Inactive &gt; 1m</option>
          </select>
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
            selectedIds={selectedIds} onToggleRow={toggleRow}
            onToggleAll={() => setSelectedIds((prev) => prev.size === mappedCompanies.length ? new Set() : new Set(mappedCompanies.map((c) => c.id)))}
            emptyMessage="No companies found." />
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[
          ...(selectedIds.size === 1 ? [
            { icon: Eye, label: "View Profile", onClick: () => {
                const id = Array.from(selectedIds)[0];
                router.push(`/admin/companies/${id}`);
              }
            },
            { icon: Edit, label: "Edit", onClick: () => {
                const rawCompany = companies.find(c => c.id.toString() === Array.from(selectedIds)[0]);
                if (rawCompany) {
                  setRawActiveCompany(rawCompany);
                  setEditModalOpen(true);
                }
              }
            }
          ] : []),
          { icon: Trash2, label: "Delete", onClick: async () => {
              if (!confirm(`Are you sure you want to delete ${selectedIds.size} companie(s)?`)) return;
              let successCount = 0;
              for (const id of Array.from(selectedIds)) {
                try {
                  await api.delete(`/companies/${id}`);
                  successCount++;
                } catch (e) {
                  console.error(e);
                }
              }
              toast({ title: "Companies Deleted", description: `Successfully deleted ${successCount} companie(s).` });
              setSelectedIds(new Set());
              fetchCompanies();
            }
          },
          { icon: Download, label: "Export CSV", onClick: exportCSV },
        ]} />

      <AddCompanyModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSuccess={fetchCompanies} />
      <CompanyDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} company={activeCompany} onSuccess={fetchCompanies} />
      {rawActiveCompany && (
        <EditCompanyModal open={editModalOpen} onClose={() => setEditModalOpen(false)} company={rawActiveCompany} onSuccess={fetchCompanies} />
      )}
    </div>
  );
}
