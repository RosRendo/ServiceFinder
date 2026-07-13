"use client";

import { useState, useEffect } from "react";
import { 
  Target, Download, RefreshCw, BarChart3, TrendingUp, Users, MapPin, Loader2,
  ShieldCheck, ArrowUpRight, ArrowDownRight, Briefcase, Trophy, PieChart as PieChartIcon, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  BarChart, Bar, Legend, Treemap, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

// --- Mock Data ---
const profitabilityData = [
  { name: 'Standard Clean', volume: 145, margin: 35, revenue: 12000, fill: '#3b82f6' },
  { name: 'Deep Clean', volume: 42, margin: 55, revenue: 8500, fill: '#10b981' },
  { name: 'Move Out', volume: 28, margin: 65, revenue: 6200, fill: '#8b5cf6' },
  { name: 'Office Clean', volume: 15, margin: 45, revenue: 4500, fill: '#f59e0b' },
  { name: 'Carpet Clean', volume: 85, margin: 25, revenue: 5100, fill: '#ec4899' },
];

const qualityRadarData = [
  { subject: 'Punctuality', A: 4.8, fullMark: 5 },
  { subject: 'Thoroughness', A: 4.9, fullMark: 5 },
  { subject: 'Professionalism', A: 4.7, fullMark: 5 },
  { subject: 'Communication', A: 4.5, fullMark: 5 },
  { subject: 'Value', A: 4.6, fullMark: 5 },
];

const customerRetentionData = [
  { month: 'Jan', new: 45, returning: 120 },
  { month: 'Feb', new: 52, returning: 125 },
  { month: 'Mar', new: 38, returning: 140 },
  { month: 'Apr', new: 65, returning: 145 },
  { month: 'May', new: 58, returning: 160 },
  { month: 'Jun', new: 72, returning: 165 },
];

const geographicRevenueData = [
  { name: 'Downtown', size: 14000 },
  { name: 'North Hills', size: 9500 },
  { name: 'Westside', size: 8200 },
  { name: 'South Park', size: 5400 },
  { name: 'East End', size: 3100 },
];

const revenueTrendData = [
  { month: 'Jan', gross: 24000, net: 14500 },
  { month: 'Feb', gross: 28000, net: 16800 },
  { month: 'Mar', gross: 26500, net: 15200 },
  { month: 'Apr', gross: 32000, net: 19500 },
  { month: 'May', gross: 35000, net: 22000 },
  { month: 'Jun', gross: 42000, net: 27500 },
];

const serviceBreakdownData = [
  { name: 'Standard Clean', value: 45, color: '#3b82f6' },
  { name: 'Deep Clean', value: 25, color: '#10b981' },
  { name: 'Move Out', value: 15, color: '#8b5cf6' },
  { name: 'Carpet Clean', value: 10, color: '#ec4899' },
  { name: 'Office Clean', value: 5, color: '#f59e0b' },
];

const topStaffData = [
  { id: 1, name: 'Sarah Jenkins', jobs: 42, rating: 4.9, revenue: 6500, avatar: 'SJ', color: 'bg-blue-100 text-blue-600' },
  { id: 2, name: 'Michael Chen', jobs: 38, rating: 4.8, revenue: 5800, avatar: 'MC', color: 'bg-emerald-100 text-emerald-600' },
  { id: 3, name: 'Elena Rodriguez', jobs: 35, rating: 4.9, revenue: 5200, avatar: 'ER', color: 'bg-indigo-100 text-indigo-600' },
  { id: 4, name: 'David Kim', jobs: 31, rating: 4.7, revenue: 4800, avatar: 'DK', color: 'bg-amber-100 text-amber-600' },
];

export default function CompanyAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mb-4" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  const kpis = [
    { label: "Net Margin", value: "42.5%", change: "+2.1%", up: true, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "LTV (Lifetime Value)", value: "$840", change: "+$45", up: true, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Repeat Rate", value: "68%", change: "-2%", up: false, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Quality Score", value: "4.7/5", change: "+0.1", up: true, icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Analytics Matrix</h1>
          <p className="text-sm text-gray-500 mt-0.5">Deep dive into operations, profitability, and retention.</p>
        </div>
        <div>
          <Button variant="outline" className="h-9 px-4 text-sm font-medium border-gray-200">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-md ${k.bg}`}>
                <k.icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <span className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${k.up ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                {k.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {k.change}
              </span>
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{k.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 1: Service Profitability Matrix (Col Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                Profitability Matrix
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Volume vs Margin %</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-900">Sweet Spot: Top Right</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis type="number" dataKey="volume" name="Jobs" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="margin" name="Margin %" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ color: '#111827', fontSize: '12px' }}
                  formatter={(value, name) => {
                    if (name === "Margin %") return [`${value}%`, name];
                    return [value, name];
                  }}
                />
                {profitabilityData.map((entry, index) => (
                  <Scatter key={`scatter-${index}`} name={entry.name} data={[entry]} fill={entry.fill} shape="circle" />
                ))}
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 2: Quality Control Radar (Col Span 1) */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              Quality Radar
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Based on 500+ recent reviews</p>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={qualityRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Radar name="Company Average" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 3: Revenue Composition (Col Span 1) */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-gray-400" />
              Revenue Composition
            </h2>
          </div>
          <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={serviceBreakdownData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {serviceBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-500">Total Rev</span>
              <span className="text-lg font-semibold text-gray-900">$102K</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {serviceBreakdownData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600 truncate">{s.name}</span>
                <span className="text-xs font-medium text-gray-900 ml-auto">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Growth Velocity (Col Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5 flex flex-col">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Growth Velocity
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Gross vs Net Revenue Trend (Trailing 6 Months)</p>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="gross" name="Gross Revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGross)" />
                <Area type="monotone" dataKey="net" name="Net Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget 5: Top Performers (Col Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-5">
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-400" />
              Staff Leaderboard
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topStaffData.map((staff, i) => (
              <div key={staff.id} className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${staff.color}`}>
                    {staff.avatar}
                  </div>
                  {i === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{staff.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{staff.jobs} jobs · ⭐ {staff.rating}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
