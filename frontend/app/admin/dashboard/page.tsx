"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Activity, Users, ShieldAlert, AlertCircle, CheckCircle2, Globe, Clock, User } from "lucide-react";

const statCards = [
  { title: "Active Companies", value: "142", change: "+12 this week", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
  { title: "Total Users", value: "1,402", change: "Currently active", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  { title: "System Health", value: "99.9%", change: "API: 42ms latency", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  { title: "Open Disputes", value: "3", change: "Requires attention", icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
];

const pendingVerifications = [
  { id: "COMP-991", name: "CleanPro Services", submitted: "Oct 24, 2023", status: "Waiting Docs" },
  { id: "COMP-992", name: "FixIt Plumbing", submitted: "Oct 25, 2023", status: "Review Ready" },
  { id: "COMP-993", name: "Elite Electricians", submitted: "Oct 25, 2023", status: "Review Ready" },
];

const systemAlerts = [
  { id: "SLA-1", title: "Verification Overdue", desc: "5 companies waiting > 48h", type: "critical" },
  { id: "SLA-2", title: "Unresolved Disputes", desc: "3 disputes open > 3 days", type: "warning" },
  { id: "SLA-3", title: "Pending Payouts", desc: "12 payouts on payment hold", type: "warning" },
];

const systemLogs = [
  { id: 1, event: "API Deployment v2.4.1", time: "10:00 AM", status: "success" },
  { id: 2, event: "Database Backup Completed", time: "04:00 AM", status: "success" },
  { id: 3, event: "Failed Login Attempts Spike", time: "Yesterday", status: "warning" },
];

const recentTickets = [
  { id: "TKT-001", user: "CleanPro Services", issue: "Payout delayed", status: "Open", priority: "high", time: "2h ago" },
  { id: "TKT-002", user: "John Doe", issue: "Cannot log in", status: "In Progress", priority: "medium", time: "4h ago" },
  { id: "TKT-003", user: "Elite Electricians", issue: "Verification rejected", status: "Open", priority: "low", time: "1d ago" },
];

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-sm text-gray-400">Loading...</div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform overview and system health</p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500">{s.title}</span>
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${s.bg} ${s.border} border`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.change}</div>
          </div>
        ))}
      </div>

      {/* Main Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pending Verifications Table */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Pending Verifications</h2>
            <Link href="/admin/verification" className="text-xs text-indigo-600 font-medium hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 font-medium border-b border-gray-100">
                <th className="px-5 py-2.5 text-left">Company</th>
                <th className="px-5 py-2.5 text-left">ID</th>
                <th className="px-5 py-2.5 text-left">Submitted</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingVerifications.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">{c.id}</td>
                  <td className="px-5 py-3 text-gray-500">{c.submitted}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === "Review Ready" ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-600"
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/verification`} className="text-xs text-indigo-600 font-medium hover:underline">Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={`px-4 py-3.5 flex gap-3 border-l-2 ${
                alert.type === "critical" ? "border-l-rose-400 bg-rose-50/30" : "border-l-amber-400 bg-amber-50/30"
              }`}>
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${alert.type === "critical" ? "text-rose-500" : "text-amber-500"}`} />
                <div>
                  <div className="text-xs font-semibold text-gray-800">{alert.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{alert.desc}</div>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <Globe className="w-3.5 h-3.5 text-gray-400" /> Database Load
              </span>
              <span className="text-xs font-semibold text-emerald-600">Low (12%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Tickets */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tickets</h2>
            <Link href="/admin/support" className="text-xs text-indigo-600 font-medium hover:underline">View queue</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTickets.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    t.priority === "high" ? "bg-rose-400" : t.priority === "medium" ? "bg-amber-400" : "bg-gray-300"
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{t.issue}</div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{t.user}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.time}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  t.status === "Open" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">System Activity</h2>
            <Link href="/admin/audit" className="text-xs text-indigo-600 font-medium hover:underline">Full log</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {systemLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    log.status === "success" ? "bg-emerald-50" : "bg-amber-50"
                  }`}>
                    {log.status === "success"
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{log.event}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{log.time}</div>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${log.status === "success" ? "text-emerald-600" : "text-amber-600"}`}>
                  {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
