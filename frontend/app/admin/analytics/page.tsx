"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, CalendarClock, Users, Building, ArrowUpRight, ArrowDownRight, 
  Target, Download, PieChart as PieChartIcon, Activity, RefreshCw, BarChart3, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/lib/hooks/useAPI";
import { toast } from "sonner";
import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, RadialBarChart, RadialBar
} from "recharts";

// Monochromatic & Quiet-Luxury Token Palette
const QUIET_COLORS = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

const cleanTooltipStyle = {
  backgroundColor: "#ffffff",
  color: "#0f172a",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
  fontSize: "12px",
  fontWeight: 600,
};

export default function AdminAnalyticsPage() {
  const { data, loading, refetch } = useAPI<any>('/api/admin/analytics');
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "bookings" | "marketplace">("overview");
  const [timeframe, setTimeframe] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Analytics metrics updated");
    }, 400);
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      const header = "Metric,Value\n";
      const rows = [
        `"Platform Revenue",${Number(data?.platformRevenue) || 0}`,
        `"Total Bookings",${Number(data?.totalBookings) || 0}`,
        `"Total Companies",${Number(data?.totalCompanies) || 0}`,
        `"Total Users",${Number(data?.totalUsers) || 0}`,
        `"Average Booking Value",${Number(data?.avgBookingValue) || 0}`,
        `"Timeframe",Last ${timeframe} Days`
      ].join("\n");

      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics_summary_${timeframe}d_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${timeframe}-day analytics data successfully.`);
    } catch {
      toast.error("Failed to export analytics report.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-7 h-7 animate-spin text-foreground/90 opacity-60 mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Loading Telemetry & Analytics...</p>
      </div>
    );
  }

  const baseRevenue = Number(data?.platformRevenue) || 0;
  const baseBookings = Number(data?.totalBookings) || 0;
  const activeCompanies = Number(data?.totalCompanies) || 0;
  const activeUsers = Number(data?.totalUsers) || 0;
  const revenueGrowth = Number(data?.revenueGrowth) || 0;
  const bookingsGrowth = Number(data?.bookingsGrowth) || 0;
  const companiesGrowth = Number(data?.companiesGrowth) || 0;
  const usersGrowth = Number(data?.usersGrowth) || 0;
  const conversionRate = Number(data?.conversionRate) || 0;

  const fmtGrowth = (v: number) => `${v >= 0 ? '+' : ''}${v}% vs last month`;

  const overviewKpis = [
    { label: "Platform Revenue", value: baseRevenue >= 1000000 ? `$${(baseRevenue/1000000).toFixed(2)}M` : `$${baseRevenue.toLocaleString()}`, change: fmtGrowth(revenueGrowth), up: revenueGrowth >= 0, icon: TrendingUp },
    { label: "Bookings", value: baseBookings.toLocaleString(), change: fmtGrowth(bookingsGrowth), up: bookingsGrowth >= 0, icon: CalendarClock },
    { label: "Companies", value: activeCompanies.toLocaleString(), change: fmtGrowth(companiesGrowth), up: companiesGrowth >= 0, icon: Building },
    { label: "Users", value: activeUsers.toLocaleString(), change: fmtGrowth(usersGrowth), up: usersGrowth >= 0, icon: Users },
    { label: "Avg Booking Value", value: `$${Number(data?.avgBookingValue || 0).toLocaleString()}`, change: "Per transaction", up: true, icon: Activity },
    { label: "Conversion Rate", value: `${conversionRate}%`, change: "Booking rate", up: true, icon: Target },
  ];

  const monthlyTrendData = (data?.monthlyData || []) as Array<{ name: string; revenue: number; bookings: number; fee?: number; refunds?: number }>;
  const categoryRevenueData = (data?.categoryData || []) as Array<{ name: string; value: number }>;
  const topCompaniesData = (data?.topCompanies || []) as Array<{ name: string; revenue: string; rating: number; completedJobs: number }>;
  const registrationTrend = (data?.registrationTrend || []) as Array<{ name: string; users: number; companies: number }>;
  const statusBreakdown = (data?.statusBreakdown || []) as Array<{ name: string; value: number; color: string }>;
  const categorySaturationData = (data?.categorySaturationData || []) as Array<{ name: string; value: number; fill: string; status: string }>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans bg-background text-foreground">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics & Marketplace Velocity</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">High-fidelity marketplace performance metrics, revenue growth, and conversion trends.</p>
        </div>
        
        <div className="flex items-center gap-2.5">
          <select 
            value={timeframe} 
            onChange={(e) => {
              setTimeframe(e.target.value);
              toast.info(`Timeframe filtered to last ${e.target.value} days`);
            }}
            className="h-8.5 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground/90 outline-none hover:bg-background"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last 12 Months</option>
          </select>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting}
            className="border-border bg-background rounded-lg h-8.5 px-3.5 text-xs font-bold text-foreground/90 hover:bg-background transition-all shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            className="h-8.5 w-8.5 rounded-lg border-border bg-background text-foreground/90 hover:bg-background"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { id: "overview", label: "Executive Overview" },
          { id: "revenue", label: "Revenue & Margins" },
          { id: "bookings", label: "Booking Liquidity" },
          { id: "marketplace", label: "Marketplace Balance" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
              activeTab === tab.id ? "text-foreground font-extrabold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabAnalytics" className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {/* ==================================================================================== */}
          {/* OVERVIEW TAB */}
          {/* ==================================================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {overviewKpis.map((kpi, i) => (
                  <div key={i} className="bg-background rounded-xl border border-border p-4.5 shadow-2xs">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1.5">{kpi.label}</p>
                    <p className="text-xl font-extrabold text-foreground tracking-tight">{kpi.value}</p>
                    <div className={`flex items-center gap-1 mt-1.5 text-[11px] font-semibold ${kpi.up ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Gross Platform Revenue Trend</h2>
                    <span className="text-[11px] text-muted-foreground/70 font-medium">Monthly Gross Volume ($)</span>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevQuiet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={cleanTooltipStyle} />
                        <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#0f172a" strokeWidth={2.5} fill="url(#colorRevQuiet)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90">Booking Volume</h2>
                    <span className="text-[11px] text-muted-foreground/70 font-medium">Completed Jobs</span>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <Tooltip contentStyle={cleanTooltipStyle} />
                        <Bar dataKey="bookings" name="Bookings" fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* REVENUE TAB */}
          {/* ==================================================================================== */}
          {activeTab === "revenue" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-5">Platform Fees vs Refunds Disbursed</h2>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={cleanTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="fee" name="Platform Take-Rate" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Line yAxisId="right" type="monotone" dataKey="refunds" name="Refunds Issued" stroke="#e11d48" strokeWidth={2} dot={{ r: 3.5, fill: "#e11d48" }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-muted-foreground" /> Revenue Distribution
                  </h2>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryRevenueData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                          {categoryRevenueData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={QUIET_COLORS[index % QUIET_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={cleanTooltipStyle} formatter={(val: any) => `${Number(val).toLocaleString()} bookings`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="divide-y divide-border/60 mt-2">
                    {categoryRevenueData.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: QUIET_COLORS[i % QUIET_COLORS.length] }} />
                          <span className="text-xs font-semibold text-muted-foreground">{cat.name}</span>
                        </div>
                        <span className="text-xs font-bold text-foreground">{cat.value} bookings</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* BOOKINGS TAB */}
          {/* ==================================================================================== */}
          {activeTab === "bookings" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-1">Market Category Saturation</h2>
                  <p className="text-xs text-muted-foreground mb-5">Contractor supply vs customer booking request density</p>
                  
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySaturationData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} width={90} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={cleanTooltipStyle} />
                        <Bar dataKey="value" fill="#334155" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-4">Fulfillment Statuses</h2>
                  <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={12} data={statusBreakdown} startAngle={180} endAngle={-180}>
                        <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={6} />
                        <Tooltip contentStyle={cleanTooltipStyle} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-2xl font-black text-foreground">{statusBreakdown.reduce((s, d) => s + d.value, 0)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/60">
                    {statusBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[11px] font-semibold text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* MARKETPLACE TAB */}
          {/* ==================================================================================== */}
          {activeTab === "marketplace" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 bg-background rounded-xl border border-border p-5 shadow-2xs">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-1 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-foreground/90" /> Marketplace Demand vs Provider Supply
                  </h2>
                  <p className="text-xs text-muted-foreground mb-5">Customer registrations compared to verified contractor onboarding</p>
                  
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <Tooltip contentStyle={cleanTooltipStyle} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="users" name="Customers (Demand)" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Line yAxisId="right" type="monotone" dataKey="companies" name="Providers (Supply)" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3.5, fill: "#0f172a" }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-background rounded-xl border border-border p-5 shadow-2xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-3 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-600" /> Top Performing Providers
                    </h2>
                    <div className="divide-y divide-border/60">
                      {topCompaniesData.length === 0 ? (
                        <p className="text-xs text-muted-foreground/70 py-3 text-center">No providers recorded yet</p>
                      ) : topCompaniesData.slice(0, 3).map((co, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-muted-foreground/70">#{i + 1}</span>
                            <span className="text-xs font-bold text-foreground">{co.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-extrabold text-emerald-700 block">{co.revenue}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground/70">{co.completedJobs} jobs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-background rounded-xl border border-border p-5 shadow-2xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-3 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" /> Platform Attention Items
                    </h2>
                    <div className="divide-y divide-border/60">
                      {[
                        { label: "Active Disputes", value: data?.activeDisputes ?? 0, color: "text-rose-700 bg-rose-50 border-rose-200" },
                        { label: "Open Support Tickets", value: data?.openTickets ?? 0, color: "text-amber-700 bg-amber-50 border-amber-200" },
                        { label: "Pending Vetting Approvals", value: data?.pendingCompanies ?? 0, color: "text-foreground/90 bg-background border-border" },
                      ].map((item, i) => (
                        <div key={i} className="py-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${item.color}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
