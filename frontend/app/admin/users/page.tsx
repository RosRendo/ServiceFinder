"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { ConfirmationDialog, ReasonOption } from "@/components/admin/ConfirmationDialog";
import { UserDrawer, UserRow } from "@/components/drawers/UserDrawer";
import { CreateUserDrawer } from "@/components/drawers/CreateUserDrawer";
import { Download, Plus, Ban, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  { label: "All Roles", value: "all" },
  { label: "Customer", value: "customer" },
  { label: "Company Admin", value: "company_admin" },
  { label: "Technician / Staff", value: "staff" },
  { label: "Superadmin", value: "admin" },
];

const SUSPEND_REASONS: ReasonOption[] = [
  { code: "FRAUD_ACTIVITY", label: "Fraudulent Activity or Payment Scam" },
  { code: "POLICY_VIOLATION", label: "Harassment or Terms of Service Violation" },
  { code: "ACCOUNT_TAKEOVER", label: "Compromised Credentials / Security Concern" },
  { code: "SPAM", label: "Spam Inquiries or Fake Bookings" },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<UserRow[]>([]);
  const [activeUser, setActiveUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Moderation Dialog
  const [suspendTarget, setSuspendTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", { params: { limit: 200 } });
      const data = res.data;
      const list = data.data?.users || data.users || [];
      setUsers(list);
    } catch {
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleConfirmSuspend = async (reasonCode?: string, notes?: string) => {
    if (!suspendTarget) return;
    try {
      await api.post(`/admin/users/${suspendTarget.id}/suspend`, {
        reasonCode,
        notes,
      });
      toast.success(`User ${suspendTarget.fullName || suspendTarget.email} suspended.`);
      setSuspendTarget(null);
      fetchUsers();
    } catch {
      toast.error("Failed to suspend user.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success(`User ${deleteTarget.fullName || deleteTarget.email} deleted.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user.");
    }
  };

  const exportCSV = (rows: UserRow[]) => {
    if (!rows.length) {
      toast.error("No users to export.");
      return;
    }
    const header = "User ID,Full Name,Email,Phone,Role,Status,Joined";
    const lines = rows.map((u) =>
      `${u.id},"${u.fullName || ""}","${u.email || ""}","${u.phone || ""}",${u.role},${u.status},${u.createdAt ? new Date(u.createdAt).toISOString() : ""}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} users.`);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      [u.fullName, u.email, u.phone].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns: ColumnDef<UserRow>[] = [
    {
      id: "fullName",
      header: "User & Contact",
      sortable: true,
      accessorFn: (u) => u.fullName || u.email,
      cell: (u) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{u.fullName || "Unnamed User"}</span>
          <span className="text-xs text-muted-foreground">{u.email}</span>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      accessorFn: (u) => u.phone || "—",
      cell: (u) => (
        <span className="font-mono text-xs text-muted-foreground">
          {u.phone || "—"}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      accessorFn: (u) => u.role,
      cell: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded border border-border text-[10px] font-mono uppercase tracking-wider bg-muted/40 text-muted-foreground">
          {u.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      id: "status",
      header: "Account Status",
      sortable: true,
      accessorFn: (u) => u.status,
      cell: (u) => (
        <StatusPill status={u.status} />
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      sortable: true,
      accessorFn: (u) => u.createdAt,
      cell: (u) => (
        <span className="font-mono text-xs text-muted-foreground">
          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (u) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              setActiveUser(u);
              setDrawerOpen(true);
            }}
          >
            Review
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => setSuspendTarget(u)}
          >
            Suspend
          </Button>
        </div>
      ),
    },
  ];

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global directory of customers, technicians, company administrators, and superadmins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => exportCSV(filtered.length ? filtered : users)}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Export CSV
          </Button>
          <Button
            onClick={() => setCreateDrawerOpen(true)}
            size="sm"
            className="h-8 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New User
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Accounts
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {loading ? "—" : totalCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Registered platform identities</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Accounts
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {activeCount}
          </p>
          <p className="text-[11px] text-muted-foreground">In good standing with valid credentials</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Suspended
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {suspendedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Access frozen by administrative review</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {ROLE_OPTIONS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setRoleFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
              roleFilter === tab.value
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
        searchPlaceholder="Filter users by name, email, or phone..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={20}
        totalItems={filtered.length}
        onPageChange={setPage}
        selectable={true}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onRowClick={(u) => {
          setActiveUser(u);
          setDrawerOpen(true);
        }}
        emptyState={{
          title: "No users found",
          description: roleFilter === "all"
            ? "No users registered in the system."
            : `No users found matching role filter "${roleFilter}".`,
        }}
      />

      {/* Slideover User Drawer */}
      <UserDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={activeUser}
      />

      {/* Slideover Create User Drawer */}
      <CreateUserDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* Moderation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleConfirmSuspend}
        title="Suspend Platform User"
        description={`Are you sure you want to suspend "${suspendTarget?.fullName || suspendTarget?.email}"? This will immediately revoke their session tokens and prevent any booking or administrative operations.`}
        confirmLabel="Confirm Suspension"
        requireReason={true}
        reasonOptions={SUSPEND_REASONS}
        actionType="danger"
      />
    </div>
  );
}
