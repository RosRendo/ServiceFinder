"use client";
import { useState, useMemo, useEffect } from "react";
import { FileText, Search, Activity, Shield, User, Building, Key, Clock, Loader2 } from "lucide-react";

const ACTION_LABELS: Record<string, { label: string; class: string }> = {
  company_approved: { label: "Company Approved", class: "bg-emerald-50 text-emerald-700" },
  company_rejected: { label: "Company Rejected", class: "bg-rose-50 text-rose-700" },
  user_created: { label: "User Created", class: "bg-indigo-50 text-indigo-700" },
  user_suspended: { label: "User Suspended", class: "bg-rose-50 text-rose-700" },
  payout_approved: { label: "Payout Approved", class: "bg-emerald-50 text-emerald-700" },
  payout_rejected: { label: "Payout Rejected", class: "bg-rose-50 text-rose-700" },
  category_created: { label: "Category Created", class: "bg-purple-50 text-purple-700" },
  category_updated: { label: "Category Updated", class: "bg-purple-50 text-purple-700" },
  service_type_created: { label: "Service Type Created", class: "bg-orange-50 text-orange-700" },
  service_type_updated: { label: "Service Type Updated", class: "bg-orange-50 text-orange-700" },
  dispute_resolved: { label: "Dispute Resolved", class: "bg-emerald-50 text-emerald-700" },
  settings_changed: { label: "Settings Changed", class: "bg-gray-100 text-gray-600" },
};

const ROLE: Record<string, string> = {
  admin: "bg-indigo-600 text-white", system: "bg-gray-800 text-white",
  company: "bg-indigo-50 text-indigo-700", customer: "bg-gray-100 text-gray-600",
};

interface AuditLog {
  id: string; action: string; actor: string; actorRole: string; target: string;
  targetType: string; description: string; ipAddress: string; timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs`, { credentials: "include" });
        if (res.ok) { const data = await res.json(); setLogs(data.logs || []); }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const stats = useMemo(() => ({
    total: logs.length,
    today: logs.filter((l) => l.timestamp.startsWith(today)).length,
    admins: logs.filter((l) => l.actorRole === "admin").length,
  }), [logs]);

  const filtered = useMemo(() => logs.filter((l) => {
    const s = `${l.actor} ${l.target} ${l.description} ${l.id}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (actionFilter === "all" || l.action === actionFilter);
  }), [logs, search, actionFilter]);

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all system activities and admin actions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Events", value: stats.total, color: "text-indigo-600", bg: "bg-indigo-50", icon: Activity },
          { label: "Today", value: stats.today, color: "text-emerald-600", bg: "bg-emerald-50", icon: Clock },
          { label: "Admin Actions", value: stats.admins, color: "text-purple-600", bg: "bg-purple-50", icon: Shield },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color} mt-0.5`}>{loading ? "—" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Search actor, target..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white text-gray-700">
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>)}
        </select>
        <div className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64"><FileText className="w-10 h-10 text-gray-200 mb-3" /><p className="text-sm font-medium text-gray-500">No audit logs found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Actor</th>
                  <th className="px-5 py-3 text-left">Target</th>
                  <th className="px-5 py-3 text-left">Description</th>
                  <th className="px-5 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((log) => {
                  const action = ACTION_LABELS[log.action] || { label: log.action, class: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${action.class}`}>{action.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{log.actor}</div>
                        <span className={`inline-flex mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${ROLE[log.actorRole] || "bg-gray-100 text-gray-600"}`}>{log.actorRole}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{log.target}</div>
                        <div className="text-xs text-gray-400">{log.targetType?.replace("_", " ")}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 max-w-xs">{log.description}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <code className="text-[10px] font-mono text-gray-300">{log.ipAddress}</code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}