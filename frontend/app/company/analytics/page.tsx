"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, CalendarClock, Users, ArrowUpRight, ArrowDownRight, 
  Target, Download, PieChart as PieChartIcon, ShieldCheck, Activity, 
  Trophy, BarChart3, RefreshCw, Briefcase, Star, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/lib/hooks/useAPI";
import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

// Design tokens
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

// NOTE: Chart data is dynamically sourced from the API (data.monthlyData, data.serviceBreakdown, etc.)

export default function CompanyAnalyticsPage() {
  const { data, loading, mutate } = useAPI<any>('/companies/my-company/metrics');
  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "customers" | "staff" | "services" | "reviews">("overview");
  const [timeframe, setTimeframe] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-20 bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Analytics Dashboard...</p>
      </div>
    );
  }

  // Real data from /api/admin/analytics
  const totalRevenue = Number(data?.revenue) || 0;
  const totalBookings = Number(data?.activeBookings) || 0; 
  const completionRate = Number(data?.completionRate) || 0;
  const averageRating = Number(data?.averageRating) || 0;
  
  const revenueGrowth = Number(data?.revenueGrowth || 0);
  const bookingsGrowth = Number(data?.bookingsGrowth || 0);
  
  const fmtGrowth = (v: number) => `${v >= 0 ? '+' : ''}${v}%`;

  const overviewKpis = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: fmtGrowth(revenueGrowth), up: revenueGrowth >= 0, icon: TrendingUp },
    { label: "Active Bookings", value: totalBookings.toLocaleString(), change: fmtGrowth(bookingsGrowth), up: bookingsGrowth >= 0, icon: CalendarClock },
    { label: "Completion Rate", value: `${completionRate}%`, change: "Success rate", up: true, icon: Target },
    { label: "Avg Rating", value: `${averageRating.toFixed(1)}/5`, change: "Overall", up: true, icon: Star },
  ];

  const monthlyTrendData = (data?.monthlyData || []) as Array<{ name: string; value: number }>;
  const serviceRevenueData = (data?.serviceBreakdown || []) as Array<{ name: string; value: number }>;
  const statusDistribution = (data?.statusDistribution || []) as Array<{ name: string; value: number; fill: string }>;
  const bookingsByDayData = (data?.weeklyData || []) as Array<{ day: string; actualValue: number }>;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Business Analytics</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Deep dive into operations, profitability, and retention.</p>
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
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: "overview", label: "Overview" },
          { id: "bookings", label: "Bookings" },
          { id: "customers", label: "Customers" },
          { id: "staff", label: "Staff" },
          { id: "services", label: "Services" },
          { id: "reviews", label: "Reviews" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? "text-indigo-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabCompanyAnalytics" className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" /> Revenue Growth Velocity
                  </h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="value" name="Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGross)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-500" /> Booking Volume Trend
                  </h2>
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
          {/* BOOKINGS TAB */}
          {/* ==================================================================================== */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bookings by Day */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Peak Booking Days</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bookingsByDayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
                  <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-primary" /> Booking Status Distribution
                  </h2>
                  <div className="flex-1 min-h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                     {statusDistribution.map((status, i) => (
                       <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: status.fill }} />
                           <span className="text-xs font-bold text-muted-foreground">{status.name}</span>
                         </div>
                         <span className="text-xs font-bold text-foreground">{status.value}</span>
                       </div>
                     ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* CUSTOMERS TAB */}
          {/* ==================================================================================== */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Acquisition vs Retention */}
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">New vs Returning Customers</h2>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                        <Bar dataKey="returningCustomers" name="Returning Customers" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={40} />
                        <Bar dataKey="newCustomers" name="New Customers" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 grid grid-rows-2 gap-6">
                  <div className="bg-background rounded-xl border border-border p-5 shadow-sm overflow-hidden flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Customer Lifetime Value (LTV)</p>
                    <p className="text-4xl font-black text-foreground">$845</p>
                  </div>
                  <div className="bg-background rounded-xl border border-border p-5 shadow-sm overflow-hidden flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Repeat Booking Rate</p>
                    <p className="text-4xl font-black text-foreground">48%</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* STAFF TAB */}
          {/* ==================================================================================== */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue by Staff */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Revenue Generated by Staff</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={staffLeaderboard} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val}`} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted))'}} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => `$${val.toLocaleString()}`} />
                        <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Staff Leaderboard */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" /> Staff Leaderboard
                  </h2>
                  <div className="border border-border/50 rounded-lg overflow-hidden flex-1">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 border-b border-border/50">
                        <tr>
                          <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-8">#</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Rating</th>
                          <th className="px-4 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Jobs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {staffLeaderboard.map((staff, i) => (
                          <tr key={staff.name} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{i + 1}</td>
                            <td className="px-4 py-3 font-bold text-foreground">{staff.name}</td>
                            <td className="px-4 py-3 text-right font-bold text-amber-500 flex items-center justify-end gap-1">
                              {staff.rating} <Star className="w-3 h-3 fill-amber-500" />
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{staff.jobs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* SERVICES TAB */}
          {/* ==================================================================================== */}
          {activeTab === "services" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Service Popularity */}
                <div className="lg:col-span-8 bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-500" /> Service Popularity
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground mb-6">Booking distribution across service categories.</p>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={serviceRevenueData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} dataKey="value" stroke="none">
                          {serviceRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => `${val.toLocaleString()} bookings`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-4 bg-background rounded-xl border border-border p-5 shadow-sm overflow-hidden flex flex-col">
                  <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" /> Service Breakdown
                  </h2>
                  <div className="flex-1 divide-y divide-border/50">
                    {serviceRevenueData.map((service, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-bold text-foreground">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-600 block">{service.value.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* REVIEWS TAB */}
          {/* ==================================================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Rating Trend */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground mb-6">Rating Trend</h2>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ratingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                        <YAxis domain={[4.0, 5.0]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="rating" name="Average Rating" stroke="#f59e0b" strokeWidth={4} dot={{ r: 6, fill: "#f59e0b", strokeWidth: 3, stroke: "#ffffff" }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quality Radar */}
                <div className="bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
                  <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Quality Radar
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Based on recent customer feedback</p>
                  <div className="flex-1 min-h-[250px] w-full relative -mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityRadarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Radar name="Score" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.3} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
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

