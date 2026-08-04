"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { UserDrawer, UserRow } from "@/components/drawers/UserDrawer";
import { CreateUserDrawer } from "@/components/drawers/CreateUserDrawer";
import { Search, Loader2, Users, Download, Plus, Trash2, Ban, Eye } from "lucide-react";

const ROLE_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Customer", value: "customer" },
  { label: "Company Admin", value: "company_admin" },
  { label: "Staff", value: "staff" },
  { label: "Admin", value: "admin" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeUser, setActiveUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ limit: "200" });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }, credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.data?.users || data.users || [];
        setUsers(list);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || [u.fullName, u.email].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((u) => u.id)));
  }, [filtered]);

  const columns: Column<UserRow>[] = [
    {
      key: "fullName", header: "User", sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-600 font-bold text-xs shrink-0 border border-violet-500/20">
            {u.fullName?.substring(0, 2).toUpperCase() || "U"}
          </div>
          <div>
            <div className="font-bold text-foreground">{u.fullName || "Unnamed User"}</div>
            <div className="text-[10px] font-semibold text-muted-foreground">{u.email}</div>
          </div>
        </div>
      )
    },
    { key: "phone", header: "Phone", render: (u) => <span className="text-muted-foreground font-medium">{u.phone || "—"}</span> },
    {
      key: "role", header: "Role",
      render: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest bg-muted/50 text-muted-foreground">
          {u.role.replace("_", " ")}
        </span>
      )
    },
    {
      key: "status", header: "Status",
      render: (u) => <StatusBadge status={u.status} />
    },
    {
      key: "createdAt", header: "Joined", sortable: true,
      render: (u) => <span className="text-sm font-semibold text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
    }
  ];

  const bulkActions = [
    ...(selectedIds.size === 1 ? [{ label: "View Detail", icon: Eye, onClick: () => router.push(`/admin/users/${Array.from(selectedIds)[0]}`) }] : []),
    { label: "Suspend", icon: Ban, onClick: () => console.log("Suspend", selectedIds) },
    { label: "Delete", icon: Trash2, onClick: () => console.log("Delete", selectedIds), variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search users..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
          />
        </div>
        <div className="flex items-center gap-1">
          {ROLE_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${roleFilter === opt.value ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background transition-colors">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export
        </button>
        <button 
          onClick={() => setCreateDrawerOpen(true)}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New User
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Users", value: filtered.length, color: "text-foreground" },
          { label: "Active", value: filtered.filter((u) => u.status === "active").length, color: "text-emerald-500" },
          { label: "Suspended", value: filtered.filter((u) => u.status === "suspended").length, color: "text-rose-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Full-height DataGrid */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid
            columns={columns}
            data={filtered}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(user) => { setActiveUser(user); setDrawerOpen(true); }}
            emptyIcon={Users}
            emptyMessage="No users found."
          />
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      <UserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={activeUser}
      />

      <CreateUserDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
