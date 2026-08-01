"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, RefreshCw, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  Activity, Target, CheckCircle, XCircle, TrendingUp, Download, PieChart as PieChartIcon, 
  AlertCircle, Users, Building2, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Bar, Line, Legend, RadialBarChart, RadialBar, PolarAngleAxis
} from "recharts";

// --- Data for New Widgets ---

const liquidityData = [
  { month: 'Jan', demand: 450, supply: 42, bookings: 1200 },
  { month: 'Feb', demand: 520, supply: 45, bookings: 1450 },
  { month: 'Mar', demand: 480, supply: 49, bookings: 1300 },
  { month: 'Apr', demand: 610, supply: 55, bookings: 1800 },
  { month: 'May', demand: 750, supply: 62, bookings: 2200 },
  { month: 'Jun', demand: 890, supply: 65, bookings: 2700 }, // Demand outstripping supply
];

const gmvPacingData = [
  { day: '1', actual: 12000, target: 15000 },
  { day: '5', actual: 45000, target: 50000 },
  { day: '10', actual: 95000, target: 100000 },
  { day: '15', actual: 150000, target: 150000 },
  { day: '20', actual: 210000, target: 200000 },
  { day: '25', actual: null, target: 250000 },
  { day: '30', actual: null, target: 300000 },
];

const categorySaturationData = [
  { name: 'Standard Clean', value: 85, fill: '#3b82f6', status: 'Oversupplied' },
  { name: 'Deep Clean', value: 45, fill: '#10b981', status: 'Balanced' },
  { name: 'Move Out', value: 20, fill: '#f59e0b', status: 'Undersupplied' },
  { name: 'Carpet Clean', value: 15, fill: '#ef4444', status: 'Critical Shortage' },
];

const churnRiskData = [
  { id: 1, name: "Sparkle & Co", drop: "-45%", reason: "Volume Drop", rating: "4.2", risk: "High" },
  { id: 2, name: "Elite Maids", drop: "-30%", reason: "Rating Drop", rating: "3.8", risk: "High" },
  { id: 3, name: "QuickCleaners", drop: "-15%", reason: "Inactivity", rating: "4.6", risk: "Medium" },
];

const userRetentionData = [
  { month: 'Jan', active: 12000, new: 3000, churned: 800 },
  { month: 'Feb', active: 14000, new: 3500, churned: 900 },
  { month: 'Mar', active: 16500, new: 4000, churned: 1100 },
  { month: 'Apr', active: 19000, new: 4200, churned: 1300 },
  { month: 'May', active: 22000, new: 4800, churned: 1500 },
  { month: 'Jun', active: 26000, new: 5500, churned: 1700 },
];

const disputeResolutionData = [
  { name: 'Resolved', value: 75, fill: '#10b981' },
  { name: 'Pending Review', value: 15, fill: '#f59e0b' },
  { name: 'Escalated', value: 7, fill: '#ef4444' },
  { name: 'Refunded', value: 3, fill: '#6366f1' },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) {
          setData(json.data || json); // Handle global success wrapper or direct object
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-20 bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-gray-500 animate-pulse">Loading Marketplace Economics...</p>
      </div>
    );
  }

  // Calculate some values from API response
  const platformRevenue = data.revenueSplit?.find((r: any) => r.name === 'Platform Commission')?.value || 0;
  
  const kpis = [
    { label: "Gross Marketplace Value", value: `$${(platformRevenue + (data.revenueSplit?.find((r: any) => r.name === 'Company Payouts')?.value || 0)).toLocaleString()}`, change: "+0%", up: true, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Bookings", value: data.totalBookings?.toString(), change: "+0%", up: true, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Supply", value: data.totalCompanies?.toString(), change: "+0%", up: true, icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Users", value: data.totalUsers?.toString(), change: "+0%", up: true, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  // Map API data to the existing chart variable names to preserve layout
  const mappedLiquidityData = data.registrationTrend?.map((item: any) => ({
    month: item.name,
    demand: item.users,
    supply: item.companies
  })) || liquidityData;

  const mappedGMV = data.monthlyData?.map((item: any) => ({
    day: item.name,
    actual: item.revenue,
    target: item.revenue * 1.2
  })) || gmvPacingData;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Marketplace Economics
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Deep insights into platform liquidity, supply constraints, and GMV pacing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-md border-gray-200 shadow-sm text-gray-700 h-9 px-4 font-medium hover:bg-gray-50">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{k.label}</span>
                <div className={`p-1.5 rounded-md shrink-0 ${k.bg}`}>
                  <k.icon className={`w-4 h-4 ${k.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{k.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${k.up ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"}`}>
                    {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {k.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Widget 1: Marketplace Liquidity (Col Span 8) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Marketplace Liquidity
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">User Demand (Signups) vs Active Supply (Companies)</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-rose-600">Demand &gt; Supply</p>
                <p className="text-[10px] font-medium text-gray-500 mt-0.5">Growth Constraint</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={liquidityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                  
                  {/* Demand (Users) - Left Axis */}
                  <Bar yAxisId="left" dataKey="demand" name="User Signups (Demand)" fill="#c7d2fe" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  
                  {/* Supply (Companies) - Right Axis */}
                  <Line yAxisId="right" type="monotone" dataKey="supply" name="Active Providers (Supply)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#f59e0b", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Widget 2: Provider Churn Risk (Col Span 4) */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Churn Risk
              </h2>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-500 mb-2">Providers flagged for volume/rating drops.</p>
              {churnRiskData.map((provider) => (
                <div key={provider.id} className="p-3 rounded-md border border-gray-200 bg-gray-50 flex flex-col gap-1.5 transition-colors hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900">{provider.name}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-sm">
                      {provider.drop}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>{provider.reason}</span>
                    <span className="flex items-center gap-1 text-amber-600 font-semibold"><Target className="w-3 h-3" /> {provider.rating}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 text-xs font-medium text-indigo-600 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 h-8">
              View All At-Risk
            </Button>
          </div>

          {/* Widget 3: Category Saturation (Col Span 6) */}
          <div className="lg:col-span-6 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-500" />
                  Category Saturation
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">Provider Supply vs Category Demand</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="h-[200px] w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySaturationData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {categorySaturationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col justify-center gap-3">
                {categorySaturationData.map((cat, i) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                        <span className="text-gray-700 font-medium">{cat.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium ml-4">
                      {cat.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Widget 4: GMV Pacing (Col Span 6) */}
          <div className="lg:col-span-6 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  GMV Pacing
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">Actual vs Monthly Target ($300k)</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mappedGMV} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                  
                  {/* Target Line */}
                  <Line type="monotone" dataKey="target" name="Target GMV" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  
                  {/* Actual Area */}
                  <Area type="monotone" dataKey="actual" name="Actual GMV" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Widget 5: User Retention & Engagement (Col Span 8) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col mt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  User Retention & Growth
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">Active vs New vs Churned Users</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={userRetentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} />
                  
                  <Bar dataKey="new" name="New Users" fill="#a78bfa" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="churned" name="Churned Users" fill="#fca5a5" radius={[4, 4, 0, 0]} stackId="a" />
                  <Line type="monotone" dataKey="active" name="Total Active Users" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: "#7c3aed", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Widget 6: Dispute Resolutions (Col Span 4) */}
          <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col mt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  Dispute Outcomes
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">Resolution breakdown (30 days)</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={15} data={disputeResolutionData} startAngle={180} endAngle={-180}>
                  <RadialBar
                    background={{ fill: '#f1f5f9' }}
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 700 }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-4">
                 <div className="text-center">
                   <p className="text-2xl font-semibold text-gray-900">142</p>
                   <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-1">Total</p>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
               {disputeResolutionData.map((item, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                   <span className="text-xs font-medium text-gray-600">{item.name}</span>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
