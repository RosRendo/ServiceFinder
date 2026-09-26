"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, Download, Trash2, Calendar, FileText, X, Clock, MapPin, User, Monitor } from "lucide-react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { ErrorState } from "@/components/common/ErrorState";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import api from "@/lib/api/client";
import { toast } from "sonner";

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
  system: "bg-foreground text-background border-border",
  company: "bg-violet-500/10 text-violet-600 border-violet-500/20", 
  company_admin: "bg-violet-500/10 text-violet-600 border-violet-500/20", 
  customer: "bg-muted/50 text-muted-foreground border-transparent",
};

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
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
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
        setFetchError("Could not load audit logs.");
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const stats = useMemo(() => ({
    total: logs.length,
    today: logs.filter((l) => l.createdAt && l.createdAt.startsWith(today)).length,
    admins: logs.filter((l) => l.actorRole === "admin").length,
  }), [logs, today]);

  const filtered = useMemo(() => logs.filter((l) => {
    const s = `${l.actor || ""} ${l.target || ""} ${l.description || ""} ${l.id || ""}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (actionFilter === "all" || l.action === actionFilter);
  }), [logs, search, actionFilter]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((l) => l.id)));
  }, [filtered]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  const columns: Column<AuditLog>[] = [
    {
      key: "action", header: "Action", sortable: true,
      render: (log) => {
        const action = ACTION_LABELS[log.action] || { 
          label: log.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), 
          class: "bg-muted/50 text-muted-foreground border-transparent" 
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${action.class}`}>
            {action.label}
          </span>
        );
      }
    },
    {
      key: "actor", header: "Actor", sortable: true,
      render: (log) => (
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-foreground text-sm">{log.actor}</div>
          <span className={`inline-flex px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${ROLE[log.actorRole] || "bg-muted/50 text-muted-foreground border-transparent"}`}>
            {log.actorRole}
          </span>
        </div>
      )
    },
    {
      key: "target", header: "Target", sortable: true,
      render: (log) => (
        <div className="flex flex-col">
          <div className="font-bold text-foreground text-sm">{log.target}</div>
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{log.targetType?.replace("_", " ")}</div>
        </div>
      )
    },
    {
      key: "description", header: "Description",
      render: (log) => <span className="text-xs font-medium text-foreground">{log.description}</span>
    },
    {
      key: "createdAt", header: "Time & Origin", sortable: true,
      render: (log) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-sm font-semibold text-foreground">{log.createdAt ? `${new Date(log.createdAt).toLocaleDateString()} ${new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "-"}</div>
          <code className="text-[10px] font-medium font-mono text-muted-foreground mt-0.5">{log.ipAddress}</code>
        </div>
      )
    }
  ];

  const handleDeleteLogs = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteLogs = async () => {
    try {
      await api.delete("/audit-logs", { data: { ids: Array.from(selectedIds) } });
      setLogs((prev) => prev.filter((l) => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} log(s) deleted.`);
    } catch {
      toast.error("Failed to delete audit logs.");
    }
  };

  const bulkActions = [
    { label: "Delete Logs", icon: Trash2, onClick: handleDeleteLogs, variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search logs..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
          />
        </div>
        
        <select 
          value={actionFilter} 
          onChange={(e) => setActionFilter(e.target.value)} 
          className="h-9 px-3 text-xs font-medium text-foreground bg-background rounded-lg border border-border outline-none focus:border-violet-500/60 cursor-pointer"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>)}
        </select>
        
        <div className="flex-1" />
        
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background transition-colors">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export CSV
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Events", value: stats.total, color: "text-foreground" },
          { label: "Today", value: stats.today, color: "text-emerald-500" },
          { label: "Admin Actions", value: stats.admins, color: "text-violet-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Full-height DataGrid */}
      <div className="flex-1 overflow-hidden relative">
        {fetchError && logs.length === 0 && !loading ? (
          <div className="p-6">
            <ErrorState title="Couldn't load audit logs" message={fetchError} onRetry={() => window.location.reload()} />
          </div>
        ) : (
          <DataGrid
            columns={columns}
            data={filtered}
            loading={loading}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(row) => setSelectedLog(row)}
            emptyIcon={FileText}
            emptyMessage="No audit logs found matching your criteria."
          />
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      {/* Audit Log Detail Drawer */}
      <BaseDrawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Detail"
        subtitle={selectedLog ? `Event #${selectedLog.id}` : ""}
      >
        {selectedLog && (
          <div className="space-y-5 p-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${
                ACTION_LABELS[selectedLog.action]?.class || "bg-muted/50 text-muted-foreground border-transparent"
              }`}>
                {ACTION_LABELS[selectedLog.action]?.label || selectedLog.action.replace(/_/g, " ")}
              </span>
              <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${
                ROLE[selectedLog.actorRole] || "bg-muted/50 text-muted-foreground border-transparent"
              }`}>{selectedLog.actorRole}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Actor</p>
                    <p className="text-sm font-semibold text-foreground">{selectedLog.actor}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Monitor className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Target</p>
                    <p className="text-sm font-semibold text-foreground">{selectedLog.target}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{selectedLog.targetType?.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">IP Address</p>
                    <code className="text-sm font-mono text-foreground">{selectedLog.ipAddress}</code>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">Timestamp</p>
                    <p className="text-sm font-semibold text-foreground">
                      {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{selectedLog.description}</p>
              </div>
            </div>
          </div>
        )}
      </BaseDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${selectedIds.size} Audit Log${selectedIds.size !== 1 ? "s" : ""}`}
        description="Permanently deleting audit logs is irreversible. These records will be erased from the system and cannot be recovered."
        actionType="danger"
        confirmLabel="Yes, Delete Logs"
        onConfirm={confirmDeleteLogs}
      />
    </div>
  );
}
