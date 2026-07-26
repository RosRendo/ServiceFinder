"use client";

import { useState, useEffect } from "react";
import { TrendingUp, CalendarClock, Users, AlertCircle, ArrowRight, ArrowUpRight, ArrowDownRight, Building, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAPI } from "@/lib/hooks/useAPI";

export default function AdminDashboard() {
  const { data, loading } = useAPI<any>('/api/admin/analytics');
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
      </div>
    );
  }

  const kpis = [
    { label: "Platform Revenue", value: `$${data?.totalRevenue?.toLocaleString() || "0"}`, change: "", up: true, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Total Bookings", value: data?.totalBookings || "0", change: "", up: true, icon: CalendarClock, color: "text-violet-400" },
    { label: "Total Users", value: data?.totalUsers || "0", change: "", up: true, icon: Users, color: "text-blue-400" },
    { label: "Pending Companies", value: data?.pendingCompanies || "0", change: "", up: false, icon: AlertCircle, color: "text-amber-400" },
  ];

  const recentActivity = [
    { text: `System processed ${data?.completedBookings || 0} total completed bookings`, time: "Live", color: "bg-emerald-400" },
    { text: `Platform earned $${data?.platformRevenue?.toLocaleString() || 0} in commissions`, time: "Live", color: "bg-violet-400" },
    { text: `${data?.totalCompanies || 0} service companies registered`, time: "Live", color: "bg-blue-400" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-background border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
              {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {kpi.change} vs yesterday
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly platform earnings</p>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.monthlyData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: any) => [`$${v.toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Requires Attention */}
        <div className="bg-background border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Company Verification Approvals</h2>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">{data?.pendingCompanies || 0} pending</span>
          </div>
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
            {data?.pendingCompanies > 0 
              ? "You have companies waiting for verification. Check the Companies tab." 
              : "No companies pending verification."}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-background border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full ${a.color} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
