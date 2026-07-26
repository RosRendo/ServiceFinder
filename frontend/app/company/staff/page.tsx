"use client";

import { useState, useEffect, useCallback } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { InviteStaffDrawer } from "@/components/drawers/InviteStaffDrawer";
import { Search, Download, UserPlus, Star, Loader2 } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-400",
  offline: "bg-slate-400",
  on_job: "bg-violet-400",
  inactive: "bg-rose-400",
};

export default function CompanyStaffPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<any | null>(null);
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStaff = async () => {
      setLoading(true);
      try {
          const response = await api.get('/companies/my-company/staff');
          const payload = response.data.data || response.data;
          setStaff(Array.isArray(payload) ? payload : (payload.staff || []));
      } catch (err: any) {
          toast({ title: "Error", description: err.message || "Failed to load staff", variant: "destructive" });
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchStaff();
  }, []);

  const filtered = staff.filter((s) => {
    const matchSearch = !search || [s.user?.fullName, s.role, s.id].some((v) => v?.toString().toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || s.user?.status === statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const columns: Column<any>[] = [
    {
      key: "name", header: "Name", sortable: true,
      render: (r) => {
        const name = r.user?.fullName || "Unknown Staff";
        const status = r.user?.status || "offline";
        return (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${STATUS_DOT[status] || 'bg-slate-400'}`} />
            </div>
            <span className="font-medium">{name}</span>
          </div>
        );
      }
    },
    { key: "role", header: "Role", render: (r) => <span className="text-muted-foreground text-xs">{r.role?.replace(/_/g, " ")}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.user?.status || r.status || 'offline'} /> },
    {
      key: "rating", header: "Rating", sortable: true,
      render: (r) => (
        <span className="flex items-center gap-1 text-amber-400 font-medium text-sm">
          <Star className="w-3 h-3 fill-current" /> {r.rating || "5.0"}
        </span>
      ),
    },
    { key: "jobsCompleted", header: "Jobs", sortable: true, render: (r) => <span className="text-muted-foreground">{r._count?.assignedBookings || r.jobsCompleted || 0}</span> },
    { key: "earningsToday", header: "Earned Today", sortable: true, render: (r) => <span className="font-medium">${r.earningsToday || 0}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "online", "on_job", "offline"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
        <button 
          onClick={() => setInviteDrawerOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Invite Staff
        </button>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-background">
        {[
          { label: "Total", value: staff.length, color: "text-foreground" },
          { label: "Online", value: staff.filter((s) => s.user?.status === "online").length, color: "text-emerald-400" },
          { label: "On Job", value: staff.filter((s) => s.user?.status === "on_job").length, color: "text-violet-400" },
          { label: "Offline", value: staff.filter((s) => s.user?.status === "offline" || !s.user?.status).length, color: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
           <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
        ) : (
          <DataGrid columns={columns} data={filtered} onRowClick={(r) => { setActiveStaff(r); setDrawerOpen(true); }}
            selectedIds={selectedIds} onSelectRow={toggleRow} onSelectAll={toggleAll} emptyMessage="No staff found." />
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[{ icon: Download, label: "Export", onClick: () => {} }]} />

      {activeStaff && (
          <StaffDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} staff={{
              id: activeStaff.id,
              name: activeStaff.user?.fullName || "Unknown",
              role: activeStaff.role,
              status: activeStaff.user?.status || activeStaff.status || "offline",
              rating: activeStaff.rating || 5.0,
              jobsCompleted: activeStaff._count?.assignedBookings || activeStaff.jobsCompleted || 0,
              todayJobs: activeStaff.todayJobs || 0,
              earningsToday: activeStaff.earningsToday || 0,
              pendingPayout: activeStaff.walletBalance || 0,
              tips: activeStaff.tips || 0,
              attendance: activeStaff.attendance || 100,
              onTimeRate: activeStaff.onTimeRate || 100,
              phone: activeStaff.user?.phone || activeStaff.phone || "No phone",
              activeJob: undefined,
              compliance: [],
              schedule: [],
              currentLocation: "Unknown"
          }} />
      )}
      
      <InviteStaffDrawer 
        open={inviteDrawerOpen} 
        onClose={() => setInviteDrawerOpen(false)} 
        onSuccess={fetchStaff}
      />
    </div>
  );
}