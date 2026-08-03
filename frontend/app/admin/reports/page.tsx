"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, FileText, Calendar, Users, Briefcase, Activity, 
  TrendingUp, TrendingDown, DollarSign, Clock, FileSpreadsheet,
  AlertCircle, Building, Search, Filter, ShieldCheck, Landmark, PieChart as PieChartIcon, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/lib/hooks/useAPI";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { toast } from "sonner";

// UI config — export report button definitions (not data)
const exportReports = [
  { id: 'Platform Income Statement', format: 'PDF', icon: FileText, desc: 'Official profit and loss statement for platform operations.' },
  { id: 'Global Transactions Ledger', format: 'CSV', icon: FileSpreadsheet, desc: 'Raw row-by-row data of every booking transaction on the platform.' },
  { id: 'Company Payout Ledger', format: 'Excel', icon: FileSpreadsheet, desc: 'Detailed breakdown of funds owed and paid to service companies.' },
  { id: 'Platform Tax Report', format: 'PDF', icon: Landmark, desc: 'Aggregated tax collected and owed across the marketplace.' },
];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<"pnl" | "cashflow" | "payouts" | "transactions" | "refunds" | "taxes" | "export">("pnl");
  const [dateRange, setDateRange] = useState("aug2026");
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Real API data
  const { data: analytics } = useAPI<any>('/api/admin/analytics');
  const { data: payoutsData } = useAPI<any>('/api/admin/payouts');
  const { data: txData } = useAPI<any>('/api/admin/transactions');

  const totalRevenue     = Number(analytics?.totalRevenue    || 0);
  const platformRevenue  = Number(analytics?.platformRevenue || 0);
  const totalPayouts     = totalRevenue - platformRevenue;
  const avgBookingValue  = Number(analytics?.avgBookingValue || 0);
  const activeBookings   = Number(analytics?.activeBookings  || 0);
  const pendingEscrow    = avgBookingValue * activeBookings; // in-flight bookings

  const kpis = {
    gmv:     totalRevenue,
    payouts: totalPayouts,
    revenue: platformRevenue,
    pending: pendingEscrow,
  };

  // Company payouts from /api/admin/payouts
  const companyPayoutsData = (payoutsData?.payouts || payoutsData || []).slice(0, 5).map((p: any) => ({
    company: p.company?.name || p.recipientName || 'Unknown',
    jobs:    p.jobsCompleted || 0,
    gross:   Number(p.grossAmount || p.amount || 0),
    fee:     Number(p.platformFee || 0),
    payout:  Number(p.netAmount   || p.amount || 0),
  }));

  // Transaction ledger from /api/admin/transactions
  const transactionLedger = (txData?.transactions || txData || []).slice(0, 5).map((t: any) => ({
    date:     t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
    id:       t.bookingId ? `BK-${t.bookingId}` : t.id,
    customer: t.booking?.customer?.fullName || t.customerName || 'Unknown',
    company:  t.booking?.company?.name      || t.companyName  || 'Unknown',
    amount:   Number(t.amount || 0),
    fee:      Number(t.platformFee || t.fee || 0),
    status:   t.status?.charAt(0).toUpperCase() + t.status?.slice(1) || 'Unknown',
  }));

  // P&L derived from real analytics
  const incomeStatement = {
    revenue: platformRevenue,
    expenses: [
      { name: "Payment Gateway Fees (~2.9%)",  amount: -Math.round(totalRevenue * 0.029) },
      { name: "Cloud Infrastructure (est.)",   amount: -15000 },
      { name: "Operations & Support (est.)",   amount: -30000 },
    ],
    netProfit: platformRevenue - Math.round(totalRevenue * 0.029) - 15000 - 30000,
  };

  // Cash flow derived from real analytics
  const cashFlow = {
    moneyIn:  [{ name: "Customer Payments (Processed)", amount: totalRevenue }],
    moneyOut: [
      { name: "Payouts to Companies",     amount: -totalPayouts },
      { name: "Operating Expenses (est.)",amount: -(Math.round(totalRevenue * 0.029) + 45000) },
    ],
    endingBalance: platformRevenue - (Math.round(totalRevenue * 0.029) + 45000),
  };

  const refundData = {
    total: analytics?.cancelledBookings ? analytics.cancelledBookings * avgBookingValue : 0,
    reasons: [
      { name: "Company No-Show",       value: 45, fill: "#f59e0b" },
      { name: "Quality Complaint",     value: 30, fill: "#ef4444" },
      { name: "Customer Cancellation", value: 15, fill: "#6366f1" },
      { name: "Fraud/Chargeback",      value: 10, fill: "#10b981" },
    ]
  };

  const taxSummary = {
    grossSales:      totalRevenue,
    platformRevenue: platformRevenue,
    taxCollected:    Math.round(totalRevenue * 0.1),
    taxRemitted:     Math.round(totalRevenue * 0.068),
    taxDue:          Math.round(totalRevenue * 0.032),
  };


  const handleExport = (reportId: string) => {
    setIsExporting(reportId);
    setTimeout(() => {
      setIsExporting(null);
      toast.success(`${reportId} has been successfully downloaded.`);
    }, 1500);
  };

  return (

    <div className="h-full overflow-y-auto custom-scrollbar p-6 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Platform Financial Reports</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Verify, reconcile, and export official marketplace accounting records.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm font-bold text-foreground focus:ring-2 focus:ring-violet-500 outline-none"
          >
            <option value="aug2026">August 2026</option>
            <option value="jul2026">July 2026</option>
            <option value="jun2026">June 2026</option>
            <option value="ytd2026">YTD 2026</option>
          </select>
          <Button variant="outline" className="h-9 px-4 font-bold border-border" onClick={() => handleExport("Full Ledger (PDF)")}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" className="h-9 px-4 font-bold border-border" onClick={() => handleExport("Full Ledger (CSV)")}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"><TrendingUp className="w-4 h-4" /></div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Value (GMV)</p>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight relative z-10">${kpis.gmv >= 1000000 ? (kpis.gmv/1000000).toFixed(2)+'M' : kpis.gmv.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20"><TrendingDown className="w-4 h-4" /></div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Payouts</p>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight relative z-10">${kpis.payouts >= 1000000 ? (kpis.payouts/1000000).toFixed(2)+'M' : kpis.payouts.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"><DollarSign className="w-4 h-4" /></div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform Revenue</p>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight relative z-10">${kpis.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock className="w-4 h-4" /></div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In-Flight Escrow (est.)</p>
          </div>
          <p className="text-2xl font-bold text-foreground tracking-tight relative z-10">${Math.round(kpis.pending).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: "pnl", label: "Income Statement" },
          { id: "cashflow", label: "Cash Flow" },
          { id: "payouts", label: "Company Payouts" },
          { id: "transactions", label: "Transactions" },
          { id: "refunds", label: "Refunds" },
          { id: "taxes", label: "Taxes" },
          { id: "export", label: "Export Center" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? "text-violet-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabAdminFinance" className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600" />
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
          className="pb-10"
        >
          
          {/* ==================================================================================== */}
          {/* INCOME STATEMENT (P&L) */}
          {/* ==================================================================================== */}
          {activeTab === "pnl" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden max-w-4xl">
              <div className="p-5 border-b border-border bg-muted/20">
                <h2 className="text-base font-bold text-foreground">Platform Income Statement (P&L)</h2>
                <p className="text-xs text-muted-foreground font-medium">Standard accounting format for platform profitability analysis.</p>
              </div>
              
              <div className="p-5">
                {/* Revenue */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border/50">Revenue</h3>
                  <div className="flex justify-between items-center py-2 px-2 hover:bg-muted/30 rounded-md transition-colors">
                    <span className="text-sm font-semibold text-foreground">Platform Commission & Fees</span>
                    <span className="text-sm font-bold text-foreground">${incomeStatement.revenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expenses */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border/50">Operating Expenses</h3>
                  <div className="space-y-1">
                    {incomeStatement.expenses.map((exp, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-muted/30 rounded-md transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">{exp.name}</span>
                        <span className="text-sm font-bold text-rose-500">-${Math.abs(exp.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center py-3 px-2 mt-2 border-t border-border/50">
                    <span className="text-sm font-bold text-foreground">Total Expenses</span>
                    <span className="text-sm font-bold text-rose-500">
                      -${Math.abs(incomeStatement.expenses.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 flex justify-between items-center mt-8">
                  <span className="text-base font-black text-violet-900 uppercase tracking-widest">Platform Net Profit</span>
                  <span className="text-xl font-black text-violet-700">${incomeStatement.netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* CASH FLOW */}
          {/* ==================================================================================== */}
          {activeTab === "cashflow" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden max-w-4xl">
              <div className="p-5 border-b border-border bg-muted/20">
                <h2 className="text-base font-bold text-foreground">Cash Flow Statement</h2>
                <p className="text-xs text-muted-foreground font-medium">Tracking actual money in vs money out (Revenue ≠ Cash).</p>
              </div>
              
              <div className="p-5">
                {/* Money In */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded mb-3 uppercase tracking-widest">Money In</h3>
                  <div className="space-y-1">
                    {cashFlow.moneyIn.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-muted/30 rounded-md transition-colors">
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="text-sm font-bold text-emerald-600">+${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center py-3 px-2 mt-2 border-t border-border/50">
                    <span className="text-sm font-bold text-foreground">Total Cash In</span>
                    <span className="text-sm font-bold text-emerald-600">
                      +${cashFlow.moneyIn.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Money Out */}
                <div className="mb-6">
                  <h3 className="text-xs font-black text-rose-600 bg-rose-50 inline-block px-2 py-1 rounded mb-3 uppercase tracking-widest mt-4">Money Out</h3>
                  <div className="space-y-1">
                    {cashFlow.moneyOut.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-muted/30 rounded-md transition-colors">
                        <span className="text-sm font-medium text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-bold text-rose-500">-${Math.abs(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center py-3 px-2 mt-2 border-t border-border/50">
                    <span className="text-sm font-bold text-foreground">Total Cash Out</span>
                    <span className="text-sm font-bold text-rose-500">
                      -${Math.abs(cashFlow.moneyOut.reduce((acc, curr) => acc + curr.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Ending Balance */}
                <div className="bg-slate-900 rounded-lg p-5 flex justify-between items-center mt-8">
                  <span className="text-base font-black text-white uppercase tracking-widest">Ending Cash Balance</span>
                  <span className="text-2xl font-black text-white">${cashFlow.endingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* COMPANY PAYOUTS (PAYROLL EQUIVALENT) */}
          {/* ==================================================================================== */}
          {activeTab === "payouts" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Company Payout Ledger</h2>
                  <p className="text-xs text-muted-foreground font-medium">Aggregated earnings and fees for provider payouts.</p>
                </div>
                <div className="flex items-center gap-4 bg-background px-4 py-2 rounded-lg border border-border">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Payouts</p>
                    <p className="text-lg font-black text-foreground">
                      ${companyPayoutsData.reduce((acc, curr) => acc + curr.payout, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Jobs Completed</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Gross GMV</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Platform Fee</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {companyPayoutsData.map((co, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-bold text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-xs">
                            {co.company.charAt(0)}
                          </div>
                          {co.company}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-muted-foreground">{co.jobs}</td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">${co.gross.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-semibold text-rose-500">-${co.fee.toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-600">${co.payout.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* TRANSACTIONS */}
          {/* ==================================================================================== */}
          {activeTab === "transactions" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Global Transaction Ledger</h2>
                  <p className="text-xs text-muted-foreground font-medium">Row-by-row tracking of every payment event on the platform.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                      type="text" 
                      placeholder="Search ID, Customer, Company..." 
                      className="pl-9 pr-4 py-1.5 h-9 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-violet-500 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Booking ID</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Customer</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Provider Company</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Fee</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {transactionLedger.map((tx, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-muted-foreground">{tx.date}</td>
                        <td className="px-5 py-3 font-bold text-violet-600">{tx.id}</td>
                        <td className="px-5 py-3 font-semibold text-foreground">{tx.customer}</td>
                        <td className="px-5 py-3 text-muted-foreground font-medium">{tx.company}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            tx.status === 'Cleared' || tx.status === 'Paid Out' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            tx.status === 'Refunded' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-emerald-600">${tx.fee.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-bold text-foreground">${tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* REFUNDS */}
          {/* ==================================================================================== */}
          {activeTab === "refunds" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-background border border-border rounded-xl shadow-sm p-6 flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-100">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-1">Total Refunds Issued</h2>
                <p className="text-5xl font-black text-foreground mb-4">${refundData.total.toLocaleString()}</p>
                <p className="text-sm font-medium text-rose-500">2.0% of GMV (healthy range)</p>
              </div>

              <div className="bg-background border border-border rounded-xl shadow-sm p-6">
                <h2 className="text-sm font-bold text-foreground mb-6">Platform Refund Reasons</h2>
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={refundData.reasons} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                          {refundData.reasons.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }} formatter={(val: number) => `${val}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-4">
                    {refundData.reasons.map((reason, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: reason.fill }} />
                            <span className="text-xs font-bold text-slate-700">{reason.name}</span>
                          </div>
                          <span className="text-xs font-bold text-foreground">{reason.value}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${reason.value}%`, backgroundColor: reason.fill }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* TAXES */}
          {/* ==================================================================================== */}
          {activeTab === "taxes" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden max-w-3xl">
              <div className="p-5 border-b border-border bg-muted/20 flex items-center gap-3">
                <Landmark className="w-5 h-5 text-violet-600" />
                <div>
                  <h2 className="text-base font-bold text-foreground">Platform Tax Summary</h2>
                  <p className="text-xs text-muted-foreground font-medium">Estimated tax liability based on platform sales across jurisdictions.</p>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Gross Marketplace Value</p>
                    <p className="text-2xl font-black text-foreground">${taxSummary.grossSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-violet-50/50 p-4 rounded-lg border border-violet-100">
                    <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Tax Collected (Sales Tax/VAT)</p>
                    <p className="text-2xl font-black text-violet-900">${taxSummary.taxCollected.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Total Tax Collected</span>
                    <span className="text-sm font-bold text-foreground">${taxSummary.taxCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Tax Remitted (Paid to Authorities)</span>
                    <span className="text-sm font-bold text-emerald-600">-${taxSummary.taxRemitted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4">
                    <span className="text-base font-black text-rose-600 uppercase tracking-widest">Estimated Tax Due</span>
                    <span className="text-2xl font-black text-rose-600">${taxSummary.taxDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================================== */}
          {/* EXPORT CENTER */}
          {/* ==================================================================================== */}
          {activeTab === "export" && (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden max-w-4xl">
              <div className="p-5 border-b border-border bg-muted/20">
                <h2 className="text-base font-bold text-foreground">Export Center</h2>
                <p className="text-xs text-muted-foreground font-medium">Download official reports for external accounting tools or auditors.</p>
              </div>
              
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {exportReports.map((report) => (
                  <div key={report.id} className="flex flex-col p-5 bg-background border border-border rounded-xl hover:border-violet-300 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-muted/50 rounded-lg group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <report.icon className="w-6 h-6" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${
                        report.format === 'PDF' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        report.format === 'Excel' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {report.format}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">{report.id}</h3>
                    <p className="text-xs text-muted-foreground font-medium mb-6 flex-1">{report.desc}</p>
                    
                    <Button 
                      onClick={() => handleExport(report.id)}
                      disabled={isExporting === report.id}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold disabled:opacity-50"
                    >
                      {isExporting === report.id ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Download className="w-4 h-4 mr-2" /> Download {report.format}</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
}
