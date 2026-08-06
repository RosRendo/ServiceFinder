"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, CalendarClock, Users, Building, ArrowUpRight, ArrowDownRight, 
  Target, Download, PieChart as PieChartIcon, Activity, RefreshCw, BarChart3, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/lib/hooks/useAPI";
import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, RadialBarChart, RadialBar
} from "recharts";

// Design tokens
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// NOTE: All chart data is sourced from the real backend analytics API.
// Fallback arrays are used ONLY when the server returns no data (e.g., empty DB).

export default function AdminAnalyticsPage() {
  const { data, loading, refetch } = useAPI<any>('/api/admin/analytics');
  const [activeTab, setActiveTab] = useState<"overview" | "revenue" | "bookings" | "marketplace">("overview");
  const [timeframe, setTimeframe] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary opacity-50 mb-3" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Analytics Dashboard...</p>
      </div>
    );
  }

  // Real data from /api/admin/analytics
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

  // Real chart data from API — empty arrays degrade gracefully
  const monthlyTrendData = (data?.monthlyData || []) as Array<{ name: string; revenue: number; bookings: number }>;
  const categoryRevenueData = (data?.categoryData || []) as Array<{ name: string; value: number }>;
  const topCompaniesData = (data?.topCompanies || []) as Array<{ name: string; revenue: string; rating: number; completedJobs: number }>;
  const registrationTrend = (data?.registrationTrend || []) as Array<{ name: string; users: number; companies: number }>;
  const statusBreakdown = (data?.statusBreakdown || []) as Array<{ name: string; value: number; color: string }>;
  const categorySaturationData = (data?.categorySaturationData || []) as Array<{ name: string; value: number; fill: string; status: string }>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Explore platform trends, growth, and marketplace economics.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-foreground focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last 12 Months</option>
          </select>
          <Button variant="outline" className="border-border rounded-lg h-9 px-4 font-bold transition-all">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
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

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { id: "overview", label: "Overview" },
          { id: "revenue", label: "Revenue" },
          { id: "bookings", label: "Bookings" },
          { id: "marketplace", label: "Marketplace" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? "text-indigo-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabAnalytics" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ==================================================================================== */}
          {/* OVERVIEW TAB */}
          {/* ==================================================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {overviewKpis.map((kpi, i) => (
                  <div key={i} className="bg-background rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                    <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {kpi.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {kpi.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Platform Growth Trend</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Booking Volume</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="bookings" name="Bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Platform Fee vs Refunds */}
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Platform Fees vs Refunds</h2>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val}`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="fee" name="Platform Fees" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line yAxisId="right" type="monotone" dataKey="refunds" name="Refunds Issued" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Revenue by Category */}
                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" /> Revenue by Service
                  </h2>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryRevenueData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                          {categoryRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => `${Number(val).toLocaleString()} bookings`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {categoryRevenueData.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center mt-4">No service data yet</p>
                  ) : (
                  <div className="grid grid-cols-1 gap-3 mt-4">
                     {categoryRevenueData.map((cat, i) => (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                           <span className="text-xs font-bold text-muted-foreground">{cat.name}</span>
                         </div>
                         <span className="text-xs font-bold text-foreground">{cat.value} bookings</span>
                       </div>
                     ))}
                  </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* BOOKINGS TAB */}
          {/* ==================================================================================== */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Category Saturation */}
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-2">Category Saturation</h2>
                  <p className="text-xs font-medium text-muted-foreground mb-6">Provider Supply vs Category Demand</p>
                  
                  <div className="flex items-center justify-between gap-6 h-[250px]">
                    <div className="flex-1 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categorySaturationData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                            {categorySaturationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-1/3 flex flex-col justify-center gap-5">
                      {categorySaturationData.map((cat, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">{cat.name}</span>
                          <span className="text-xs font-bold px-2 py-1 rounded-md border inline-block max-w-fit" style={{ color: cat.fill, backgroundColor: `${cat.fill}15`, borderColor: `${cat.fill}30` }}>
                            {cat.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Booking Status Breakdown (real data) */}
                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Booking Statuses</h2>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={15} data={statusBreakdown} startAngle={180} endAngle={-180}>
                        <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="text-center">
                         <p className="text-3xl font-black text-foreground">{statusBreakdown.reduce((s, d) => s + d.value, 0)}</p>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Total</p>
                       </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                     {statusBreakdown.map((item, i) => (
                       <div key={i} className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                         <span className="text-xs font-bold text-muted-foreground">{item.name}</span>
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
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Marketplace Liquidity */}
                <div className="lg:col-span-7 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> Marketplace Liquidity
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground mb-6">User Demand (Signups) vs Active Supply (Companies)</p>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.registrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="users" name="User Signups (Demand)" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line yAxisId="right" type="monotone" dataKey="companies" name="Active Providers (Supply)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-rows-2 gap-6">
                  {/* Top Companies */}
                  <div className="bg-background rounded-xl border border-border p-5 shadow-sm overflow-hidden flex flex-col">
                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" /> Top Performing Companies
                    </h2>
                    <div className="flex-1 divide-y divide-border/50">
                      {topCompaniesData.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">No data yet</p>
                      ) : topCompaniesData.slice(0, 3).map((company, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground/60">#{i + 1}</span>
                            <span className="text-sm font-bold text-foreground">{company.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-600 block">{company.revenue}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{company.completedJobs} jobs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Avg booking value + open disputes */}
                  <div className="bg-background rounded-xl border border-border p-5 shadow-sm overflow-hidden flex flex-col">
                    <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-500" /> Platform Alerts
                    </h2>
                    <div className="flex-1 divide-y divide-border/50">
                      {[
                        { label: "Open Disputes", value: data?.activeDisputes ?? 0, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
                        { label: "Open Support Tickets", value: data?.openTickets ?? 0, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
                        { label: "Pending Companies", value: data?.pendingCompanies ?? 0, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
                      ].map((alert, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{alert.label}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${alert.color}`}>{alert.value}</span>
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
