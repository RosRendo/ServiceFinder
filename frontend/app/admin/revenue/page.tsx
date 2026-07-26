"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download, Loader2 } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

type Range = "7d" | "30d" | "90d" | "1y";

export default function RevenuePage() {
  const [range, setRange] = useState<Range>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        const payload = response.data.data || response.data;
        setData(payload);
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load revenue data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [toast]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const grossRevenue = data?.totalRevenue || 0;
  const platformFee = grossRevenue * 0.15; // Assuming 15% platform fee
  const refunds = 0; // Currently unmocked in backend
  const netRevenue = grossRevenue - platformFee - refunds;

  const kpis = [
    { label: "Gross Revenue", value: `$${grossRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: `+${data?.revenueGrowth || 0}%`, up: true },
    { label: "Platform Fee", value: `$${platformFee.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: "+15.0%", up: true },
    { label: "Refunds", value: `$${refunds.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: "0%", up: false },
    { label: "Net Revenue", value: `$${netRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, change: `+${data?.revenueGrowth || 0}%`, up: true },
  ];

  const chartData = (data?.monthlyData || []).map((m: any) => ({
    day: m.name,
    gross: m.revenue,
    fee: m.revenue * 0.15,
    refunds: 0,
    net: m.revenue * 0.85,
  }));

  const companyBreakdown = (data?.topCompanies || []).map((c: any) => ({
    name: c.name,
    revenue: parseFloat(c.revenue.replace(/[^0-9.-]+/g, "")) || 0,
    bookings: c.bookings,
    fee: (parseFloat(c.revenue.replace(/[^0-9.-]+/g, "")) || 0) * 0.15,
  }));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 relative bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Revenue Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform-wide financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1 border border-border">
            {(["7d", "30d", "90d", "1y"] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${range === r ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background">
            <Download className="w-3.5 h-3.5 opacity-70" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-violet-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">{k.label}</p>
            <p className="text-2xl font-bold text-foreground relative z-10">{k.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium relative z-10 ${k.up ? "text-emerald-500" : "text-rose-500"}`}>
              {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {k.change} vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="col-span-2 bg-background border border-border rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue Breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  {[
                    { id: "gross", color: "#8b5cf6" },
                    { id: "fee", color: "#10b981" },
                    { id: "refunds", color: "#f43f5e" },
                  ].map(({ id, color }) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(v: any, name: any) => [`$${v.toLocaleString(undefined, {minimumFractionDigits: 0})}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]} />
                <Area type="monotone" dataKey="gross" stroke="#8b5cf6" strokeWidth={2} fill="url(#gross)" name="Gross" />
                <Area type="monotone" dataKey="fee" stroke="#10b981" strokeWidth={2} fill="url(#fee)" name="Platform Fee" />
                <Area type="monotone" dataKey="refunds" stroke="#f43f5e" strokeWidth={1.5} fill="url(#refunds)" name="Refunds" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Breakdown */}
        <div className="col-span-1 bg-background border border-border rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <h2 className="text-sm font-semibold text-foreground mb-4">Top Earning Companies</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {companyBreakdown.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${c.revenue.toLocaleString()}</p>
                  <p className="text-xs font-medium text-emerald-500">+${c.fee.toLocaleString(undefined, {minimumFractionDigits: 0})} fee</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
