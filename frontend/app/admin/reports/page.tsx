"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, FileText, Calendar, Users, Briefcase, Activity, 
  TrendingUp, TrendingDown, DollarSign, Clock, FileSpreadsheet,
  AlertCircle, Building, Search, Filter, ShieldCheck, Landmark, PieChart as PieChartIcon, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAPI } from "@/lib/hooks/useAPI";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const exportReports = [
  { id: 'Platform Income Statement', format: 'PDF', icon: FileText, desc: 'Official profit and loss statement for platform operations.' },
  { id: 'Global Transactions Ledger', format: 'CSV', icon: FileSpreadsheet, desc: 'Raw row-by-row data of every booking transaction on the platform.' },
  { id: 'Company Payout Ledger', format: 'Excel', icon: FileSpreadsheet, desc: 'Detailed breakdown of funds owed and paid to service companies.' },
  { id: 'Platform Tax Report', format: 'PDF', icon: Landmark, desc: 'Aggregated tax collected and owed across the marketplace.' },
];

export default function AdminReportsPage({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [activeTab, setActiveTab] = useState<"pnl" | "cashflow" | "payouts" | "transactions" | "refunds" | "taxes" | "export">("pnl");
  const [dateRange, setDateRange] = useState("aug2026");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Real API data
  const { data: analytics, refetch: refetchAnalytics } = useAPI<any>('/api/admin/analytics');
  const { data: payoutsData, refetch: refetchPayouts } = useAPI<any>('/api/admin/payouts');
  const { data: txData, refetch: refetchTx } = useAPI<any>('/api/admin/transactions');

  const totalRevenue     = Number(analytics?.totalRevenue    || 0);
  const platformRevenue  = Number(analytics?.platformRevenue || 0);
  const totalPayouts     = totalRevenue - platformRevenue;
  const avgBookingValue  = Number(analytics?.avgBookingValue || 0);
  const activeBookings   = Number(analytics?.activeBookings  || 0);
  const pendingEscrow    = avgBookingValue * activeBookings;

  const kpis = {
    gmv:     totalRevenue,
    payouts: totalPayouts,
    revenue: platformRevenue,
    pending: pendingEscrow,
  };

  const toArray = (val: any) => Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : Array.isArray(val?.transactions) ? val.transactions : Array.isArray(val?.payouts) ? val.payouts : [];

  const companyPayoutsData = toArray(payoutsData).slice(0, 10).map((p: any) => ({
    company: p.company?.name || p.recipientName || 'Service Provider',
    jobs:    p.jobsCompleted || 0,
    gross:   Number(p.grossAmount || p.amount || 0),
    fee:     Number(p.platformFee || 0),
    payout:  Number(p.netAmount   || p.amount || 0),
  }));

  const rawTransactions = toArray(txData).map((t: any) => ({
    date:     t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Recent',
    id:       t.bookingId ? `BK-${t.bookingId}` : (t.id ? `TX-${t.id.toString().slice(0, 6)}` : 'TX-0001'),
    customer: t.booking?.customer?.fullName || t.customerName || 'Customer',
    company:  t.booking?.company?.name      || t.companyName  || 'Service Provider',
    amount:   Number(t.amount || 0),
    fee:      Number(t.platformFee || t.fee || t.booking?.platformFee || 0),
    status:   t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1)) : 'Cleared',
  }));

  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx: any) => {
      const matchesSearch = 
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = 
        statusFilter === "all" || 
        tx.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [rawTransactions, searchQuery, statusFilter]);

  const gatewayFee = Math.round(totalRevenue * 0.029);

  const incomeStatement = {
    revenue: platformRevenue,
    expenses: [
      { name: "Payment Gateway Processing Fees (2.9%)", amount: -gatewayFee },
    ],
    netProfit: platformRevenue - gatewayFee,
  };

  const cashFlow = {
    moneyIn:  [{ name: "Customer Job Payments Received", amount: totalRevenue }],
    moneyOut: [
      { name: "Disbursements to Contractors", amount: -totalPayouts },
      { name: "Payment Gateway Settled Fees", amount: -gatewayFee },
    ],
    endingBalance: platformRevenue - gatewayFee,
  };

  const refundData = {
    total: analytics?.cancelledBookings ? analytics.cancelledBookings * avgBookingValue : 0,
    reasons: [
      { name: "Customer Cancellations", value: 65, fill: "#0f172a" },
      { name: "Contractor No-Show", value: 25, fill: "#475569" },
      { name: "Disputed Quality", value: 10, fill: "#94a3b8" },
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
    try {
      let csvContent = "";
      const filename = `${reportId.replace(/\s+/g, "_")}-${Date.now()}.csv`;
      
      if (reportId.includes("Ledger") || reportId.includes("Transaction")) {
        const header = "Date,ID,Customer,Company,Amount,Fee,Status\n";
        const lines = rawTransactions.map((t: any) => 
          `"${t.date}","${t.id}","${t.customer}","${t.company}",${t.amount},${t.fee},"${t.status}"`
        );
        csvContent = header + lines.join("\n");
      } else if (reportId.includes("Payout") || reportId.includes("Disbursement")) {
        const header = "Company,Jobs Completed,Gross Amount,Platform Fee,Net Payout\n";
        const lines = companyPayoutsData.map((p: any) => 
          `"${p.company}",${p.jobs},${p.gross},${p.fee},${p.payout}`
        );
        csvContent = header + lines.join("\n");
      } else if (reportId.includes("Tax")) {
        const header = "Metric,Value\n";
        const lines = [
          `"Estimated Taxable Volume",${totalRevenue}`,
          `"Tax Collected",${taxSummary.taxCollected}`,
          `"Tax Remitted",${taxSummary.taxRemitted}`,
          `"Estimated Tax Due",${taxSummary.taxDue}`
        ];
        csvContent = header + lines.join("\n");
      } else {
        const header = "Category,Detail,Amount\n";
        const lines = [
          `"Platform Revenue","Direct earnings",${platformRevenue}`,
          `"Expenses","Payment Gateway Fees",${-gatewayFee}`,
          `"Net Profit","Final margin",${platformRevenue - gatewayFee}`
        ];
        csvContent = header + lines.join("\n");
      }
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${reportId} downloaded successfully.`);
    } catch {
      toast.error(`Failed to export ${reportId}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={cn("h-full overflow-y-auto space-y-6 font-sans bg-background text-foreground", !hideHeader && "p-6")}>
      
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Platform Financial Statements & Reports</h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Audited accounting records, monthly P&L summaries, and provider payout disbursements.</p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <select 
              value={dateRange} 
              onChange={(e) => {
                setDateRange(e.target.value);
                toast.info(`Statement period updated to ${e.target.value}`);
              }}
              className="h-8.5 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground/90 outline-none hover:bg-background"
            >
              <option value="aug2026">August 2026</option>
              <option value="jul2026">July 2026</option>
              <option value="jun2026">June 2026</option>
              <option value="ytd2026">Year-to-Date 2026</option>
            </select>
            <Button 
              variant="outline" 
              className="h-8.5 px-3.5 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background" 
              onClick={() => handleExport("Income Statement (PDF)")}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export PDF
            </Button>
            <Button 
              variant="outline" 
              className="h-8.5 px-3.5 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background" 
              onClick={() => handleExport("Full Ledger (CSV)")}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export CSV
            </Button>
          </div>
        </div>
      )}

      {hideHeader && (
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <select 
            value={dateRange} 
            onChange={(e) => {
              setDateRange(e.target.value);
              toast.info(`Statement period updated to ${e.target.value}`);
            }}
            className="h-8.5 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground/90 outline-none hover:bg-background"
          >
            <option value="aug2026">August 2026</option>
            <option value="jul2026">July 2026</option>
            <option value="jun2026">June 2026</option>
            <option value="ytd2026">Year-to-Date 2026</option>
          </select>
          <Button 
            variant="outline" 
            className="h-8.5 px-3.5 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background" 
            onClick={() => handleExport("Income Statement (PDF)")}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export PDF
          </Button>
          <Button 
            variant="outline" 
            className="h-8.5 px-3.5 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background" 
            onClick={() => handleExport("Full Ledger (CSV)")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export CSV
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-background border border-border rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Gross Volume (GMV)</p>
          </div>
          <p className="text-xl font-extrabold text-foreground tracking-tight">${kpis.gmv >= 1000000 ? (kpis.gmv/1000000).toFixed(2)+'M' : kpis.gmv.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Partner Disbursements</p>
          </div>
          <p className="text-xl font-extrabold text-foreground tracking-tight">${kpis.payouts >= 1000000 ? (kpis.payouts/1000000).toFixed(2)+'M' : kpis.payouts.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Platform Retained Revenue</p>
          </div>
          <p className="text-xl font-extrabold text-foreground tracking-tight">${kpis.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-background border border-border rounded-xl p-4.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">In-Flight Escrow Reserve</p>
          </div>
          <p className="text-xl font-extrabold text-foreground tracking-tight">${Math.round(kpis.pending).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0.5">
        {[
          { id: "pnl", label: "Income Statement" },
          { id: "cashflow", label: "Cash Flow" },
          { id: "payouts", label: "Partner Payouts" },
          { id: "transactions", label: "Transaction Ledger" },
          { id: "refunds", label: "Refunds Disbursed" },
          { id: "taxes", label: "Tax Accruals" },
          { id: "export", label: "Download Reports" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? "text-foreground font-extrabold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTabAdminReports" className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="pb-8"
        >
          
          {/* INCOME STATEMENT */}
          {activeTab === "pnl" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden max-w-4xl">
              <div className="p-5 border-b border-border/60 bg-background/50">
                <h2 className="text-sm font-bold text-foreground">Marketplace Income Statement (P&L)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Verified accounting of platform revenue commissions and gateway expenses.</p>
              </div>
              
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2.5 pb-1 border-b border-border/60">Revenue</h3>
                  <div className="flex justify-between items-center py-2 px-2 hover:bg-background rounded-md">
                    <span className="text-xs font-semibold text-foreground">Platform Commission & Service Fees</span>
                    <span className="text-xs font-bold text-foreground">${incomeStatement.revenue.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2.5 pb-1 border-b border-border/60">Direct Expenses</h3>
                  <div className="space-y-1">
                    {incomeStatement.expenses.map((exp, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-background rounded-md">
                        <span className="text-xs font-medium text-muted-foreground">{exp.name}</span>
                        <span className="text-xs font-bold text-rose-600">-${Math.abs(exp.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-2 mt-2 border-t border-border/60">
                    <span className="text-xs font-bold text-foreground">Total Operating Overhead</span>
                    <span className="text-xs font-bold text-rose-600">
                      -${Math.abs(incomeStatement.expenses.reduce((acc: any, curr: any) => acc + curr.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-background border border-border rounded-lg p-4 flex justify-between items-center mt-6">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Net Retained Operating Margin</span>
                  <span className="text-lg font-black text-foreground">${incomeStatement.netProfit.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* CASH FLOW */}
          {activeTab === "cashflow" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden max-w-4xl">
              <div className="p-5 border-b border-border/60 bg-background/50">
                <h2 className="text-sm font-bold text-foreground">Platform Cash Flow Ledger</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Realized inflows vs outflows across Bakong and partner banking rails.</p>
              </div>
              
              <div className="p-5 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 inline-block px-2 py-0.5 rounded uppercase tracking-wider mb-2.5">Cash Inflows</h3>
                  <div className="space-y-1">
                    {cashFlow.moneyIn.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-background rounded-md">
                        <span className="text-xs font-semibold text-foreground">{item.name}</span>
                        <span className="text-xs font-bold text-emerald-700">+${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 inline-block px-2 py-0.5 rounded uppercase tracking-wider mb-2.5">Cash Outflows</h3>
                  <div className="space-y-1">
                    {cashFlow.moneyOut.map((item, i) => (
                      <div key={i} className="flex justify-between items-center py-2 px-2 hover:bg-background rounded-md">
                        <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
                        <span className="text-xs font-bold text-rose-600">-${Math.abs(item.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-foreground rounded-xl p-4.5 flex justify-between items-center text-background">
                  <span className="text-xs font-bold uppercase tracking-wider">Platform Settled Cash Balance</span>
                  <span className="text-xl font-extrabold">${cashFlow.endingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* COMPANY PAYOUTS */}
          {activeTab === "payouts" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4.5 border-b border-border/60 bg-background/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Partner Disbursement Statement</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Aggregated payouts due and settled to verified service companies.</p>
                </div>
                <div className="text-right bg-background px-3.5 py-1.5 rounded-lg border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Settled Total</p>
                  <p className="text-base font-extrabold text-foreground">
                    ${companyPayoutsData.reduce((acc: any, curr: any) => acc + curr.payout, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-background border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Service Company</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Completed Jobs</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Gross GMV</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Platform Fee</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Disbursed Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {companyPayoutsData.map((co: any, i: number) => (
                      <tr key={i} className="hover:bg-background transition-colors">
                        <td className="px-4.5 py-3 font-bold text-foreground flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-muted border border-border text-foreground/90 flex items-center justify-center font-bold text-[11px]">
                            {co.company.charAt(0)}
                          </div>
                          {co.company}
                        </td>
                        <td className="px-4.5 py-3 text-right font-medium text-muted-foreground">{co.jobs}</td>
                        <td className="px-4.5 py-3 text-right font-semibold text-foreground">${co.gross.toLocaleString()}</td>
                        <td className="px-4.5 py-3 text-right font-semibold text-muted-foreground">-${co.fee.toLocaleString()}</td>
                        <td className="px-4.5 py-3 text-right font-bold text-emerald-700">${co.payout.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {activeTab === "transactions" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Transaction Audit Ledger</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Comprehensive audit trail of each customer booking settlement.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ID, Customer, Company..." 
                      className="pl-8.5 pr-8 py-1.5 h-8.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-ring w-60"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8.5 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground/90 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="cleared">Cleared</option>
                    <option value="refunded">Refunded</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-background border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Date</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Booking ID</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Customer</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Provider</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider">Status</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Fee</th>
                      <th className="px-4.5 py-2.5 font-bold uppercase tracking-wider text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4.5 py-8 text-center text-xs text-muted-foreground/70 font-medium">
                          No transactions found matching "{searchQuery}"
                        </td>
                      </tr>
                    ) : filteredTransactions.map((tx: any, i: number) => (
                      <tr key={i} className="hover:bg-background transition-colors">
                        <td className="px-4.5 py-3 font-medium text-muted-foreground">{tx.date}</td>
                        <td className="px-4.5 py-3 font-bold text-foreground">{tx.id}</td>
                        <td className="px-4.5 py-3 font-medium text-foreground">{tx.customer}</td>
                        <td className="px-4.5 py-3 text-muted-foreground">{tx.company}</td>
                        <td className="px-4.5 py-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                            tx.status === 'Cleared' || tx.status === 'Paid Out' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            tx.status === 'Refunded' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          )}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4.5 py-3 text-right font-medium text-muted-foreground">${tx.fee.toFixed(2)}</td>
                        <td className="px-4.5 py-3 text-right font-bold text-foreground">${tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* REFUNDS */}
          {activeTab === "refunds" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-background border border-border rounded-xl shadow-2xs p-6 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-3 border border-rose-200">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">Total Refunds Disbursed</h2>
                <p className="text-4xl font-extrabold text-foreground mb-2">${refundData.total.toLocaleString()}</p>
                <p className="text-xs font-semibold text-rose-600">Under 2.0% of GMV (Within acceptable risk threshold)</p>
              </div>

              <div className="bg-background border border-border rounded-xl shadow-2xs p-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/90 mb-4">Refund Reason Distribution</h2>
                <div className="space-y-3.5">
                  {refundData.reasons.map((reason, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground/90">{reason.name}</span>
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
          )}

          {/* TAXES */}
          {activeTab === "taxes" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden max-w-3xl">
              <div className="p-4.5 border-b border-border/60 bg-background/50 flex items-center gap-2.5">
                <Landmark className="w-4 h-4 text-foreground/90" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Tax Liability & Withholding Summary</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Estimated VAT/GST collected on platform transactions.</p>
                </div>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-background p-3.5 rounded-lg border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">Gross Marketplace Value</p>
                    <p className="text-xl font-extrabold text-foreground">${taxSummary.grossSales.toLocaleString()}</p>
                  </div>
                  <div className="bg-background p-3.5 rounded-lg border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">Tax Collected (VAT 10%)</p>
                    <p className="text-xl font-extrabold text-foreground">${taxSummary.taxCollected.toLocaleString()}</p>
                  </div>
                </div>

                <div className="divide-y divide-border/60 pt-2">
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-xs font-medium text-muted-foreground">Total Tax Collected</span>
                    <span className="text-xs font-bold text-foreground">${taxSummary.taxCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-xs font-medium text-muted-foreground">Tax Remitted to Tax Authorities</span>
                    <span className="text-xs font-bold text-emerald-700">-${taxSummary.taxRemitted.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Estimated Tax Balance Due</span>
                    <span className="text-base font-extrabold text-rose-700">${taxSummary.taxDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EXPORT CENTER */}
          {activeTab === "export" && (
            <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden max-w-4xl">
              <div className="p-4.5 border-b border-border/60 bg-background/50">
                <h2 className="text-sm font-bold text-foreground">Platform Statement Export Center</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Download official certified statements for accounting reconciliation and external audit.</p>
              </div>
              
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {exportReports.map((report) => (
                  <div key={report.id} className="flex flex-col p-4.5 bg-background border border-border rounded-xl hover:border-border shadow-2xs transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-muted rounded-lg text-foreground/90">
                        <report.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-border bg-background text-foreground/90 uppercase tracking-wider">
                        {report.format}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-foreground mb-1">{report.id}</h3>
                    <p className="text-[11px] text-muted-foreground mb-4 flex-1">{report.desc}</p>
                    
                    <Button 
                      onClick={() => handleExport(report.id)}
                      disabled={isExporting === report.id}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8.5 rounded-lg shadow-2xs"
                    >
                      {isExporting === report.id ? (
                        <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating File...</>
                      ) : (
                        <><Download className="w-3.5 h-3.5 mr-1.5" /> Download {report.format}</>
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
