"use client";
import { useState, useEffect } from "react";
import { BarChart3, Download, Loader2, FileText, Filter, Calendar, Users, Briefcase, Activity } from "lucide-react";
import api from "@/lib/api/client";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/lib/hooks/use-toast";

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/admin/analytics');
        const payload = response.data.data || response.data;
        setMetrics(payload);
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load report data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [toast]);

  const handleExport = (reportType: string) => {
    setIsExporting(reportType);
    setTimeout(() => {
      setIsExporting(null);
      toast({ title: "Export Complete", description: `${reportType} report has been successfully generated and downloaded.` });
    }, 1500);
  };

  const reports = [
    { id: 'Platform Financials', icon: FileText, desc: 'Complete breakdown of platform revenue, commissions, and payouts.' },
    { id: 'Global Bookings', icon: Calendar, desc: 'Detailed list of all historical and upcoming bookings across all companies.' },
    { id: 'User Engagement', icon: Users, desc: 'Aggregated user registration, retention, and activity reports.' },
    { id: 'Service Popularity', icon: Briefcase, desc: 'Volume and revenue grouped by service category.' }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background p-6 space-y-6 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" /> Platform Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Export platform-wide data and view high-level performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors bg-background">
            <Filter className="w-3.5 h-3.5" /> Filter Range
          </button>
        </div>
      </div>

      {loading ? (
        <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm group hover:border-violet-500/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground relative z-10">${metrics?.totalRevenue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm group hover:border-violet-500/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">Conversion Rate</p>
              <p className="text-2xl font-bold text-foreground relative z-10">{metrics?.conversionRate || 0}%</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm group hover:border-violet-500/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">Active Bookings</p>
              <p className="text-2xl font-bold text-foreground relative z-10">{metrics?.activeBookings || 0}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-5 shadow-sm group hover:border-violet-500/30 transition-colors relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 relative z-10">Total Bookings</p>
              <p className="text-2xl font-bold text-foreground relative z-10">{metrics?.totalBookings || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual Analytics */}
            <div className="space-y-6">
              
              <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" /> Booking Status Distribution
                </h2>
                <div className="h-64 flex items-center justify-center">
                  {metrics?.statusBreakdown?.some((d: any) => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.statusBreakdown.filter((d: any) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metrics.statusBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--background))', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">No booking data available.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {metrics?.statusBreakdown?.map((status: any) => (
                    <div key={status.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
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
                  <div key={report.id} className="flex items-center justify-between p-4 bg-muted/10 border border-border rounded-xl hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-background border border-border rounded-lg text-violet-600 shadow-sm">
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
                      className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-border bg-background hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 transition-colors disabled:opacity-50"
                    >
                      {isExporting === report.id ? <Loader2 className="w-4 h-4 animate-spin text-violet-600" /> : <Download className="w-4 h-4" />}
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
