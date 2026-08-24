"use client";

import { useState } from "react";
import { 
  TrendingUp, CalendarClock, Users, Building, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Activity, Server, CreditCard, Bell, Map, FileCheck, FileText, ChevronRight,
  Ban, RefreshCw, Clock, Zap
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAPI } from "@/lib/hooks/useAPI";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data, loading, refetch } = useAPI<any>('/api/admin/analytics');
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today");
  const [growthMetric, setGrowthMetric] = useState<"revenue" | "bookings" | "users" | "companies">("revenue");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="h-full overflow-hidden p-6 space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        {/* Chart + panels skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  const baseRevenue      = Number(data?.platformRevenue || 0);
  const baseBookings     = Number(data?.totalBookings   || 0);
  const activeCompanies  = Number(data?.totalCompanies  || 0);
  const activeUsers      = Number(data?.totalUsers       || 0);
  const revenueGrowth    = Number(data?.revenueGrowth    || 0);
  const bookingsGrowth   = Number(data?.bookingsGrowth   || 0);
  const usersGrowth      = Number(data?.usersGrowth      || 0);
  const companiesGrowth  = Number(data?.companiesGrowth  || 0);

  const kpis = {
    today: [
      { label: "Platform Revenue",  value: `$${Number(data?.platformRevenue||0).toLocaleString()}`, change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs last month`,   up: revenueGrowth  >= 0, icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
      { label: "Bookings",          value: Number(data?.totalBookings||0).toLocaleString(),         change: `${bookingsGrowth >= 0 ? '+' : ''}${bookingsGrowth}% vs last month`,  up: bookingsGrowth >= 0, icon: CalendarClock, color: "text-indigo-500",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20" },
      { label: "Active Companies",  value: Number(data?.totalCompanies||0).toLocaleString(),        change: `${companiesGrowth >= 0 ? '+' : ''}${companiesGrowth}% vs last month`, up: companiesGrowth>= 0, icon: Building,      color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
      { label: "Active Users",      value: Number(data?.totalUsers||0).toLocaleString(),            change: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}% vs last month`,     up: usersGrowth    >= 0, icon: Users,         color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
    ],
    weekly: [
      { label: "Platform Revenue",  value: `$${Number(data?.totalRevenue||0).toLocaleString()}`,   change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs last month`,   up: revenueGrowth  >= 0, icon: TrendingUp,   color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
      { label: "Bookings",          value: Number(data?.totalBookings||0).toLocaleString(),         change: `${bookingsGrowth >= 0 ? '+' : ''}${bookingsGrowth}% vs last month`,  up: bookingsGrowth >= 0, icon: CalendarClock, color: "text-indigo-500",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20" },
      { label: "Active Companies",  value: Number(data?.totalCompanies||0).toLocaleString(),        change: `${companiesGrowth >= 0 ? '+' : ''}${companiesGrowth}% vs last month`, up: companiesGrowth>= 0, icon: Building,      color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
      { label: "Active Users",      value: Number(data?.totalUsers||0).toLocaleString(),            change: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}% vs last month`,     up: usersGrowth    >= 0, icon: Users,         color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
    ]
  };

  const activeKpis = kpis[timeframe];
  
  // All chart data comes from data.monthlyData / data.registrationTrend
  const growthData = (data?.monthlyData || []) as Array<{ name: string; revenue: number; bookings: number }>;
  const registrationData = (data?.registrationTrend || []) as Array<{ name: string; users: number; companies: number }>;

  // Merge for the growth chart (needs users + companies which come from registrationTrend)
  const mergedGrowthData = growthData.map((m) => {
    const reg = registrationData.find((r) => r.name === m.name) || { users: 0, companies: 0 };
    return { ...m, users: reg.users, companies: reg.companies };
  });

  const fmtGrowth = (v: number) => `${v >= 0 ? '+' : ''}${v}% vs last month`;
  const actionQueue = [
    { label: "Pending Companies",   count: data?.pendingCompanies ?? 0, route: "/admin/companies",  icon: Building,  color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
    { label: "Open Disputes",       count: data?.activeDisputes   ?? 0, route: "/admin/disputes",   icon: CreditCard, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
    { label: "Open Support Tickets",count: data?.openTickets      ?? 0, route: "/admin/support",    icon: AlertCircle,color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    { label: "Reported Content",    count: data?.activeDisputes   ?? 0, route: "/admin/moderation", icon: Ban,        color: "text-violet-600 bg-violet-500/10 border-violet-500/20" },
  ];

  // Platform Health — static until we have a /health endpoint
  const platformHealth = [
    { name: "API",           status: "Healthy", color: "bg-emerald-500", icon: Server },
    { name: "Payments",      status: "Healthy", color: "bg-emerald-500", icon: CreditCard },
    { name: "Notifications", status: "Healthy", color: "bg-emerald-500", icon: Bell },
    { name: "Maps",          status: "Healthy", color: "bg-emerald-500", icon: Map },
    { name: "AI Service",    status: "Healthy", color: "bg-emerald-500", icon: Zap },
  ];

  // Reports & alerts from real API counts
  const reports = [
    { label: "Open Disputes",        count: data?.activeDisputes   ?? 0, icon: Building },
    { label: "Open Support Tickets", count: data?.openTickets      ?? 0, icon: FileText },
    { label: "Pending Companies",    count: data?.pendingCompanies ?? 0, icon: AlertCircle },
    { label: "Cancelled Bookings",   count: data?.cancelledBookings ?? 0, icon: CreditCard },
  ];

  // KPI card growth text from real API (Variables already defined above)

  // Recently registered companies — derived from topCompanies API
  const newCompanies = (data?.topCompanies || []).slice(0, 3).map((c: any) => ({
    name: c.name,
    status: c.completedJobs > 0 ? "Verified" : "Pending Verification",
    statusColor: c.completedJobs > 0
      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
      : "text-amber-600 bg-amber-500/10 border-amber-500/20",
    time: `${c.completedJobs} completed jobs`,
  }));

  // Activity feed — static placeholder until audit-logs endpoint is wired per-widget
  const activities = [
    { text: "Analytics Refreshed", desc: "Platform data updated", time: "Now",   color: "bg-indigo-500" },
    { text: "Open Disputes",       desc: `${data?.activeDisputes || 0} unresolved`,  time: "Live", color: "bg-rose-500" },
    { text: "Open Tickets",        desc: `${data?.openTickets || 0} awaiting reply`, time: "Live", color: "bg-amber-500" },
    { text: "Pending Companies",   desc: `${data?.pendingCompanies || 0} to review`, time: "Live", color: "bg-violet-500" },
  ];

  return (

    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Live platform command center.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-muted/50 p-1 rounded-lg flex items-center shadow-inner border border-border inline-flex">
            <button 
              onClick={() => setTimeframe("today")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timeframe === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Today
            </button>
            <button 
              onClick={() => setTimeframe("weekly")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${timeframe === "weekly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Weekly
            </button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            className="h-9 w-9 rounded-lg border-border"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="wait">
          {activeKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={`${timeframe}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="bg-background rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                  <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {kpi.change}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Row 2: Growth & Action Queue */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        
        {/* Platform Growth (8 cols) */}
        <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Platform Growth</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "revenue", label: "Revenue" },
                { id: "bookings", label: "Bookings" },
                { id: "users", label: "New Users" },
                { id: "companies", label: "New Companies" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setGrowthMetric(m.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${growthMetric === m.id ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-transparent text-muted-foreground hover:bg-muted'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedGrowthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => growthMetric === 'revenue' ? `$${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}
                />
                <Area type="monotone" dataKey={growthMetric} stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification & Action Queue (4 cols) */}
        <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
          <h2 className="text-sm font-semibold text-foreground mb-4">Action Queue</h2>
          <div className="flex-1 flex flex-col gap-3">
            {actionQueue.map((item, i) => (
              <div 
                key={i} 
                onClick={() => router.push(item.route)}
                className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground">{item.count}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: New Companies & Platform Status */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        
        {/* Recently Registered */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recently Registered</h2>
            <Button variant="ghost" onClick={() => router.push('/admin/companies')} className="text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-muted/50 px-2 h-7 rounded-md uppercase tracking-widest">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border/50">
              {newCompanies.map((company: any, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => router.push('/admin/companies')}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0 border border-border">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.time}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${company.statusColor}`}>
                  {company.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Platform Health
            </h2>
          </div>
          <div className="p-5 flex-1 grid grid-cols-2 gap-4">
            {platformHealth.map((service, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shadow-sm">
                    <service.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background ${service.color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{service.name}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{service.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 4: Activity & Reports */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 pb-10">
        
        {/* Activity Feed */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Activity Feed</h2>
          </div>
          <div className="p-5 space-y-4">
            {activities.map((act, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${act.color} relative z-10 shadow-sm mt-1`} />
                  {i !== activities.length - 1 && <div className="w-px h-full bg-border/80 absolute top-3.5 left-[4.5px]" />}
                </div>
                <div className="flex-1 pb-2 -mt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground leading-none">{act.text}</p>
                    <p className="text-xs font-bold text-muted-foreground">{act.time}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">{act.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reports & Alerts */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-500" /> Reports & Alerts
            </h2>
          </div>
          <div className="p-5">
            <div className="space-y-1">
              {reports.map((report, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:px-2 transition-all rounded-lg hover:bg-muted/30 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <report.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-foreground">{report.label}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">{report.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
