"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Download, Trash2, Calendar, FileText, Clock, MapPin, User, Monitor, ShieldCheck, Activity, Filter } from "lucide-react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import api from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; class: string }> = {
  company_approved: { label: "Company Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  company_rejected: { label: "Company Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  user_created: { label: "User Created", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  user_suspended: { label: "User Suspended", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  user_login: { label: "User Login", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  user_registered: { label: "User Registered", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  UPDATE_SETTINGS: { label: "Settings Updated", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  payout_approved: { label: "Payout Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  payout_rejected: { label: "Payout Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  category_created: { label: "Category Created", class: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  category_updated: { label: "Category Updated", class: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  service_type_created: { label: "Service Type Created", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  service_type_updated: { label: "Service Type Updated", class: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  dispute_resolved: { label: "Dispute Resolved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  settings_changed: { label: "Settings Changed", class: "bg-muted/50 text-muted-foreground border-transparent" },
};

const ROLE: Record<string, string> = {
  admin: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
  system: "bg-muted text-muted-foreground border-border",
  company: "bg-violet-500/10 text-violet-600 border-violet-500/20", 
  company_admin: "bg-violet-500/10 text-violet-600 border-violet-500/20", 
  customer: "bg-muted/50 text-muted-foreground border-transparent",
};

const CATEGORY_TABS = [
  { id: "all", label: "All Events" },
  { id: "auth", label: "Authentication & Logins" },
  { id: "company", label: "Merchant Lifecycle" },
  { id: "settings", label: "System Config" },
  { id: "payout", label: "Payouts & Finance" },
];

interface AuditLog {
  id: string; 
  action: string; 
  actor: string; 
  actorRole: string; 
  target: string;
  targetType: string; 
  description: string; 
  ipAddress: string; 
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLogs, setSelectedLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/audit-logs");
      let rawList: any[] = [];
      if (res.data) {
        if (res.data.data && Array.isArray(res.data.data.data)) {
          rawList = res.data.data.data;
        } else if (Array.isArray(res.data.data)) {
          rawList = res.data.data;
        } else if (Array.isArray(res.data.logs)) {
          rawList = res.data.logs;
        } else if (Array.isArray(res.data)) {
          rawList = res.data;
        }
      }

      const normalized: AuditLog[] = rawList.map((item: any) => {
        const actor = item.actor || item.user?.fullName || item.user?.email || "System";
        const actorRole = item.actorRole || item.user?.role || "system";
        const targetType = item.targetType || item.entityType || "system";
        const target = item.target || (item.entityId ? `${targetType} #${item.entityId}` : targetType);
        const description = item.description || (
          item.action === "user_login" ? `${actor} logged in` :
          item.action === "user_registered" ? `New account registered: ${actor}` :
          item.action === "UPDATE_SETTINGS" ? `Updated system configuration` :
          `${actor} performed ${item.action}`
        );

        return {
          id: String(item.id),
          action: item.action || "unknown",
          actor,
          actorRole,
          target,
          targetType,
          description,
          ipAddress: item.ipAddress || "127.0.0.1",
          createdAt: item.createdAt || new Date().toISOString(),
        };
      });

      setLogs(normalized);
      setFetchError(null);
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      setFetchError("Could not load platform audit logs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const stats = useMemo(() => ({
    total: logs.length,
    today: logs.filter((l) => l.createdAt && l.createdAt.startsWith(today)).length,
    admins: logs.filter((l) => l.actorRole === "admin").length,
  }), [logs, today]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      // Category filter
      if (activeTab === "auth" && !l.action.includes("login") && !l.action.includes("register")) return false;
      if (activeTab === "company" && !l.action.includes("company")) return false;
      if (activeTab === "settings" && !l.action.toLowerCase().includes("setting") && !l.action.includes("category")) return false;
      if (activeTab === "payout" && !l.action.includes("payout")) return false;

      // Text search
      if (!search) return true;
      const s = `${l.actor || ""} ${l.target || ""} ${l.description || ""} ${l.id || ""} ${l.ipAddress || ""}`.toLowerCase();
      return s.includes(search.toLowerCase());
    });
  }, [logs, search, activeTab]);

  const paginatedLogs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleExportCsv = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("No audit logs to export.");
      return;
    }
    const headers = ["ID", "Action", "Actor", "Actor Role", "Target", "Target Type", "Description", "IP Address", "Timestamp"];
    const rows = filtered.map((l) => [
      `"${l.id}"`,
      `"${l.action}"`,
      `"${l.actor}"`,
      `"${l.actorRole}"`,
      `"${l.target}"`,
      `"${l.targetType}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.createdAt}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filtered.length} audit log entries.`);
  }, [filtered]);

  const confirmDeleteLogs = async () => {
    try {
      const ids = selectedLogs.map((l) => l.id);
      await api.delete("/audit-logs", { data: { ids } });
      setLogs((prev) => prev.filter((l) => !ids.includes(l.id)));
      setSelectedLogs([]);
      setDeleteDialogOpen(false);
      toast.success(`${ids.length} audit log(s) permanently removed.`);
    } catch {
      toast.error("Failed to delete audit logs.");
    }
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      id: "action",
      header: "Action",
      isSortable: true,
      cell: ({ row }) => {
        const action = ACTION_LABELS[row.action] || { 
          label: row.action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), 
          class: "bg-muted/50 text-muted-foreground border-transparent" 
        };
        return (
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest", action.class)}>
            {action.label}
          </span>
        );
      },
    },
    {
      id: "actor",
      header: "Actor",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-foreground text-xs">{row.actor}</div>
          <span className={cn("inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest", ROLE[row.actorRole] || "bg-muted/50 text-muted-foreground border-transparent")}>
            {row.actorRole}
          </span>
        </div>
      ),
    },
    {
      id: "target",
      header: "Target",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="font-bold text-foreground text-xs">{row.target}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            {row.targetType?.replace("_", " ")}
          </div>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground line-clamp-1 max-w-[340px]">
          {row.description}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Time & Origin",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-semibold text-foreground">
            {row.createdAt ? `${new Date(row.createdAt).toLocaleDateString()} ${new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "-"}
          </div>
          <code className="text-[10px] font-mono text-muted-foreground">
            {row.ipAddress}
          </code>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Platform Security & Audit Trail"
        description="Comprehensive immutable record of administrative actions, user authentication events, and system changes."
        data={paginatedLogs}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={fetchError}
        onRetry={fetchLogs}
        onRowClick={(row) => setSelectedLog(row)}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by actor, target, IP address, or description..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        secondaryActions={[
          {
            label: `Export CSV (${filtered.length})`,
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: handleExportCsv,
          },
          ...(selectedLogs.length > 0 ? [{
            label: `Delete Selected (${selectedLogs.length})`,
            icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
            onClick: () => setDeleteDialogOpen(true),
          }] : []),
        ]}
        totalCount={filtered.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No audit events found",
          description: search
            ? "No security audit logs match your search criteria."
            : "No events recorded in this category yet.",
        }}
      />

      {/* Audit Log Detail Drawer */}
      <BaseDrawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        subtitle={selectedLog ? `Transaction ID: #${selectedLog.id}` : ""}
      >
        {selectedLog && (
          <div className="space-y-6 p-2 font-sans">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest",
                ACTION_LABELS[selectedLog.action]?.class || "bg-muted/50 text-muted-foreground border-transparent"
              )}>
                {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action.replace(/_/g, " ")}
              </span>
              <span className={cn(
                "inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                ROLE[selectedLog.actorRole] || "bg-muted/50 text-muted-foreground border-transparent"
              )}>
                {selectedLog.actorRole}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-foreground/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Actor</p>
                  <p className="text-sm font-semibold text-foreground">{selectedLog.actor}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-foreground/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Target Resource</p>
                  <p className="text-sm font-semibold text-foreground">{selectedLog.target}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{selectedLog.targetType?.replace("_", " ")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-foreground/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Network IP Address</p>
                  <code className="text-xs font-mono font-medium text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                    {selectedLog.ipAddress}
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-foreground/80" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Recorded Timestamp</p>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString(undefined, { dateStyle: "full", timeStyle: "medium" }) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Narrative Description</p>
              <p className="text-xs text-foreground leading-relaxed">{selectedLog.description}</p>
            </div>
          </div>
        )}
      </BaseDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${selectedLogs.length} Audit Log${selectedLogs.length !== 1 ? "s" : ""}`}
        description="Permanently deleting audit logs is irreversible. These records will be erased from the system and cannot be recovered."
        actionType="danger"
        confirmLabel="Yes, Delete Logs"
        onConfirm={confirmDeleteLogs}
      />
    </div>
  );
}
