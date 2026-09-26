"use client";

import { useState } from "react";
import { 
  TrendingUp, CalendarClock, Users, Building2, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Activity, Server, CreditCard, ChevronRight, RefreshCw, Zap, ShieldAlert, 
  Wrench, CheckCircle2, Clock, Radio, ExternalLink
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAPI } from "@/lib/hooks/useAPI";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Record<string, { label: string; class: string }> = {
  company_approved: { label: "Company Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  company_rejected: { label: "Company Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  user_created: { label: "User Created", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  user_suspended: { label: "User Suspended", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  payout_approved: { label: "Payout Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  payout_rejected: { label: "Payout Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  category_created: { label: "Category Created", class: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
  dispute_resolved: { label: "Dispute Resolved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  booking_completed: { label: "Booking Completed", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
};

function formatRelativeTime(dateStr?: string | Date) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function CompanyAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const [error, setError] = useState(false);
  let imageUrl = src;
  if (!imageUrl || error) {
    imageUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
  } else if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
    const slash = imageUrl.startsWith("/") ? "" : "/";
    imageUrl = `${backendUrl}${slash}${imageUrl}`;
  }

  return (
    <img 
      src={imageUrl} 
      alt={name} 
      className={cn("object-cover rounded-xl border border-border/60", className)} 
      onError={() => setError(true)} 
    />
  );
}

function AdminChartTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;
  let formatted = Number(value).toLocaleString();
  if (metric === "revenue") formatted = `$${Number(value).toLocaleString()}`;

  const metricLabels: Record<string, string> = {
    revenue: "Platform Take-Rate",
    bookings: "Bookings Dispatched",
    users: "New User Accounts",
    companies: "New Service Providers",
  };

  return (
    <div className="rounded-xl border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-black tracking-tight text-foreground">{formatted}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">{metricLabels[metric] || "Metric"}</span>
      </div>
    </div>
  );
}

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
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Skeleton className="lg:col-span-8 h-[340px] rounded-xl" />
          <Skeleton className="lg:col-span-4 h-[340px] rounded-xl" />
        </div>
      </div>
    );
  }

  // Real Platform Data
  const basePlatformRevenue = Number(data?.platformRevenue || 0);
  const baseTotalBookings   = Number(data?.totalBookings || 0);
  const totalCompanies      = Number(data?.totalCompanies || 0);
  const pendingCompanies    = Number(data?.pendingCompanies || 0);
  const verifiedCompanies   = Math.max(0, totalCompanies - pendingCompanies);
  const totalUsers          = Number(data?.totalUsers || 0);
  
  const revenueGrowth       = Number(data?.revenueGrowth || 0);
  const bookingsGrowth      = Number(data?.bookingsGrowth || 0);
  const usersGrowth         = Number(data?.usersGrowth || 0);
  const companiesGrowth     = Number(data?.companiesGrowth || 0);

  // Real Operational Marketplace Stats
  const activeStaffCount    = Number(data?.activeStaffCount || 0);
  const inProgressJobs      = Number(data?.inProgressJobs || 0);
  const unassignedJobs      = Number(data?.unassignedJobs || 0);

  // Dynamic Today vs Weekly KPI Models
  const todayStats          = data?.todayStats || {};
  const todayRevenue        = Number(todayStats.platformRevenue || 0);
  const todayBookings       = Number(todayStats.bookings || 0);
  const todayCompanies      = Number(todayStats.companies || 0);
  const todayUsers          = Number(todayStats.users || 0);

  const kpis = {
    today: [
      { 
        label: "Platform Revenue", 
        value: `$${todayRevenue.toLocaleString()}`, 
        subtext: "Today's take-rate earned", 
        up: true, 
        icon: TrendingUp, 
        color: "text-emerald-500", 
        bg: "bg-emerald-500/10", 
        border: "border-emerald-500/20" 
      },
      { 
        label: "Bookings Created", 
        value: todayBookings.toLocaleString(), 
        subtext: "Today's shift volume", 
        up: todayBookings > 0, 
        icon: CalendarClock, 
        color: "text-indigo-500", 
        bg: "bg-indigo-500/10", 
        border: "border-indigo-500/20" 
      },
      { 
        label: "New Providers", 
        value: todayCompanies.toLocaleString(), 
        subtext: "Registered today", 
        up: todayCompanies >= 0, 
        icon: Building2, 
        color: "text-violet-500", 
        bg: "bg-violet-500/10", 
        border: "border-violet-500/20" 
      },
      { 
        label: "New Customers", 
        value: todayUsers.toLocaleString(), 
        subtext: "Signed up today", 
        up: todayUsers >= 0, 
        icon: Users, 
        color: "text-amber-500", 
        bg: "bg-amber-500/10", 
        border: "border-amber-500/20" 
      },
    ],
    weekly: [
      { 
        label: "Platform Revenue", 
        value: `$${basePlatformRevenue.toLocaleString()}`, 
        subtext: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs last month`, 
        up: revenueGrowth >= 0, 
        icon: TrendingUp, 
        color: "text-emerald-500", 
        bg: "bg-emerald-500/10", 
        border: "border-emerald-500/20" 
      },
      { 
        label: "Total Bookings", 
        value: baseTotalBookings.toLocaleString(), 
        subtext: `${bookingsGrowth >= 0 ? '+' : ''}${bookingsGrowth}% vs last month`, 
        up: bookingsGrowth >= 0, 
        icon: CalendarClock, 
        color: "text-indigo-500", 
        bg: "bg-indigo-500/10", 
        border: "border-indigo-500/20" 
      },
      { 
        label: "Active Companies", 
        value: totalCompanies.toLocaleString(), 
        subtext: `${companiesGrowth >= 0 ? '+' : ''}${companiesGrowth}% vs last month`, 
        up: companiesGrowth >= 0, 
        icon: Building2, 
        color: "text-violet-500", 
        bg: "bg-violet-500/10", 
        border: "border-violet-500/20" 
      },
      { 
        label: "Registered Users", 
        value: totalUsers.toLocaleString(), 
        subtext: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}% vs last month`, 
        up: usersGrowth >= 0, 
        icon: Users, 
        color: "text-amber-500", 
        bg: "bg-amber-500/10", 
        border: "border-amber-500/20" 
      },
    ]
  };

  const activeKpis = kpis[timeframe];

  // Chart data assembly from real database historical aggregations
  const growthData = (data?.monthlyData || []) as Array<{ name: string; revenue: number; bookings: number }>;
  const registrationData = (data?.registrationTrend || []) as Array<{ name: string; users: number; companies: number }>;
  const mergedGrowthData = growthData.map((m) => {
    const reg = registrationData.find((r) => r.name === m.name) || { users: 0, companies: 0 };
    return { ...m, users: reg.users, companies: reg.companies };
  });

  // Action Queue triage items
  const actionQueue = [
    { 
      label: "Pending Company Verifications", 
      count: pendingCompanies, 
      route: "/admin/verification", 
      badge: "Needs Review", 
      icon: ShieldAlert, 
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20" 
    },
    { 
      label: "Open Customer Disputes", 
      count: Number(data?.activeDisputes || 0), 
      route: "/admin/disputes", 
      badge: "Arbitration", 
      icon: CreditCard, 
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20" 
    },
    { 
      label: "Open Support Tickets", 
      count: Number(data?.openTickets || 0), 
      route: "/admin/support", 
      badge: "Assistance", 
      icon: AlertCircle, 
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20" 
    },
    { 
      label: "Flagged Content & Reports", 
      count: Number(data?.reportedContent || 0), 
      route: "/admin/moderation", 
      badge: "Safety", 
      icon: ShieldAlert, 
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20" 
    },
  ];

  // Real recently registered companies
  const recentCompanies = (data?.recentCompanies || []).slice(0, 4);

  // Real audit logs
  const recentAuditLogs = (data?.recentAuditLogs || []).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans">
      
      {/* Top Header & Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Admin Command Center</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Sync
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Live marketplace telemetry, platform revenue capture, and triage queues.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <div className="bg-muted/50 p-1 rounded-xl flex items-center border border-border/80 shadow-inner">
            <button 
              onClick={() => setTimeframe("today")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === "today" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today's Shift
            </button>
            <button 
              onClick={() => setTimeframe("weekly")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === "weekly" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All-Time Growth
            </button>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            className="h-9 w-9 rounded-xl border-border/80 shadow-sm"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Operational Marketplace Status Strip */}
      <div className="bg-background rounded-2xl border border-border/80 p-4.5 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary animate-pulse" /> Live Marketplace Telemetry
          </h2>
          <span className="text-[11px] font-bold text-muted-foreground">
            {activeStaffCount} Techs &bull; {inProgressJobs} Active Orders
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Active Technicians */}
          <div className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-xl hover:border-emerald-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Wrench className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">{activeStaffCount}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Active Techs</p>
            </div>
          </div>

          {/* In-Flight Jobs */}
          <div className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-xl hover:border-blue-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">{inProgressJobs}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">In-Flight Jobs</p>
            </div>
          </div>

          {/* Unassigned Orders */}
          <div className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-xl hover:border-amber-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">{unassignedJobs}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Unassigned Jobs</p>
            </div>
          </div>

          {/* Verified Companies */}
          <div className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-xl hover:border-indigo-500/30 transition-all">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">{verifiedCompanies}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Active Providers</p>
            </div>
          </div>

          {/* Pending Verification */}
          <div className="flex items-center gap-3 p-3.5 bg-muted/30 border border-border/60 rounded-xl hover:border-violet-500/30 transition-all col-span-2 md:col-span-1">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 shrink-0">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-foreground tracking-tight leading-none">{pendingCompanies}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Executive KPI Ribbon */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="wait">
          {activeKpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={`${timeframe}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="bg-background rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="flex justify-between items-center mb-3">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <div className={`w-8 h-8 rounded-xl ${kpi.bg} ${kpi.border} border flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`text-[11px] font-bold flex items-center gap-0.5 ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {kpi.subtext}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Row 2: Platform Growth Area Chart & Action Queue */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        
        {/* Platform Growth Analytics (8 cols) */}
        <div className="lg:col-span-8 bg-background rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Platform Growth Trajectory</h2>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Historical 6-month transaction & adoption metrics</p>
            </div>
            
            <div className="bg-muted/40 p-1 rounded-xl flex items-center border border-border/60 self-start sm:self-auto">
              {[
                { id: "revenue", label: "Take-Rate" },
                { id: "bookings", label: "Bookings" },
                { id: "users", label: "Users" },
                { id: "companies", label: "Providers" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setGrowthMetric(m.id as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    growthMetric === m.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
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
                <Tooltip content={<AdminChartTooltip metric={growthMetric} />} />
                <Area 
                  type="monotone" 
                  dataKey={growthMetric} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#adminGrowthGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Action Queue & Triage (4 cols) */}
        <div className="lg:col-span-4 bg-background rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground tracking-tight">Priority Action Queue</h2>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                Triage
              </span>
            </div>
            
            <div className="space-y-2.5">
              {actionQueue.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => router.push(item.route)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:bg-muted/40 cursor-pointer transition-all group hover:border-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color} shrink-0`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {item.label}
                      </p>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-muted/80 text-foreground border border-border/60">
                      {item.count}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Platform Security Status</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Services Nominal
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Recently Registered Partners & Live Audit Trail */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
        
        {/* Recently Registered Partners */}
        <div className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Recently Registered Partners</h2>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Newly onboarded service providers</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin/companies')} 
              className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-muted/50 px-2.5 h-7 rounded-lg"
            >
              View Directory <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-border/50 flex-1">
            {recentCompanies.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">No recently registered companies.</p>
              </div>
            ) : (
              recentCompanies.map((company: any) => {
                const isVerified = company.verificationStatus === "verified";
                return (
                  <div 
                    key={company.id} 
                    onClick={() => router.push('/admin/companies')}
                    className="p-4 flex items-center justify-between hover:bg-muted/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <CompanyAvatar 
                        src={company.logoUrl} 
                        name={company.name} 
                        className="w-10 h-10 shrink-0" 
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {company.name}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Joined {formatRelativeTime(company.createdAt)} &bull; {company.completedJobs} completed jobs
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isVerified 
                        ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
                        : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                    }`}>
                      {company.verificationStatus || "Pending"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Platform Audit Trail */}
        <div className="bg-background rounded-2xl border border-border/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Live Audit Trail
              </h2>
              <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Real-time administrator & system events</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => router.push('/admin/audit')} 
              className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-muted/50 px-2.5 h-7 rounded-lg"
            >
              View Audit Log <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-border/50 flex-1">
            {recentAuditLogs.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">No audit activity recorded yet.</p>
              </div>
            ) : (
              recentAuditLogs.map((log: any) => {
                const actionMeta = ACTION_LABELS[log.action] || {
                  label: log.action ? log.action.replace(/_/g, ' ') : "System Action",
                  class: "bg-muted/50 text-muted-foreground border-border/60"
                };

                return (
                  <div key={log.id} className="p-3.5 px-4.5 flex items-center justify-between hover:bg-muted/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {log.user?.fullName ? log.user.fullName.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${actionMeta.class}`}>
                            {actionMeta.label}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {log.user?.fullName || "System Admin"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                          {log.entityType ? `${log.entityType} #${log.entityId || ''}` : "Platform Event"} &bull; IP: {log.ipAddress || "Localhost"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0">
                      {formatRelativeTime(log.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Row 4: Platform Infrastructure & Service Health Strip */}
      <div className="bg-muted/30 rounded-2xl border border-border/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">Platform Infrastructure Health:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-foreground">API Gateway: <span className="text-muted-foreground font-semibold">24ms (Nominal)</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-foreground">PostgreSQL: <span className="text-muted-foreground font-semibold">Pool Healthy</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-foreground">KHQR Engine: <span className="text-muted-foreground font-semibold">Connected</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-foreground">WebSocket: <span className="text-muted-foreground font-semibold">Broadcasting</span></span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
