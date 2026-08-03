"use client";

import { useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { 
  ArrowUpRight, ArrowDownRight, Download, Loader2, Calendar, 
  Filter, ChevronDown, MoreHorizontal, Search, TrendingUp, CheckCircle2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import api from "@/lib/api/client";



const serviceData = [
  { name: 'Deep Cleaning', revenue: 14200, percentage: 85 },
  { name: 'Office Cleaning', revenue: 10100, percentage: 65 },
  { name: 'Move Out', revenue: 7600, percentage: 45 },
  { name: 'Window Cleaning', revenue: 4200, percentage: 25 },
];

const staffData = [
  { id: 1, name: 'Alice Smith', avatar: '', jobs: 198, revenue: 8420, rating: 4.8, badge: '🥇' },
  { id: 2, name: 'Bob Johnson', avatar: '', jobs: 184, revenue: 7950, rating: 4.9, badge: '🥈' },
  { id: 3, name: 'Charlie Davis', avatar: '', jobs: 171, revenue: 6980, rating: 4.7, badge: '🥉' },
  { id: 4, name: 'Diana Prince', avatar: '', jobs: 142, revenue: 5800, rating: 4.9, badge: null },
  { id: 5, name: 'Evan Wright', avatar: '', jobs: 120, revenue: 4500, rating: 4.6, badge: null },
];

const transactions = [
  { id: 'BK-2841', date: '2023-08-01T10:00:00Z', customer: 'John Doe', staff: 'Alice Smith', gross: 120, fee: 12, net: 108, payment: 'Stripe', status: 'paid' },
  { id: 'BK-2842', date: '2023-08-01T11:30:00Z', customer: 'Sarah Connor', staff: 'Bob Johnson', gross: 240, fee: 24, net: 216, payment: 'PayPal', status: 'paid' },
  { id: 'BK-2843', date: '2023-08-01T14:15:00Z', customer: 'Mike Ross', staff: 'Charlie Davis', gross: 85, fee: 8.5, net: 76.5, payment: 'Stripe', status: 'pending' },
  { id: 'BK-2844', date: '2023-08-01T16:00:00Z', customer: 'Harvey Specter', staff: 'Alice Smith', gross: 450, fee: 45, net: 405, payment: 'Bank Transfer', status: 'paid' },
  { id: 'BK-2845', date: '2023-08-02T09:00:00Z', customer: 'Rachel Zane', staff: 'Diana Prince', gross: 150, fee: 15, net: 135, payment: 'Stripe', status: 'refunded' },
];

export default function CompanyRevenuePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await api.get('/companies/my-company/revenue');
        setData(res.data?.data || res.data);
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load revenue data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [toast]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (!data) return null;

  const { kpis, trendData, breakdown, serviceData, staffData, transactions } = data;


  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6 bg-background font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Revenue</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Financial performance and payouts.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-muted/50 p-1 rounded-lg flex items-center border border-border">
            <button className="px-3 py-1.5 rounded-md text-xs font-bold bg-background text-foreground shadow-sm">
              Today
            </button>
            <button className="px-3 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              7D
            </button>
            <button className="px-3 py-1.5 rounded-md text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              1M
            </button>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground font-semibold">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* ROW 1: KPI CARDS (4 x 3 cols = 12) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k: any, i: number) => (
          <div key={i} className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{k.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-foreground tracking-tight">{k.value}</p>
              <div className={`flex items-center gap-0.5 text-xs font-bold ${k.up ? 'text-emerald-500' : 'text-rose-500'} mb-1`}>
                {k.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {k.pct}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ROW 2: TREND & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Revenue Trend (8 cols) */}
        <div className="lg:col-span-8 bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-foreground">Revenue Trend</h2>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Gross</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Net</div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="netColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ background: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: '13px' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="gross" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grossColor)" name="Gross Revenue" />
                <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#netColor)" name="Net Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-background border border-border rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">Revenue Breakdown</h2>
          </div>
          <div className="p-5 space-y-4 flex-1 flex flex-col justify-center">
            
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-muted-foreground">Gross Revenue</span>
              <span className="text-base font-bold text-foreground">{`${breakdown.gross.toLocaleString()}`}</span>
            </div>
            
            <div className="pt-2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="font-semibold text-rose-500">{`-${breakdown.platformFee.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Staff Payouts</span>
                <span className="font-semibold text-rose-500">{`-${breakdown.staffPayout.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Discounts</span>
                <span className="font-semibold text-amber-500">{`-${breakdown.discounts.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Refunds</span>
                <span className="font-semibold text-rose-500">{`-${breakdown.refunds.toLocaleString()}`}</span>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-dashed border-border/80 flex justify-between items-end">
              <span className="text-sm font-bold text-foreground">Net Revenue</span>
              <span className="text-lg font-bold text-emerald-500">{`${breakdown.net.toLocaleString()}`}</span>
            </div>

          </div>
        </div>
      </div>

      {/* ROW 3: SERVICES & STAFF (6 cols / 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Services */}
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">Revenue by Service</h2>
          </div>
          <div className="p-5 flex-1 space-y-5">
            {serviceData.map((svc: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{svc.name}</span>
                  <span className="font-bold text-foreground">${svc.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${svc.percentage}%`, opacity: 1 - (i * 0.15) }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Staff Leaderboard */}
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Top Staff</h2>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase tracking-widest font-bold text-primary">View All</Button>
          </div>
          <div className="p-0 flex-1">
            <div className="divide-y divide-border/50">
              {staffData.map((staff: any, i: number) => (
                <div key={staff.id} className="flex items-center p-3 hover:bg-muted/30 transition-colors">
                  <div className="w-6 text-center text-base mr-2">
                    {staff.badge || <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                  </div>
                  <Avatar className="w-8 h-8 rounded-lg border border-border mr-3">
                    <AvatarFallback className="bg-muted text-xs font-bold text-foreground">{staff.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{staff.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-muted-foreground">{staff.jobs} Jobs</span>
                      <span className="text-[10px] text-muted-foreground/50">•</span>
                      <span className="text-[11px] font-bold text-amber-500">★ {staff.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-500">${staff.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ROW 4: TRANSACTIONS TABLE */}
      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-sm font-semibold text-foreground">Transactions</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full h-9 pl-9 pr-4 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 px-3 shrink-0">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Booking ID</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Staff</th>
                <th className="px-5 py-3 font-semibold text-right">Gross</th>
                <th className="px-5 py-3 font-semibold text-right">Fee</th>
                <th className="px-5 py-3 font-semibold text-right">Net</th>
                <th className="px-5 py-3 font-semibold text-center">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">
                    {format(new Date(tx.date), 'MMM d')}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap font-medium text-foreground">{tx.id}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-foreground">{tx.customer}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{tx.staff}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-medium text-foreground">${tx.gross.toFixed(2)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-right text-rose-500">-${tx.fee.toFixed(2)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-right font-bold text-emerald-500">${tx.net.toFixed(2)}</td>
                  <td className="px-5 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      tx.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      tx.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold text-primary">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground font-medium">
          <span>Showing 1 to 5 of 24 entries</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2" disabled>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 px-2">Next</Button>
          </div>
        </div>

      </div>

    </div>
  );
}

