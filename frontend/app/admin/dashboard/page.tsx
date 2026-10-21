"use client";

import { useState, useMemo, Suspense } from "react";
import { 
  TrendingUp, CalendarClock, Users, Building2, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Activity, Server, CreditCard, ChevronRight, RefreshCw, Zap, ShieldAlert, 
  Wrench, CheckCircle2, Clock, Radio, ExternalLink, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAPI } from "@/lib/hooks/useAPI";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import AdminAnalyticsPage from "@/app/admin/analytics/page";
import AdminReportsPage from "@/app/admin/reports/page";

const ACTION_LABELS: Record<string, { label: string; class: string }> = {
  company_approved: { label: "Company Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  company_rejected: { label: "Company Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  user_created: { label: "User Created", class: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  user_suspended: { label: "User Suspended", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  payout_approved: { label: "Payout Approved", class: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  payout_rejected: { label: "Payout Rejected", class: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  category_created: { label: "Category Created", class: "bg-muted text-foreground border-border" },
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
      className={cn("object-cover rounded-xl border border-border", className)} 
      onError={() => setError(true)} 
    />
  );
}

const METRIC_THEMES: Record<string, { color: string; label: string }> = {
  revenue: { color: "#10b981", label: "Platform Take-Rate" },
  bookings: { color: "#3b82f6", label: "Bookings Dispatched" },
  users: { color: "#f59e0b", label: "New User Accounts" },
  companies: { color: "#8b5cf6", label: "New Service Providers" },
};

function AdminChartTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;
  let formatted = Number(value).toLocaleString();
  if (metric === "revenue") formatted = `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const currentTheme = METRIC_THEMES[metric] || { color: "#10b981", label: "Metric" };

  return (
    <div className="rounded-xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs" style={{ backgroundColor: currentTheme.color }} />
        <span className="text-base font-bold font-mono text-foreground">{formatted}</span>
        <span className="text-[11px] font-medium text-muted-foreground">{currentTheme.label}</span>
      </div>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="h-full overflow-hidden p-6 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Skeleton className="lg:col-span-8 h-[360px] rounded-2xl" />
        <Skeleton className="lg:col-span-4 h-[360px] rounded-2xl" />
      </div>
    </div>
  );
}

function AdminDashboardContent() {
  const { data, loading, refetch } = useAPI<any>('/api/admin/analytics');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const [activeView, setActiveView] = useState<"live" | "analytics" | "reports">("live");
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today");
  const [growthMetric, setGrowthMetric] = useState<"revenue" | "bookings" | "users" | "companies">("revenue");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabChange = (newTab: "live" | "analytics" | "reports") => {
    setActiveView(newTab);
    const url = newTab === "live" ? "/admin/dashboard" : `/admin/dashboard?tab=${newTab}`;
    window.history.replaceState(null, "", url);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading && !data) {
    return <AdminDashboardSkeleton />;
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

  // Operational Marketplace Stats
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
        value: `$${todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        subtext: "Today's take-rate earned", 
        up: true, 
        icon: TrendingUp, 
      },
      { 
        label: "Bookings Dispatched", 
        value: todayBookings.toLocaleString(), 
        subtext: "Today's order volume", 
        up: todayBookings > 0, 
        icon: CalendarClock, 
      },
      { 
        label: "New Providers", 
        value: todayCompanies.toLocaleString(), 
        subtext: "Registered today", 
        up: todayCompanies >= 0, 
        icon: Building2, 
      },
      { 
        label: "New Customers", 
        value: todayUsers.toLocaleString(), 
        subtext: "Signed up today", 
        up: todayUsers >= 0, 
        icon: Users, 
      },
    ],
    weekly: [
      { 
        label: "Platform Revenue", 
        value: `$${basePlatformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        subtext: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs last month`, 
        up: revenueGrowth >= 0, 
        icon: TrendingUp, 
      },
      { 
        label: "Total Bookings", 
        value: baseTotalBookings.toLocaleString(), 
        subtext: `${bookingsGrowth >= 0 ? '+' : ''}${bookingsGrowth}% vs last month`, 
        up: bookingsGrowth >= 0, 
        icon: CalendarClock, 
      },
      { 
        label: "Active Companies", 
        value: totalCompanies.toLocaleString(), 
        subtext: `${companiesGrowth >= 0 ? '+' : ''}${companiesGrowth}% vs last month`, 
        up: companiesGrowth >= 0, 
        icon: Building2, 
      },
      { 
        label: "Registered Users", 
        value: totalUsers.toLocaleString(), 
        subtext: `${usersGrowth >= 0 ? '+' : ''}${usersGrowth}% vs last month`, 
        up: usersGrowth >= 0, 
        icon: Users, 
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

  const activeTheme = METRIC_THEMES[growthMetric] || { color: "#10b981", label: "Platform Take-Rate" };

  // Action Queue triage items (monochrome neutral style)
  const actionQueue = [
    { 
      label: "Pending Company Verifications", 
      count: pendingCompanies, 
      route: "/admin/verification", 
      badge: "Needs Review", 
      icon: ShieldAlert, 
    },
    { 
      label: "Open Customer Disputes", 
      count: Number(data?.activeDisputes || 0), 
      route: "/admin/disputes", 
      badge: "Arbitration", 
      icon: CreditCard, 
    },
    { 
      label: "Open Support Tickets", 
      count: Number(data?.openTickets || 0), 
      route: "/admin/support", 
      badge: "Assistance", 
      icon: AlertCircle, 
    },
    { 
      label: "Flagged Content & Reports", 
      count: Number(data?.reportedContent || 0), 
      route: "/admin/moderation", 
      badge: "Safety", 
      icon: ShieldAlert, 
    },
  ];

  // Real recently registered companies
  const recentCompanies = (data?.recentCompanies || []).slice(0, 4);

  // Real audit logs
  const recentAuditLogs = (data?.recentAuditLogs || []).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 font-sans max-w-7xl mx-auto bg-background">
      
      {/* ─── Top Header & Master Command Bar ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Admin Command Center</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Sync
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Unified platform operations, deep marketplace telemetry, and financial statements.
          </p>
        </div>
        
        {/* Segmented View Tabs (Monochrome Neutral) */}
        <div className="flex items-center p-1 rounded-xl bg-muted/50 border border-border gap-1 select-none">
          <button 
            type="button"
            onClick={() => handleTabChange("live")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeView === "live"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Live Pulse</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </button>

          <button 
            type="button"
            onClick={() => handleTabChange("analytics")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeView === "analytics"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Analytics & Trends</span>
          </button>

          <button 
            type="button"
            onClick={() => handleTabChange("reports")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activeView === "reports"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PieChartIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Reports & Ledger</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE PULSE VIEW ──────────────────────────────────────────────── */}
      {activeView === "live" && (
        <>
          {/* Sub-bar: Shift Timeframe & Refresh */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-semibold text-muted-foreground">
              Real-time dispatch telemetry and active operational triage.
            </p>
            <div className="flex items-center gap-2.5">
              <div className="bg-muted/50 p-1 rounded-xl flex items-center border border-border">
                <button 
                  onClick={() => setTimeframe("today")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === "today" 
                      ? "bg-card text-foreground shadow-xs border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Today's Shift
                </button>
                <button 
                  onClick={() => setTimeframe("weekly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    timeframe === "weekly" 
                      ? "bg-card text-foreground shadow-xs border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Historical Growth
                </button>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                className="h-9 w-9 rounded-xl border-border shadow-xs hover:bg-muted"
                title="Refresh analytics data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin text-foreground" : ""}`} />
              </Button>
            </div>
          </div>

          {/* ─── Operational Telemetry Bar (Monochrome Neutral) ─────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link 
              href="/admin/staff"
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{activeStaffCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Active Technicians</p>
              </div>
            </Link>

            <Link 
              href="/admin/bookings"
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{inProgressJobs}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">In-Flight Jobs</p>
              </div>
            </Link>

            <Link 
              href="/admin/bookings?unassigned=true"
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{unassignedJobs}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Unassigned Orders</p>
              </div>
            </Link>

            <Link 
              href="/admin/verification"
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{pendingCompanies}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Pending Review</p>
              </div>
            </Link>
          </div>

          {/* ─── Executive KPI Ribbon (Monochrome Neutral) ──────────────────── */}
          <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="wait">
              {activeKpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={`${timeframe}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.03, duration: 0.15 }}
                    className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                      <div className="w-7 h-7 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">{kpi.value}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-0.5">
                          {kpi.up ? <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : <ArrowDownRight className="w-3 h-3 text-rose-600" />}
                          {kpi.subtext}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ─── Main Content Grid: Growth Chart & Action Queue ──────────────── */}
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
            
            {/* Platform Growth Trajectory (8 cols) */}
            <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-5 shadow-xs flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground tracking-tight">Platform Growth Trajectory</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Historical 6-month transaction & adoption metrics</p>
                </div>
                
                <div className="bg-muted/40 p-1 rounded-xl flex items-center border border-border self-start sm:self-auto">
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
                          ? "bg-card text-foreground border border-border shadow-xs" 
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
                        <stop offset="5%" stopColor={activeTheme.color} stopOpacity={0.28}/>
                        <stop offset="95%" stopColor={activeTheme.color} stopOpacity={0.0}/>
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
                      stroke={activeTheme.color} 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#adminGrowthGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Action Queue & Triage (Monochrome Neutral) */}
            <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-foreground tracking-tight">Priority Action Queue</h2>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md border border-border">
                    Triage
                  </span>
                </div>
                
                <div className="space-y-2">
                  {actionQueue.map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => router.push(item.route)}
                      className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors shrink-0">
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-foreground transition-colors leading-tight">
                            {item.label}
                          </p>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                          {item.count}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Platform Security Status</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> All Services Nominal
                </span>
              </div>
            </div>
          </div>

          {/* ─── Row 3: Recently Registered Partners & Live Audit Trail ──────── */}
          <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
            
            {/* Recently Registered Partners */}
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Recently Registered Partners</h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Newly onboarded service providers</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/admin/companies')} 
                  className="text-xs font-semibold text-foreground hover:bg-muted px-2.5 h-7 rounded-lg"
                >
                  View Directory <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="divide-y divide-border flex-1">
                {recentCompanies.length === 0 ? (
                  <div className="p-8 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">No recently registered companies.</p>
                  </div>
                ) : (
                  recentCompanies.map((company: any) => {
                    const isVerified = company.verificationStatus === "verified" || company.verificationStatus === "active";
                    return (
                      <div 
                        key={company.id} 
                        onClick={() => router.push(`/admin/companies/${company.id}`)}
                        className="p-3.5 px-5 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <CompanyAvatar 
                            src={company.logoUrl} 
                            name={company.name} 
                            className="w-9 h-9 shrink-0" 
                          />
                          <div>
                            <p className="text-xs font-bold text-foreground group-hover:underline transition-colors">
                              {company.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Joined {formatRelativeTime(company.createdAt)} &bull; {company.completedJobs || 0} completed jobs
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
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
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" /> Live Audit Trail
                  </h2>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Real-time administrator & system events</p>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/admin/audit')} 
                  className="text-xs font-semibold text-foreground hover:bg-muted px-2.5 h-7 rounded-lg"
                >
                  View Audit Log <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="divide-y divide-border flex-1">
                {recentAuditLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-muted-foreground">No audit activity recorded yet.</p>
                  </div>
                ) : (
                  recentAuditLogs.map((log: any) => {
                    const actionMeta = ACTION_LABELS[log.action] || {
                      label: log.action ? log.action.replace(/_/g, ' ') : "System Action",
                      class: "bg-muted text-muted-foreground border-border"
                    };

                    return (
                      <div key={log.id} className="p-3.5 px-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground font-bold text-xs shrink-0">
                            {log.user?.fullName ? log.user.fullName.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${actionMeta.class}`}>
                                {actionMeta.label}
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {log.user?.fullName || "System Admin"}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {log.details || "Administrative event logged"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── TAB: ANALYTICS & TRENDS ──────────────────────────────────────── */}
      {activeView === "analytics" && (
        <div className="pt-2">
          <AdminAnalyticsPage />
        </div>
      )}

      {/* ─── TAB: REPORTS & LEDGER ────────────────────────────────────────── */}
      {activeView === "reports" && (
        <div className="pt-2">
          <AdminReportsPage />
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}
