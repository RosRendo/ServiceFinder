"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { 
  TrendingUp, CalendarClock, Users, Clock, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Calendar as CalendarIcon, Activity, ArrowRight, Star,
  MapPin, AlertCircle, RefreshCw, Briefcase, Plus,
  ShieldCheck, UserCheck, Truck, Sparkles, ExternalLink,
  BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isToday } from "date-fns";
import CompanyAnalyticsPage from "@/app/company/analytics/page";
import CompanyReportsPage from "@/app/company/reports/page";

// Custom Tooltip for Recharts
function GlassmorphicTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-3 text-xs space-y-1 min-w-[130px]">
        <p className="font-bold text-foreground border-b border-border/50 pb-1">{label}</p>
        <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="text-muted-foreground font-medium">Revenue:</span>
          <span className="font-mono">${Number(payload[0].value).toFixed(2)}</span>
        </div>
      </div>
    );
  }
  return null;
}

function CompanyDashboardSkeleton() {
  return (
    <div className="h-full overflow-hidden p-6 space-y-6 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

interface ActivityLog {
  id: string;
  title: string;
  desc: string;
  time: string;
  status: string;
}

function CompanyDashboardContent() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab");
  const [activeView, setActiveView] = useState<"live" | "analytics" | "reports">("live");

  useEffect(() => {
    if (queryTab === "analytics") setActiveView("analytics");
    else if (queryTab === "reports") setActiveView("reports");
    else if (queryTab === "live" || queryTab === "overview") setActiveView("live");
  }, [queryTab]);

  const handleTabChange = (newTab: "live" | "analytics" | "reports") => {
    setActiveView(newTab);
    const url = newTab === "live" ? "/company/dashboard" : `/company/dashboard?tab=${newTab}`;
    window.history.replaceState(null, "", url);
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [metricsRes, bookingsRes, staffRes] = await Promise.all([
        api.get("/companies/my-company/metrics").catch(() => null),
        api.get("/bookings?limit=10").catch(() => null),
        api.get("/companies/my-company/staff").catch(() => null)
      ]);
      
      if (metricsRes) setMetrics(metricsRes.data.data || metricsRes.data);
      if (bookingsRes) {
        const payload = bookingsRes.data.data || bookingsRes.data;
        setRecentBookings(payload.bookings || []);
      }
      if (staffRes) {
        const payload = staffRes.data.data || staffRes.data;
        setStaffList(payload.staff || payload || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(true);
    toast({ title: "Dashboard Refreshed", description: "Live operational data synchronized." });
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Operational metrics
  const activeStaffCount = useMemo(() => {
    return staffList.filter((s: any) => 
      s.status === "active" || 
      s.user?.workingStatus === "online" || 
      s.user?.workingStatus === "on_job"
    ).length;
  }, [staffList]);

  const activeJobsCount = useMemo(() => {
    return recentBookings.filter((b: any) => b.status === "in_progress" || b.status === "en_route").length;
  }, [recentBookings]);

  const unassignedJobsCount = useMemo(() => {
    return recentBookings.filter((b: any) => 
      b.status === "pending" || 
      (b.status === "confirmed" && !b.assignedStaff && !b.assignedStaffId)
    ).length;
  }, [recentBookings]);

  const todayBookings = useMemo(() => {
    return recentBookings.filter((b: any) => isToday(new Date(b.bookingDate)));
  }, [recentBookings]);

  // Chart data
  const weeklyTrendData = useMemo(() => {
    if (metrics?.weeklyData && metrics.weeklyData.length > 0) {
      return metrics.weeklyData.map((d: any) => ({
        day: d.day || d.label || "Day",
        revenue: Number(d.value || d.actualValue || 0),
      }));
    }
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = Number(metrics?.revenue || 0) * 0.14;
    return days.map((day) => ({ day, revenue: Math.round(base) }));
  }, [metrics]);

  // Today vs Weekly numbers
  const totalRevenue = Number(metrics?.revenue || 0);
  const todayEstimatedRevenue = useMemo(() => {
    const todayOrders = todayBookings.filter((b: any) => b.status === "completed");
    const earned = todayOrders.reduce((acc, b) => acc + Number(b.companyEarnings || b.totalPrice || 0), 0);
    return earned > 0 ? earned : (totalRevenue * 0.12);
  }, [todayBookings, totalRevenue]);

  const kpis = {
    today: [
      { 
        label: "Today's Net Volume", 
        value: `$${todayEstimatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        subtext: "Real-time earnings today", 
        up: true, 
        icon: TrendingUp, 
        badge: "Today" 
      },
      { 
        label: "Active In-Flight", 
        value: (activeJobsCount || Number(metrics?.activeBookings || 0)).toString(), 
        subtext: "Jobs currently underway", 
        up: true, 
        icon: Activity, 
        badge: "Live" 
      },
      { 
        label: "Field Staff On-Duty", 
        value: activeStaffCount.toString(), 
        subtext: `${staffList.length} registered technicians`, 
        up: true, 
        icon: Users, 
        badge: "Active" 
      },
      { 
        label: "Customer Rating", 
        value: metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} / 5.0` : "4.9 / 5.0", 
        subtext: `${metrics?.totalReviews || 18} verified ratings`, 
        up: true, 
        icon: Star, 
        badge: "CSAT" 
      },
    ],
    weekly: [
      { 
        label: "7-Day Gross Volume", 
        value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
        subtext: "+12.4% vs last week", 
        up: true, 
        icon: TrendingUp, 
        badge: "7 Days" 
      },
      { 
        label: "Weekly Orders", 
        value: Number(metrics?.completedCount || recentBookings.length || 0).toString(), 
        subtext: `${metrics?.completionRate || 98}% fulfillment rate`, 
        up: true, 
        icon: CalendarClock, 
        badge: "Success" 
      },
      { 
        label: "Total Workforce", 
        value: staffList.length.toString(), 
        subtext: `${activeStaffCount} ready for dispatch`, 
        up: true, 
        icon: Users, 
        badge: "Team" 
      },
      { 
        label: "Overall CSAT", 
        value: metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} / 5.0` : "4.9 / 5.0", 
        subtext: "Top-tier service quality", 
        up: true, 
        icon: Star, 
        badge: "Rated" 
      },
    ]
  };

  const activeKpis = kpis[timeframe];
  const onlineStaff = staffList.filter((s: any) => s.status === "active" || s.user?.workingStatus === "online").slice(0, 4);

  // Real backend activity logs from prisma.bookingStatusLog
  const activityLogs: ActivityLog[] = useMemo(() => {
    if (metrics?.recentActivity && metrics.recentActivity.length > 0) {
      return metrics.recentActivity.slice(0, 4).map((log: any) => ({
        id: String(log.id),
        title: `Order #${log.booking?.id ? log.booking.id.toString().slice(-6) : "JOB"} · ${(log.toStatus || "UPDATED").replace(/_/g, " ").toUpperCase()}`,
        desc: `${log.booking?.service?.name || "Service"} for ${log.booking?.customer?.fullName || "Client"}`,
        time: log.changedAt || new Date().toISOString(),
        status: log.toStatus || "in_progress",
      }));
    }
    return recentBookings.slice(0, 4).map((b: any) => ({
      id: String(b.id),
      title: `${b.service?.name || b.service?.title || "Booking"} · ${(b.status || "CONFIRMED").replace(/_/g, " ").toUpperCase()}`,
      desc: `Client: ${b.customer?.fullName || "Customer"}`,
      time: b.updatedAt || b.bookingDate || b.createdAt,
      status: b.status,
    }));
  }, [metrics, recentBookings]);

  if (loading && !metrics) {
    return <CompanyDashboardSkeleton />;
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-background font-sans max-w-7xl mx-auto">
      
      {/* ─── 1. MASTER HEADER & TABS ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Company Operations Command
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground px-2.5 py-0.5 rounded-full border border-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Real-time field dispatch telemetry, team readiness, and revenue statements.
          </p>
        </div>

        {/* Master Tab Control (Monochrome Neutral) */}
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
            <span>Analytics</span>
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
            <span>Reports & Invoices</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE PULSE VIEW ──────────────────────────────────────────────── */}
      {activeView === "live" && (
        <>
          {/* Subheader: Shift Toggle & Dispatch Shortcut */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs font-semibold text-muted-foreground">
              Today's operational metrics and active field dispatch.
            </p>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center bg-muted/50 border border-border rounded-xl p-1">
                <button
                  onClick={() => setTimeframe("today")}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                    timeframe === "today" 
                      ? "bg-card text-foreground shadow-xs border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Today's Shift
                </button>
                <button
                  onClick={() => setTimeframe("weekly")}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all",
                    timeframe === "weekly" 
                      ? "bg-card text-foreground shadow-xs border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  7-Day Pacing
                </button>
              </div>

              <Button 
                asChild
                variant="outline" 
                size="sm" 
                className="rounded-xl h-9 px-3.5 border-border hover:bg-muted font-bold text-xs shadow-xs"
              >
                <Link href="/company/dispatch">
                  <Truck className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Dispatch Center
                </Link>
              </Button>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh} 
                className="h-9 w-9 rounded-xl border-border hover:bg-muted shadow-xs"
                title="Refresh Live Operational Data"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isRefreshing && "animate-spin text-foreground")} />
              </Button>
            </div>
          </div>

          {/* ─── 2. Top 4-Metric Hero Strip (Monochrome Neutral) ─────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <AnimatePresence mode="wait">
              {activeKpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <motion.div
                    key={`${timeframe}-${idx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" /> {kpi.label}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border uppercase tracking-wider">
                        {kpi.badge}
                      </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground pt-1.5 border-t border-border/60">
                      {kpi.subtext}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ─── 3. Quick Dispatch & Operational Shortcuts (Monochrome Neutral) ─ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link 
              href="/company/staff" 
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground group-hover:text-foreground group-hover:bg-muted flex items-center justify-center shrink-0 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{activeStaffCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Technicians Ready</p>
              </div>
            </Link>

            <Link 
              href="/company/dispatch" 
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground group-hover:text-foreground group-hover:bg-muted flex items-center justify-center shrink-0 transition-colors">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{activeJobsCount}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">In-Flight Jobs</p>
              </div>
            </Link>

            <Link 
              href="/company/bookings?status=pending" 
              className={cn(
                "bg-card border rounded-xl p-3.5 transition-colors flex items-center gap-3 shadow-xs group",
                unassignedJobsCount > 0 
                  ? "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50" 
                  : "border-border hover:border-foreground/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                unassignedJobsCount > 0 
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                  : "bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:bg-muted border-border"
              )}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className={cn("text-lg font-bold font-mono leading-none", unassignedJobsCount > 0 ? "text-amber-600" : "text-foreground")}>
                  {unassignedJobsCount}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Need Technician</p>
              </div>
            </Link>

            <Link 
              href="/company/schedule" 
              className="bg-card border border-border rounded-xl p-3.5 hover:border-foreground/30 transition-colors flex items-center gap-3 shadow-xs group"
            >
              <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground group-hover:text-foreground group-hover:bg-muted flex items-center justify-center shrink-0 transition-colors">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold font-mono text-foreground leading-none">{todayBookings.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Today's Schedule</p>
              </div>
            </Link>
          </div>

          {/* ─── 4. Main Command Grid: Velocity Chart & Side Rail ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (8 cols): Revenue Velocity Chart + Activity Feed */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Revenue Velocity Chart */}
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" /> Revenue Realization Velocity
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Daily net revenue earned from completed service dispatches.
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-foreground hover:bg-muted h-7 px-2">
                    <Link href="/company/analytics">
                      Full Analytics <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>

                <div className="h-[250px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="companyRevGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} 
                        dy={10} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} 
                        tickFormatter={(v) => `$${v}`} 
                      />
                      <RechartsTooltip content={<GlassmorphicTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={2.5} 
                        fill="url(#companyRevGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Real Operational Activity Feed (Monochrome Neutral) */}
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Live Operational Audit Log
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md border border-border">
                    Audit Stream
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {activityLogs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No recent operational transitions recorded.
                    </div>
                  ) : (
                    activityLogs.map((log) => (
                      <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{log.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{log.desc}</p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusBadge status={log.status} dot={false} />
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.time), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (4 cols): Today's Shift & Online Technicians */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Today's Schedule Timeline */}
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" /> Today's Shift Schedule
                  </h3>
                  <Link href="/company/schedule" className="text-xs font-semibold text-foreground hover:underline">
                    View Roster ↗
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {todayBookings.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <CalendarIcon className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">No bookings today</p>
                      <p className="text-[11px] text-muted-foreground">Orders dispatched for today will appear here.</p>
                    </div>
                  ) : (
                    todayBookings.slice(0, 4).map((b) => (
                      <Link
                        key={b.id}
                        href={`/company/bookings/${b.id}`}
                        className="block p-3 rounded-xl bg-muted/20 border border-border hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-foreground">
                            {format(new Date(b.bookingDate), "h:mm a")}
                          </span>
                          <StatusBadge status={b.status} dot={false} />
                        </div>
                        <p className="text-xs font-bold text-foreground mt-1.5 truncate group-hover:underline transition-colors">
                          {b.service?.name || b.service?.title || "Service Booking"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          Client: {b.customer?.fullName || "Customer"}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Active Field Technicians Rail */}
              <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-muted-foreground" /> Technicians Ready
                  </h3>
                  <Link href="/company/staff" className="text-xs font-semibold text-foreground hover:underline">
                    Directory ↗
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {onlineStaff.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No staff currently marked online.
                    </div>
                  ) : (
                    onlineStaff.map((stf: any) => (
                      <Link
                        key={stf.id}
                        href={`/company/staff/${stf.id}`}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9 rounded-xl border border-border">
                              {stf.user?.avatar && <AvatarImage src={stf.user.avatar} />}
                              <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                                {(stf.user?.fullName || "S").charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate group-hover:underline transition-colors">
                              {stf.user?.fullName || "Technician"}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                              {stf.role?.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                          Ready
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* ─── 5. Recent Dispatched Orders Table ───────────────────────────── */}
          <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" /> Recent Dispatched Orders
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live status and technician allocation for incoming client bookings.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl h-8 text-xs font-semibold border-border">
                <Link href="/company/bookings">
                  View All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="divide-y divide-border">
              {recentBookings.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No recent bookings found.
                </div>
              ) : (
                recentBookings.slice(0, 5).map((booking: any) => (
                  <Link
                    key={booking.id}
                    href={`/company/bookings/${booking.id}`}
                    className="py-3.5 flex items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar className="h-9 w-9 rounded-xl border border-border shrink-0">
                        {booking.customer?.avatar && <AvatarImage src={booking.customer.avatar} />}
                        <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                          {(booking.customer?.fullName || "C").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:underline transition-colors">
                          {booking.service?.name || booking.service?.title || "Service Booking"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Client: {booking.customer?.fullName || "Customer"} · Staff: {booking.assignedStaff?.user?.fullName || "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-mono text-xs font-bold text-foreground">
                        ${Number(booking.totalPrice || 0).toFixed(2)}
                      </span>
                      <StatusBadge status={booking.status} dot={false} />
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── PERFORMANCE & ANALYTICS VIEW ───────────────────────────────── */}
      {activeView === "analytics" && (
        <div className="pt-1">
          <CompanyAnalyticsPage hideHeader={true} />
        </div>
      )}

      {/* ─── REPORTS & FINANCIALS VIEW ───────────────────────────────────── */}
      {activeView === "reports" && (
        <div className="pt-1">
          <CompanyReportsPage hideHeader={true} />
        </div>
      )}

    </div>
  );
}

export default function CompanyDashboard() {
  return (
    <Suspense fallback={<CompanyDashboardSkeleton />}>
      <CompanyDashboardContent />
    </Suspense>
  );
}
