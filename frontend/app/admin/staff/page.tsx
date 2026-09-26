"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { Search, Download, Star, Loader2, Eye, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { useSocket } from "@/lib/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-slate-400",
  on_job: "bg-amber-500",
};

const columns: Column<any>[] = [
  {
    key: "name", header: "Technician / Staff Member", sortable: true,
    render: (r) => (
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">
            {r.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${STATUS_DOT[r.workingStatus || r.status || 'offline'] || 'bg-slate-400'}`} />
        </div>
        <div>
          <span className="font-bold text-foreground text-xs block">{r.fullName}</span>
          <span className="text-[10px] text-muted-foreground/70 font-mono">{r.email}</span>
        </div>
      </div>
    ),
  },
  {
    key: "company", header: "Assigned Company",
    render: (r) => {
      const companyName = r.staffMemberships?.[0]?.company?.name;
      return <span className="text-muted-foreground text-xs font-medium">{companyName || "Direct Contractor"}</span>;
    }
  },
  { key: "status", header: "Working Status", render: (r) => <StatusBadge status={r.workingStatus || r.status || 'offline'} /> },
  {
    key: "rating", header: "Customer Rating", sortable: true,
    render: (r) => (
      <span className="flex items-center gap-1 text-foreground font-bold text-xs">
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {r.rating || "5.0"}
      </span>
    ),
  },
  { key: "jobsCompleted", header: "Completed Jobs", sortable: true, render: (r) => <span className="text-foreground/90 font-bold text-xs">{r._count?.bookingsAsCustomer || 0}</span> },
];

export default function StaffPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<any | null>(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const exportCSV = () => {
    const rows = staff.filter((s) => !selectedIds.size || selectedIds.has(s.id));
    if (!rows.length) { 
      toast.error("No staff records available to export."); 
      return; 
    }
    const header = "ID,Name,Email,Status,Company\n";
    const lines = rows.map((s: any) =>
      `"${s.id}","${s.fullName || ''}","${s.email || ''}","${s.status || ''}","${s.staffMemberships?.[0]?.company?.name || ''}"`
    );
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = `staff_registry_${Date.now()}.csv`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} technician records.`);
  };

  const { socket } = useSocket();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users?role=staff&limit=100');
      const payload = response.data.data || response.data;
      setStaff(payload.users || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleStatusChange = (data: { userId: string, status: string, lastSeen: string }) => {
      setStaff(prev => prev.map(s => {
        if (s.id?.toString() === data.userId) {
          return {
            ...s,
            workingStatus: data.status,
            lastSeen: data.lastSeen,
          };
        }
        return s;
      }));
    };

    socket.on('user_status_changed', handleStatusChange);
    return () => {
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [socket]);

  const filtered = staff.filter((s) => {
    const matchSearch = !search || [s.fullName, s.email, s.id].some((v) => v?.toString().toLowerCase().includes(search.toLowerCase()));
    const status = s.workingStatus || s.status || "offline";
    const matchStatus = statusFilter === "all" || status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background font-sans text-foreground">
      {/* Header bar */}
      <div className="shrink-0 p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Field Technicians & Staff Directory</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Vetting verification, skill assignments, and live availability tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={exportCSV}
            className="h-8.5 px-3 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filter & Metric Bar */}
      <div className="shrink-0 px-6 py-3 border-y border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search technician, email, ID..."
              className="w-full pl-8.5 pr-3 h-8.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-ring" 
            />
          </div>
          <div className="flex items-center gap-1">
            {["all", "online", "on_job", "offline"].map((s) => (
              <button 
                key={s} 
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  statusFilter === s ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {s === "all" ? "All" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-4 text-xs">
          {[
            { label: "Total Roster", value: staff.length, color: "text-foreground font-extrabold" },
            { label: "Online Now", value: staff.filter((s) => (s.workingStatus || s.status) === "online").length, color: "text-emerald-700 font-bold" },
            { label: "Dispatched", value: staff.filter((s) => (s.workingStatus || s.status) === "on_job").length, color: "text-amber-700 font-bold" },
            { label: "Offline", value: staff.filter((s) => { const st = s.workingStatus || s.status; return st === "offline" || !st; }).length, color: "text-muted-foreground font-medium" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-muted-foreground/70 text-[11px] font-semibold">{s.label}:</span>
              <span className={s.color}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative p-6">
        <div className="h-full bg-background rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-foreground/90 opacity-60 mb-2" />
              <p className="text-xs font-semibold text-muted-foreground">Loading technician records...</p>
            </div>
          ) : (
            <DataGrid 
              columns={columns} 
              data={filtered} 
              onRowClick={(r) => { setActiveStaff(r); setDrawerOpen(true); }}
              selectedIds={selectedIds} 
              onToggleRow={toggleRow} 
              onToggleAll={toggleAll} 
              emptyMessage="No technicians found matching criteria." 
            />
          )}
        </div>
      </div>

      <BulkActionBar 
        selectedCount={selectedIds.size} 
        onClear={() => setSelectedIds(new Set())}
        actions={[
          ...(selectedIds.size === 1 ? [
            { 
              icon: Eye, 
              label: "View Profile", 
              onClick: () => {
                const id = Array.from(selectedIds)[0];
                router.push(`/admin/users/${id}`);
              }
            },
            { 
              icon: Edit, 
              label: "Configure", 
              onClick: () => {
                const staffMember = staff.find(s => s.id === Array.from(selectedIds)[0]);
                if (staffMember) {
                  setActiveStaff(staffMember);
                  setDrawerOpen(true);
                }
              }
            }
          ] : []),
          { 
            icon: Trash2, 
            label: "Deactivate", 
            onClick: () => {
              if (selectedIds.size === 0) return;
              setDeactivateDialogOpen(true);
            }
          },
          { icon: Download, label: "Export", onClick: exportCSV }
        ]} 
      />

      {activeStaff && (
        <StaffDrawer 
          open={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          staff={{
            id: activeStaff.id,
            name: activeStaff.fullName,
            role: activeStaff.staffMemberships?.[0]?.role || activeStaff.role || "Staff",
            status: activeStaff.workingStatus || activeStaff.status || "offline",
            lastSeen: activeStaff.lastSeen,
            jobsCompleted: activeStaff._count?.bookingsAsCustomer || 0,
            pendingPayout: 0,
            phone: activeStaff.phone || "No phone recorded",
            activeJob: undefined,
            compliance: [],
            schedule: [],
            currentLocation: "Phnom Penh"
          }} 
        />
      )}

      {/* Deactivate Technician Dialog */}
      <ConfirmationDialog
        isOpen={deactivateDialogOpen}
        onClose={() => setDeactivateDialogOpen(false)}
        title={`Deactivate ${selectedIds.size} Technician Account${selectedIds.size !== 1 ? "s" : ""}`}
        description="Are you sure you want to deactivate the selected technician account(s)? They will no longer be eligible for job dispatch or platform access."
        actionType="danger"
        confirmLabel="Deactivate Account(s)"
        onConfirm={async () => {
          let successCount = 0;
          for (const id of Array.from(selectedIds)) {
            try {
              await api.delete(`/admin/users/${id}`);
              successCount++;
            } catch (e) {
              console.error(e);
            }
          }
          if (successCount === 0) {
            toast.error("Failed to deactivate selected accounts.");
            return;
          }
          toast.success(`Successfully updated ${successCount} accounts.`);
          setSelectedIds(new Set());
          fetchStaff();
        }}
      />
    </div>
  );
}
