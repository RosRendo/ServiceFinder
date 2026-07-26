"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, CreditCard, Download, Loader2 } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

export default function CompanyRevenuePage() {
  const [data, setData] = useState<{ day: string, gross: number, net: number }[]>([]);
  const [kpis, setKpis] = useState<{ label: string, value: string, change: string, up: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await api.get('/companies/my-company/revenue');
        const payload = res.data?.data || res.data;
        setData(payload.revenueData || []);
        setKpis(payload.kpis || []);
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
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500 opacity-50" />
      </div>
    );
  }

  const nextPayout = kpis.find(k => k.label === "Next Payout")?.value || "$0";

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Revenue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your earnings and payout summary</p>
        </div>
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-background border border-border rounded-xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-foreground">{k.value}</p>
            {k.change && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {k.change}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-background border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Revenue This Week</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="gross" stroke="#8b5cf6" strokeWidth={2} fill="url(#grossGrad)" name="Gross" />
              <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} fill="url(#netGrad)" name="Net" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-2">
          {[{ color: "bg-violet-400", label: "Gross Revenue" }, { color: "bg-emerald-400", label: "Net to Company" }].map((l) => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} /> {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Payout card */}
      <div className="bg-background border border-border rounded-xl p-5 flex items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-6 h-6 text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Next Payout</p>
          <p className="text-xs text-muted-foreground mt-0.5">Will be processed to your linked ABA PayWay account</p>
        </div>
        <p className="text-2xl font-bold text-violet-400">{nextPayout}</p>
      </div>
    </div>
  );
}
