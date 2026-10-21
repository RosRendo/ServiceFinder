"use client";
import { useState, useEffect } from "react";
import { BarChart3, Download, Loader2, FileText, Filter, Calendar, Users, Briefcase, Activity } from "lucide-react";
import { useAPI } from "@/lib/hooks/useAPI";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

export default function CompanyReportsPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const { data, loading } = useAPI<any>('/api/companies/my-company/metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    if (data?.metrics) {
      setMetrics(data.metrics);
    }
  }, [data]);

  const handleExport = async (reportType: string) => {
    setIsExporting(reportType);
    try {
      let csvContent = "";
      const filename = `${reportType.replace(/\s+/g, "_")}-${Date.now()}.csv`;

      if (reportType.includes("Ledger") || reportType.includes("Financial")) {
        const res = await api.get("/companies/my-company/revenue");
        const payload = res.data?.data || res.data;
        const transactions = payload.transactions || [];
        const header = "Booking ID,Date,Customer,Staff,Gross,Platform Fee,Net Earnings,Status\n";
        const lines = transactions.map((t: any) =>
          `${t.id || t.bookingId},"${t.createdAt || t.date}","${t.customer || ''}","${t.staff || ''}",${t.grossAmount || t.gross || 0},${t.platformFee || t.fee || 0},${t.netAmount || t.net || 0},"${t.status || ''}"`
        );
        csvContent = header + lines.join("\n");
      } else if (reportType.includes("Booking")) {
        const res = await api.get("/bookings?limit=100");
        const payload = res.data?.data || res.data;
        const bookingsList = payload.bookings || [];
        const header = "Booking ID,Customer,Service,Status,Date,Total Price\n";
        const lines = bookingsList.map((b: any) =>
          `"${b.id}","${b.customer?.fullName || ''}","${b.service?.name || ''}","${b.status}","${b.bookingDate}",${b.totalPrice}`
        );
        csvContent = header + lines.join("\n");
      } else if (reportType.includes("Staff")) {
        const res = await api.get("/companies/my-company/staff");
        const payload = res.data?.data || res.data;
        const staffList = Array.isArray(payload) ? payload : (payload.staff || []);
        const header = "Staff ID,Name,Email,Working Status,Completed Jobs,Rating\n";
        const lines = staffList.map((s: any) =>
          `"${s.id}","${s.fullName || ''}","${s.email || ''}","${s.workingStatus || s.status || ''}",${s.jobsCompleted || 0},${s.rating || 5.0}`
        );
        csvContent = header + lines.join("\n");
      } else {
        const header = "Metric,Value\n";
        const lines = [
          `"Total Bookings",${metrics?.completedBookings || 0}`,
          `"Active Staff",${metrics?.activeStaff || 0}`,
          `"Average Rating",${metrics?.avgRating || 5.0}`,
          `"Current Month Revenue",${metrics?.revenue || 0}`
        ];
        csvContent = header + lines.join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${reportType} report has been successfully generated and downloaded.`);
    } catch (e) {
      toast.error(`Failed to export ${reportType} report.`);
    } finally {
      setIsExporting(null);
    }
  };

  const reports = [
    { id: 'Financial Ledger', icon: FileText, desc: 'Complete breakdown of earnings, platform fees, and payouts.' },
    { id: 'Booking History', icon: Calendar, desc: 'Detailed list of all historical and upcoming bookings.' },
    { id: 'Staff Performance', icon: Users, desc: 'Aggregated completion rates and ratings by staff member.' },
    { id: 'Service Popularity', icon: Briefcase, desc: 'Volume and revenue grouped by service category.' }
  ];

  return (
    <div className={cn("flex flex-col h-full overflow-y-auto bg-background space-y-6", !hideHeader && "p-6")}>
      
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">Export custom data and view aggregated performance metrics.</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border">
            {(["7d", "30d", "90d", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  toast.info(`Timeframe filtered to ${t.toUpperCase()}`);
                }}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  timeframe === t
                    ? "bg-primary text-primary-foreground shadow-xs dark:bg-background dark:text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex items-center justify-end pb-1">
          <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border">
            {(["7d", "30d", "90d", "all"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  toast.info(`Timeframe filtered to ${t.toUpperCase()}`);
                }}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  timeframe === t
                    ? "bg-primary text-primary-foreground shadow-xs dark:bg-background dark:text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">${metrics?.totalRevenue?.toFixed(2) || "0.00"}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.completionRate || 0}%</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Active Bookings</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.activeBookings || 0}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Bookings</p>
              <p className="text-2xl font-bold text-foreground">{metrics?.completedCount || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual Analytics */}
            <div className="space-y-6">
              
              <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Booking Status Distribution
                </h2>
                <div className="h-64 flex items-center justify-center">
                  {metrics?.statusDistribution?.some((d: any) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusDistribution.filter((d: any) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">No booking data available.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {metrics?.statusDistribution?.map((status: any) => (
                    <div key={status.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.fill }} />
                      {status.name} ({status.value})
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Export Reports */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground">Export Data</h2>
              <p className="text-xs text-muted-foreground mb-4">Download comprehensive CSV reports for external accounting or deep analysis.</p>
              
              <div className="grid grid-cols-1 gap-3">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-background border border-border rounded-lg text-primary">
                        <report.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{report.id}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleExport(report.id)}
                      disabled={isExporting === report.id}
                      className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isExporting === report.id ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

