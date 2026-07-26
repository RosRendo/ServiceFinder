"use client";

import { useState, useEffect } from "react";
import { TrendingUp, CalendarClock, Users, Clock, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";

const revenueData = [
  { day: "Mon", revenue: 840 }, { day: "Tue", revenue: 1100 }, { day: "Wed", revenue: 920 },
  { day: "Thu", revenue: 1450 }, { day: "Fri", revenue: 1280 }, { day: "Sat", revenue: 1800 },
  { day: "Sun", revenue: 1160 },
];

export default function CompanyDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, bookingsRes] = await Promise.all([
        api.get("/companies/my-company/metrics").catch(() => null),
        api.get("/bookings?status=pending").catch(() => null)
      ]);
      
      if (metricsRes) setMetrics(metricsRes.data.data || metricsRes.data);
      if (bookingsRes) {
        const payload = bookingsRes.data.data || bookingsRes.data;
        setPendingRequests(payload.bookings || []);
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

  const handleStatusChange = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/bookings/${id}/status`, { status });
      toast({ title: "Success", description: `Booking ${status} successfully.` });
      fetchData();
    } catch {
      toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" });
    }
  };

  const kpis = [
    { label: "Today's Revenue", value: metrics?.totalRevenue ? `$${metrics.totalRevenue}` : "$0", change: "+14%", up: true, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Active Bookings", value: metrics?.activeBookings?.toString() || "0", change: "+2", up: true, icon: CalendarClock, color: "text-violet-400" },
    { label: "Completed Jobs", value: metrics?.completedJobs?.toString() || "0", change: "+0", up: true, icon: CheckCircle2, color: "text-blue-400" },
    { label: "Avg Rating", value: metrics?.averageRating ? `${metrics.averageRating} / 5` : "N/A", change: "0", up: true, icon: Clock, color: "text-amber-400" },
  ];

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-background border border-border rounded-xl animate-pulse" />)
        ) : (
          kpis.map((kpi) => (
            <div key={kpi.label} className="bg-background border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${kpi.up ? "text-emerald-400" : "text-red-400"}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Revenue Chart */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Revenue — Last 7 Days</h2>
            <p className="text-xs text-muted-foreground mt-0.5">$8,550 this week · Next payout in 3 days</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> +11% vs last week</span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="companyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#companyGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-background border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Incoming Requests</h2>
          <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">{pendingRequests.length} pending</span>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No pending requests right now.</div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div 
                key={req.id} 
                onClick={() => router.push(`/company/bookings/${req.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl border border-border hover:border-violet-500/30 transition-colors cursor-pointer group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-violet-500 transition-colors">#{req.id.slice(-4)} · {req.customer?.fullName}</p>
                  <p className="text-xs text-muted-foreground">{req.service?.name} · {new Date(req.bookingDate).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">${Number(req.totalPrice).toFixed(2)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => handleStatusChange(e, req.id, "confirmed")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button onClick={(e) => handleStatusChange(e, req.id, "cancelled")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
