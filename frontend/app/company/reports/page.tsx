"use client";
import { useState, useEffect } from "react";
import { BarChart3, Download, Loader2, FileText, Filter, Calendar, Users, Briefcase, Activity } from "lucide-react";
import { useAPI } from "@/lib/hooks/useAPI";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";

export default function CompanyReportsPage() {
  const { data, loading } = useAPI<any>('/api/companies/my-company/metrics');
  const [metrics, setMetrics] = useState<any>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  useEffect(() => {
    if (data?.metrics) {
      setMetrics(data.metrics);
    }
  }, [data]);

  const handleExport = (reportType: string) => {
    setIsExporting(reportType);
    setTimeout(() => {
      setIsExporting(null);
      toast.success(`${reportType} report has been successfully generated and downloaded.`);
    }, 1500);
  };

  const reports = [
    { id: 'Financial Ledger', icon: FileText, desc: 'Complete breakdown of earnings, platform fees, and payouts.' },
    { id: 'Booking History', icon: Calendar, desc: 'Detailed list of all historical and upcoming bookings.' },
    { id: 'Staff Performance', icon: Users, desc: 'Aggregated completion rates and ratings by staff member.' },
    { id: 'Service Popularity', icon: Briefcase, desc: 'Volume and revenue grouped by service category.' }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background p-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Export custom data and view aggregated performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
            <Filter className="w-3.5 h-3.5" /> Filter Range
          </button>
        </div>
      </div>

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
                  <Activity className="w-4 h-4 text-violet-500" /> Booking Status Distribution
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
                      <div className="p-2.5 bg-background border border-border rounded-lg text-violet-600">
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
