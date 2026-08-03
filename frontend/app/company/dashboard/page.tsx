"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, CalendarClock, Users, Clock, 
  ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Calendar as CalendarIcon, Activity, ArrowRight, MoreHorizontal, Loader2, Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow, isToday } from "date-fns";

export default function CompanyDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"today" | "weekly">("today");
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, bookingsRes, staffRes] = await Promise.all([
        api.get("/companies/my-company/metrics").catch(() => null),
        api.get("/bookings?limit=10").catch(() => null),
        api.get("/companies/my-company/staff").catch(() => null)
      ]);
      
      if (metricsRes) setMetrics(metricsRes.data.data || metricsRes.data);
      if (bookingsRes) {
        const payload = bookingsRes.data.data || bookingsRes.data;
        setRecentBookings((payload.bookings || []).slice(0, 5));
      }
      if (staffRes) {
        const payload = staffRes.data.data || staffRes.data;
        setStaffList(payload.staff || []);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50/50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const baseRevenue = Number(metrics?.revenue) || 0;
  const revenueData = (metrics?.weeklyData || []).map((d: any) => ({ day: d.day.substring(0,3), revenue: d.actualValue || d.value || 0 }));
  const baseBookings = Number(metrics?.activeBookings) || 0;

  const kpis = {
    today: [
      { label: "Total Revenue", value: `$${baseRevenue.toLocaleString()}`, change: metrics?.revenueGrowth != null ? `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}%` : "—", up: (metrics?.revenueGrowth || 0) >= 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
      { label: "Active Bookings", value: baseBookings.toString(), change: metrics?.bookingsGrowth != null ? `${metrics.bookingsGrowth > 0 ? '+' : ''}${metrics.bookingsGrowth}%` : "—", up: (metrics?.bookingsGrowth || 0) >= 0, icon: CalendarClock, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
      { label: "Staff Online", value: staffList.filter(s => s.status === 'active').length.toString(), change: `${staffList.length} total staff`, up: true, icon: Users, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
      { label: "Avg Rating", value: metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} / 5` : "N/A", change: `${metrics?.totalReviews || 0} reviews`, up: true, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    ],
    weekly: [
      { label: "Total Revenue", value: `$${baseRevenue.toLocaleString()}`, change: metrics?.revenueGrowth != null ? `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}%` : "—", up: (metrics?.revenueGrowth || 0) >= 0, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
      { label: "Active Bookings", value: baseBookings.toString(), change: metrics?.bookingsGrowth != null ? `${metrics.bookingsGrowth > 0 ? '+' : ''}${metrics.bookingsGrowth}%` : "—", up: (metrics?.bookingsGrowth || 0) >= 0, icon: CalendarClock, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
      { label: "Staff Online", value: staffList.filter(s => s.status === 'active').length.toString(), change: `${staffList.length} total staff`, up: true, icon: Users, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
      { label: "Avg Rating", value: metrics?.averageRating ? `${metrics.averageRating.toFixed(1)} / 5` : "N/A", change: `${metrics?.totalReviews || 0} reviews`, up: true, icon: Clock, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    ]
  };

  const activeKpis = kpis[timeframe];
  const onlineStaff = staffList.filter(s => s.status === 'active').slice(0, 4);
  
  // Slice to 3 to keep the dashboard compact vertically
  const activities = recentBookings.slice(0, 3).map(b => ({
    id: b.id,
    type: b.status === 'completed' ? 'completed' : b.status === 'in_progress' ? 'started' : 'booked',
    title: b.status === 'completed' ? 'Job Completed' : b.status === 'in_progress' ? 'Worker Checked In' : 'New Booking',
    desc: `${b.service?.title || 'Service'} for ${b.customer?.fullName || 'Customer'}`,
    date: b.updatedAt || b.createdAt,
    icon: b.status === 'completed' ? CheckCircle2 : b.status === 'in_progress' ? Activity : CalendarClock,
    color: b.status === 'completed' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : b.status === 'in_progress' ? 'text-blue-500 bg-blue-50 border-blue-100' : 'text-indigo-500 bg-indigo-50 border-indigo-100'
  }));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Your business at a glance.</p>
        </div>
        
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
      </div>

      {/* KPIs Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="wait">
          {activeKpis.map((kpi, i) => {
            return (
              <motion.div
                key={`${timeframe}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="bg-background rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="flex justify-between mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                </div>
                
                <div>
                  <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                  {kpi.change !== "—" && (
                    <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {kpi.change}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        
        {/* Revenue Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-background rounded-xl border border-border p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Revenue Performance</h2>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ background: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: '11px', marginBottom: '2px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column Stack */}
        <div className="space-y-5 flex flex-col">
          
          {/* Today's Schedule */}
          <div className="bg-background rounded-xl border border-border p-5 shadow-sm flex-1">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Today's Schedule
            </h2>
            <div className="space-y-3">
              {recentBookings.filter(b => isToday(new Date(b.bookingDate))).length > 0 ? (
                recentBookings.filter(b => isToday(new Date(b.bookingDate))).map((b, i, arr) => (
                  <div key={b.id || i} className="flex gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary relative z-10 mt-1.5" />
                      {i !== arr.length - 1 && <div className="w-px h-full bg-border absolute top-3.5 left-1" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm font-semibold text-foreground leading-none">{format(new Date(b.bookingDate), 'h:mm a')}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{b.service?.title || "Service"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No jobs scheduled today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Online */}
          <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> Staff Online
            </h2>
            <div className="space-y-3">
              {onlineStaff.length > 0 ? onlineStaff.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8 rounded-lg border border-border shadow-sm">
                      <AvatarImage src={member.user?.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">{member.user?.fullName?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">{member.user?.fullName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{member.role?.replace(/_/g, " ")}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-2">No staff online.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Wide Area */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-2 pb-10">
        
        {/* Latest Bookings */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Latest Bookings</h2>
            <Button variant="ghost" onClick={() => router.push('/company/bookings')} className="text-[10px] font-bold text-primary hover:text-primary/80 hover:bg-muted/50 px-2 h-7 rounded-md uppercase tracking-widest">
              View All
            </Button>
          </div>
          <div className="divide-y divide-border/50">
            {recentBookings.slice(0, 3).length > 0 ? recentBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} onClick={() => router.push(`/company/bookings/${booking.id}`)} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer group">
                <Avatar className="h-9 w-9 rounded-xl border border-border shadow-sm shrink-0">
                  <AvatarImage src={booking.customer?.avatar} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">{booking.customer?.fullName?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {booking.service?.title || "Service"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {booking.customer?.fullName || "Customer"} 
                  </p>
                </div>
                <div className="text-right shrink-0 pr-1">
                  <p className="text-sm font-semibold text-foreground">${Number(booking.totalPrice || 0).toFixed(2)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {formatDistanceToNow(new Date(booking.bookingDate), { addSuffix: true })}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            )) : (
              <div className="p-6 text-center text-sm text-muted-foreground">No recent bookings.</div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Activity Feed</h2>
          </div>
          <div className="p-5 space-y-4">
            {activities.length > 0 ? activities.map((act, i) => {
              const Icon = act.icon;
              return (
                <div key={act.id + i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {i !== activities.length - 1 && <div className="w-px h-full bg-border/50 mt-1.5" />}
                  </div>
                  <div className="flex-1 pb-1 pt-0.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground leading-none">{act.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{formatDistanceToNow(new Date(act.date), { addSuffix: true })}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{act.desc}</p>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-4 text-sm text-muted-foreground">No activities to display.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

