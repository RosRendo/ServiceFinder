"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, CalendarClock, ArrowUpRight, ArrowDownRight, 
  Target, Download, PieChart as PieChartIcon, ShieldCheck, Activity, 
  Trophy, BarChart3, RefreshCw, Briefcase, Star, Clock, AlertCircle,
  CheckCircle2, Wallet, Award, Sparkles, UserCheck, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

// Refined Palette aligned with unified design tokens (works in light & dark modes)
const PALETTE = [
  "hsl(var(--foreground))",
  "hsl(var(--muted-foreground))",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
];

const STATUS_COLORS: Record<string, string> = {
  Completed: "#10b981",
  "In Progress": "#3b82f6",
  Confirmed: "#6366f1",
  Pending: "#8b5cf6",
  Cancelled: "hsl(var(--muted-foreground))",
};

interface MetricState {
  revenue: number;
  activeBookings: number;
  completedCount: number;
  completionRate: number;
  averageRating: number;
  totalReviews: number;
  escrowBalance: number;
  availableBalance: number;
  weeklyData: Array<{ day: string; value: number; label: string }>;
  serviceBreakdown: Array<{ name: string; value: number }>;
  statusDistribution: Array<{ name: string; value: number; fill: string }>;
  statusCounts: Record<string, number>;
}

interface RevenueState {
  kpis: Array<{ label: string; value: string; up: boolean; pct: string }>;
  trendData: Array<{ day: string; gross: number; net: number }>;
  breakdown: {
    gross: number;
    platformFee: number;
    staffPayout: number;
    discounts: number;
    refunds: number;
    net: number;
  };
  serviceData: Array<{ name: string; revenue: number; percentage: number }>;
  staffData: Array<{
    id: string;
    name: string;
    avatar?: string;
    jobs: number;
    revenue: number;
    rating: number;
    badge?: string | null;
  }>;
}

// Unified Glassmorphic Tooltip for Recharts
function GlassmorphicTooltip({ active, payload, label, prefix = "$" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl p-3 text-xs space-y-1.5 min-w-[140px]">
        <p className="font-bold text-foreground border-b border-border/60 pb-1 font-mono">{label}</p>
        {payload.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}:
            </span>
            <span className="font-bold text-foreground font-mono">
              {prefix}{Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function CompanyAnalyticsPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "staff" | "services" | "reviews">("overview");
  const [timeframe, setTimeframe] = useState<"7" | "30" | "90" | "365">("30");

  const [metrics, setMetrics] = useState<MetricState | null>(null);
  const [revenue, setRevenue] = useState<RevenueState | null>(null);

  const loadData = async (silent = false): Promise<boolean> => {
    if (!silent) setLoading(true);
    try {
      const [metricsRes, revenueRes] = await Promise.allSettled([
        api.get("/companies/my-company/metrics"),
        api.get("/companies/my-company/revenue"),
      ]);

      if (metricsRes.status === "fulfilled") {
        setMetrics(metricsRes.value.data?.data || metricsRes.value.data);
      }
      if (revenueRes.status === "fulfilled") {
        setRevenue(revenueRes.value.data?.data || revenueRes.value.data);
      }

      const anySuccess =
        metricsRes.status === "fulfilled" || revenueRes.status === "fulfilled";
      if (!anySuccess) {
        throw new Error("All analytics requests failed");
      }
      return anySuccess;
    } catch {
      toast({
        title: "Error Loading Analytics",
        description: "Failed to fetch analytics datasets.",
        variant: "destructive",
      });
      return false;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const ok = await loadData(true);
    if (ok) {
      toast({
        title: "Data Refreshed",
        description: "Business analytics synced with live operations.",
      });
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportCSV = () => {
    if (!metrics && !revenue) return;
    const rows = [
      ["Metric", "Value"],
      ["Gross Revenue", `$${(revenue?.breakdown?.gross ?? metrics?.revenue ?? 0).toFixed(2)}`],
      ["Net Earnings", `$${(revenue?.breakdown?.net ?? 0).toFixed(2)}`],
      ["Platform Fee", `$${(revenue?.breakdown?.platformFee ?? 0).toFixed(2)}`],
      ["Completed Bookings", `${metrics?.completedCount ?? 0}`],
      ["Active Bookings", `${metrics?.activeBookings ?? 0}`],
      ["Fulfillment Rate", metrics?.completionRate != null ? `${metrics.completionRate}%` : "No data"],
      ["Average Rating", metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} / 5.0` : "No data"],
      ["Total Reviews", `${metrics?.totalReviews ?? 0}`],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `company-analytics-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Report Exported", description: "CSV analytics report downloaded." });
  };

  // Real metrics only — no synthesized values
  const totalGross = Number(revenue?.breakdown?.gross ?? metrics?.revenue ?? 0);
  const totalNet = revenue?.breakdown?.net != null ? Number(revenue.breakdown.net) : null;
  const activeBookings = Number(metrics?.activeBookings ?? 0);
  const completedCount = Number(metrics?.completedCount ?? 0);
  const completionRate = metrics?.completionRate;
  const averageRating = metrics?.averageRating ? Number(metrics.averageRating) : null;
  const totalReviews = Number(metrics?.totalReviews ?? 0);

  // Daily trend
  const trendData = useMemo(() => {
    if (revenue?.trendData && revenue.trendData.length > 0) {
      return revenue.trendData;
    }
    return [];
  }, [revenue]);

  // Status breakdown
  const statusList = useMemo(() => {
    if (metrics?.statusDistribution && metrics.statusDistribution.length > 0) {
      return metrics.statusDistribution;
    }
    return [
      { name: "Completed", value: completedCount || 1, fill: STATUS_COLORS.Completed },
      { name: "In Progress", value: metrics?.statusCounts?.in_progress || 0, fill: STATUS_COLORS["In Progress"] },
      { name: "Confirmed", value: metrics?.statusCounts?.confirmed || 0, fill: STATUS_COLORS.Confirmed },
      { name: "Pending", value: metrics?.statusCounts?.pending || 0, fill: STATUS_COLORS.Pending },
      { name: "Cancelled", value: metrics?.statusCounts?.cancelled || 0, fill: STATUS_COLORS.Cancelled },
    ];
  }, [metrics, completedCount]);

  const totalStatusVolume = statusList.reduce((acc, curr) => acc + curr.value, 0) || 1;

  // Services breakdown (real revenue data only)
  const servicesList = useMemo(() => {
    if (revenue?.serviceData && revenue.serviceData.length > 0) {
      return revenue.serviceData;
    }
    return [];
  }, [revenue]);

  // Staff leaderboard
  const staffList = useMemo(() => {
    if (revenue?.staffData && revenue.staffData.length > 0) {
      return revenue.staffData;
    }
    return [];
  }, [revenue]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-background gap-3">
        <RefreshCw className="w-7 h-7 animate-spin text-muted-foreground opacity-60" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aggregating Business Intelligence...</p>
      </div>
    );
  }

  return (
    <div className={cn("h-full overflow-y-auto space-y-6 bg-background font-sans max-w-7xl mx-auto", !hideHeader ? "p-4 sm:p-6 lg:p-8" : "p-0 pt-1")}>
      
      {/* ─── 1. TOP HEADER & CONTROLS ────────────────────────────────────────── */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4", !hideHeader && "border-b border-border")}>
        {!hideHeader ? (
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Executive Analytics
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                Live BI
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time financial performance, fulfillment velocity, and workforce metrics.
            </p>
          </div>
        ) : (
          <p className="text-xs font-semibold text-muted-foreground">
            Aggregate revenue pacing, pipeline stages, and staff performance.
          </p>
        )}

        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          {/* Unified Segmented Timeframe Selector (disabled — API retraining not yet supported) */}
          <div
            className="flex items-center bg-muted/50 border border-border rounded-xl p-1 shadow-xs opacity-60 pointer-events-none select-none"
            title="Coming soon"
          >
            {(["7", "30", "90", "365"] as const).map((t) => (
              <button
                key={t}
                disabled
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-not-allowed",
                  timeframe === t
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "7" ? "7D" : t === "30" ? "30D" : t === "90" ? "90D" : "365D"}
              </button>
            ))}
          </div>

          {/* Export Report */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV} 
            className="rounded-xl h-9 px-3.5 border-border hover:bg-muted font-bold text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export CSV
          </Button>

          {/* Live Sync Refresh */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh} 
            className="h-9 w-9 rounded-xl border-border hover:bg-muted shadow-xs"
            title="Refresh Live Data"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isRefreshing && "animate-spin text-foreground")} />
          </Button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE KPI RIBBON ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Gross Revenue */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" /> Gross Volume
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border uppercase tracking-wider">
              All Time
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
            ${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/60">
            <span>Net Take-Home:</span>
            {totalNet != null ? (
              <span className="font-bold font-mono text-foreground">
                ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="font-bold text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {/* Card 2: Completed Orders */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" /> Completed Orders
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border uppercase tracking-wider">
              {completionRate != null ? `${completionRate}% Rate` : "No Data"}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
            {completedCount.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/60">
            <span>Fulfillment Quality:</span>
            <span className="font-bold text-foreground">{completionRate != null ? `${completionRate}% On-Time` : "—"}</span>
          </div>
        </div>

        {/* Card 3: Active Pipeline */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" /> Active Queue
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border uppercase tracking-wider">
              In-Flight
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
            {activeBookings}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/60">
            <span>Dispatch Readiness:</span>
            <span className="font-bold text-foreground">Operational</span>
          </div>
        </div>

        {/* Card 4: Customer Rating */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs relative overflow-hidden space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-muted-foreground" /> Customer CSAT
            </span>
            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border uppercase tracking-wider">
              Verified
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold font-mono text-foreground tracking-tight">
              {averageRating != null ? averageRating.toFixed(1) : "—"}
            </p>
            <span className="text-xs text-muted-foreground font-semibold">/ 5.0</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/60">
            <span>Verified Ratings:</span>
            <span className="font-bold font-mono text-foreground">{totalReviews}</span>
          </div>
        </div>

      </div>

      {/* ─── 3. TAB NAVIGATION STRIP (Segmented / Quiet Luxury) ─────────────── */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto custom-scrollbar pb-2">
        {[
          { id: "overview", label: "Overview & Revenue", icon: Activity },
          { id: "bookings", label: "Fulfillment & Pipeline", icon: CalendarClock },
          { id: "staff", label: "Workforce Leaderboard", icon: Trophy },
          { id: "services", label: "Service Catalog Share", icon: Briefcase },
          { id: "reviews", label: "Customer CSAT & Reviews", icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "relative flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap",
                isActive 
                  ? "bg-card text-foreground shadow-xs border border-border" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 4. TAB CONTENTS ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW & REVENUE VELOCITY
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 8 Cols: Refined Area Chart */}
                <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" /> Revenue Realization Velocity
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gross customer volume vs. net retained company earnings.
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full bg-foreground" /> Gross Volume
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net Profit
                      </span>
                    </div>
                  </div>

                  <div className="h-[280px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grossGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
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
                          dataKey="gross" 
                          name="Gross Volume" 
                          stroke="hsl(var(--foreground))" 
                          strokeWidth={2} 
                          fill="url(#grossGradient)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="net" 
                          name="Net Earnings" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          fill="url(#netGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right 4 Cols: Financial Profitability Breakdown */}
                <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border pb-3 mb-4 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground" /> Capital Allocation
                    </h3>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-semibold">Gross Client Billing</span>
                        <span className="font-bold text-foreground font-mono">${totalGross.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-semibold">Platform Fee Deduction</span>
                        {revenue?.breakdown?.platformFee != null ? (
                          <span className="font-bold text-rose-500 font-mono">-${Number(revenue.breakdown.platformFee).toFixed(2)}</span>
                        ) : (
                          <span className="font-bold text-muted-foreground font-mono">—</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-semibold">Workforce Payout Estimate</span>
                        {revenue?.breakdown?.staffPayout != null ? (
                          <span className="font-bold text-muted-foreground font-mono">-${Number(revenue.breakdown.staffPayout).toFixed(2)}</span>
                        ) : (
                          <span className="font-bold text-muted-foreground font-mono">—</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-border font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Net Retained Margin</span>
                        {totalNet != null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 text-base font-mono font-bold">${totalNet.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground text-base font-mono font-bold">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Escrow & Available Balance Pill */}
                  <div className="bg-muted/30 border border-border rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-bold">Escrow In-Transit:</span>
                      <span className="font-bold text-foreground font-mono">${Number(metrics?.escrowBalance ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-bold">Available for Payout:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">${Number(metrics?.availableBalance ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Quick Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Top Performer Spotlight */}
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Field Technician</p>
                    <p className="text-sm font-bold text-foreground truncate mt-0.5">
                      {staffList[0]?.name || "No staff data yet"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {staffList[0]
                        ? `${staffList[0].jobs} orders completed · $${Number(staffList[0].revenue).toFixed(2)} volume`
                        : "Staff metrics populate as orders complete"}
                    </p>
                  </div>
                </div>

                {/* Primary Revenue Driver */}
                <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0">
                    <Briefcase className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Revenue Category</p>
                    <p className="text-sm font-bold text-foreground truncate mt-0.5">
                      {servicesList[0]?.name || "No service revenue data yet"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {servicesList[0]?.percentage != null
                        ? `${Math.round(servicesList[0].percentage)}% of total volume`
                        : "Populates as completed orders accumulate"}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: FULFILLMENT & PIPELINE
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "bookings" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Status Donut Distribution */}
              <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <PieChartIcon className="w-4 h-4 text-muted-foreground" /> Booking Status Pipeline
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Real-time distribution of jobs across lifecycle stages.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-6 py-2">
                  <div className="sm:col-span-6 h-[220px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={statusList} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={95} 
                          paddingAngle={3} 
                          dataKey="value" 
                          stroke="none"
                        >
                          {statusList.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<GlassmorphicTooltip prefix="" />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold font-mono text-foreground">{totalStatusVolume}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Jobs</span>
                    </div>
                  </div>

                  <div className="sm:col-span-6 space-y-2.5">
                    {statusList.map((s) => {
                      const pct = Math.round((s.value / totalStatusVolume) * 100);
                      return (
                        <div key={s.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold flex items-center gap-1.5 text-foreground">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                              {s.name}
                            </span>
                            <span className="font-mono text-muted-foreground font-semibold">
                              {s.value} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.fill }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Day-of-Week Fulfillment Velocity */}
              <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" /> Weekly Fulfillment Velocity
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue realized across day-of-week slots.
                  </p>
                </div>

                <div className="h-[220px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} />
                      <RechartsTooltip content={<GlassmorphicTooltip />} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                      <Bar dataKey="gross" name="Volume" fill="hsl(var(--foreground))" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: WORKFORCE LEADERBOARD
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "staff" && (
            <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-muted-foreground" /> Technician Performance & Production
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Individual field productivity, verified client ratings, and generated volume.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border uppercase tracking-wider">
                  {staffList.length} Active Staff
                </span>
              </div>

              {staffList.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <UserCheck className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-bold text-foreground">No staff performance data yet</p>
                  <p className="text-xs text-muted-foreground">Staff metrics populate as assigned orders are completed.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {staffList.map((staff, idx) => (
                    <div key={staff.id || idx} className="py-3 flex items-center justify-between gap-4 hover:bg-muted/20 px-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-6 text-center font-bold text-xs text-muted-foreground font-mono">
                          #{idx + 1}
                        </span>
                        <Avatar className="h-9 w-9 rounded-xl border border-border shrink-0">
                          {staff.avatar && <AvatarImage src={staff.avatar} />}
                          <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                            {staff.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{staff.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {staff.jobs} completed orders
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-1 text-foreground text-xs font-bold bg-muted px-2 py-0.5 rounded-md border border-border font-mono">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {staff.rating.toFixed(1)}
                        </div>
                        <div className="text-right min-w-[90px]">
                          <p className="text-xs font-bold text-foreground font-mono">
                            ${Number(staff.revenue).toFixed(2)}
                          </p>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Revenue</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: SERVICE CATALOG SHARE
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "services" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Donut Distribution */}
              <div className="lg:col-span-6 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <PieChartIcon className="w-4 h-4 text-muted-foreground" /> Service Category Share
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Proportionate revenue breakdown across offerings.
                  </p>
                </div>

                <div className="h-[250px] w-full relative flex items-center justify-center">
                  {servicesList.length === 0 ? (
                    <div className="text-center space-y-1.5 py-10">
                      <Briefcase className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm font-bold text-foreground">No service revenue data yet</p>
                      <p className="text-xs text-muted-foreground">Populates as completed orders accumulate.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={servicesList} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={70} 
                        outerRadius={100} 
                        paddingAngle={3} 
                        dataKey="revenue" 
                        stroke="none"
                      >
                        {servicesList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<GlassmorphicTooltip />} />
                    </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Service Ranking List */}
              <div className="lg:col-span-6 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground" /> Ranked Service Offerings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Detailed volume and revenue per service.
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {servicesList.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground">
                      No per-service revenue recorded yet.
                    </div>
                  ) : (
                    servicesList.map((svc, idx) => (
                      <div key={svc.name} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-3 h-3 rounded-md shrink-0"
                            style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{svc.name}</p>
                            <p className="text-[11px] text-muted-foreground">{Math.round(svc.percentage)}% of total volume</p>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground shrink-0">
                          ${Number(svc.revenue).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5: CUSTOMER CSAT & REVIEWS
             ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "reviews" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CSAT Score Card */}
              <div className="lg:col-span-5 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                    <Star className="w-4 h-4 text-muted-foreground" /> Customer Satisfaction Index
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aggregate feedback from completed service jobs.
                  </p>
                </div>

                <div className="text-center py-4 space-y-2">
                  <p className="text-5xl font-bold font-mono text-foreground tracking-tight">
                    {averageRating != null ? averageRating.toFixed(1) : "—"}
                  </p>
                  <div className="flex justify-center items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn("w-4 h-4", averageRating != null && s <= Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {totalReviews > 0
                      ? `Calculated from ${totalReviews} verified review${totalReviews === 1 ? "" : "s"}`
                      : "No verified reviews yet"}
                  </p>
                </div>
              </div>

              {/* Quality Rating Breakdown — unavailable until per-attribute review data exists */}
              <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Service Quality Attributes
                </h3>

                <div className="py-12 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm font-bold text-foreground">No attribute breakdown available yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Quality metrics require per-attribute review data, which is not collected yet. Only aggregate ratings are shown here.
                  </p>
                </div>
              </div>

            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
