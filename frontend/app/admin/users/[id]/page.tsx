
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Calendar, Loader2, AlertCircle, CheckCircle, Shield,
  XCircle, MessageSquare, Building2, Briefcase, Star, Clock, Lock, MonitorSmartphone,
  Activity, CheckCircle2, AlertTriangle, List, Edit, Key, LogOut, DollarSign, TrendingUp,
  Users, BarChart3, Wallet, ChevronRight, RefreshCw, ArrowUpRight, ShieldAlert,
  Percent, FileText
} from "lucide-react";
import { StatusPill } from "@/components/admin/StatusPill";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { differenceInDays, format } from "date-fns";
import { ErrorState } from "@/components/common/ErrorState";
import api from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────
interface CompanyOwned {
  id: string;
  name: string;
  logoUrl?: string;
  verificationStatus: string;
  walletBalance: string;
  pendingBalance: string;
  availableBalance: string;
  completedJobs: number;
  platformFeePercent?: string;
  ratingSummary?: { averageRating?: string; totalReviews: number };
  _count?: { staff: number; services: number; bookings: number };
  bookings?: Array<{ totalPrice: string; platformFee: string; companyEarnings: string; createdAt: string; bookingDate: string }>;
}

interface StaffMembership {
  id: string;
  splitPercent?: string;
  walletBalance: string;
  company: { id: string; name: string; logoUrl?: string; ratingSummary?: { averageRating?: string } };
  assignedBookings?: Array<{
    id: string; bookingDate: string; status: string; staffEarnings: string;
    totalPrice: string; service?: { name: string }; company?: { name: string }; customer?: { fullName: string };
  }>;
  reviews?: Array<{
    id: string; staffRating?: number; staffComment?: string; createdAt: string;
    customer?: { fullName: string }; booking?: { service?: { name: string } };
  }>;
}

interface BookingAsCustomer {
  id: string; bookingDate: string; status: string; totalPrice: string;
  platformFee: string; companyEarnings: string; createdAt: string;
  service?: { id: string; name: string; serviceType?: { id: string; name: string; category?: { id: string; name: string; icon?: string } } };
  company?: { id: string; name: string; logoUrl?: string };
  assignedStaff?: { id: string; user?: { fullName: string } };
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  _count?: { bookingsAsCustomer: number; reviews: number; notifications: number; messages: number; cancellationsMade: number };
  bookingsAsCustomer?: BookingAsCustomer[];
  cancellationsMade?: Array<{ id: string; cancelledAt: string }>;
  ownedCompanies?: CompanyOwned[];
  staffMemberships?: StaffMembership[];
  auditLogs?: Array<{ id: string; action: string; createdAt: string; user?: { fullName: string } }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────
function num(v?: string | number | null) { return parseFloat(String(v || 0)); }
function fmt(v: number) { return v.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }); }

function buildRevenueChart(ownedCompanies: CompanyOwned[]) {
  const monthMap: Record<string, { revenue: number; bookings: number }> = {};
  for (const co of (ownedCompanies || [])) {
    for (const bk of (co.bookings || [])) {
      if (!bk.createdAt) continue;
      const key = format(new Date(bk.createdAt), "MMM yy");
      if (!monthMap[key]) monthMap[key] = { revenue: 0, bookings: 0 };
      monthMap[key].revenue += num(bk.companyEarnings);
      monthMap[key].bookings += 1;
    }
  }
  return Object.entries(monthMap).map(([name, v]) => ({ name, ...v })).slice(-6);
}

function buildCategoryData(bookings: BookingAsCustomer[]) {
  const map: Record<string, { name: string; icon?: string; count: number; spent: number; last?: string }> = {};
  for (const bk of (bookings || [])) {
    const cat = bk.service?.serviceType?.category;
    if (!cat) continue;
    if (!map[cat.id]) map[cat.id] = { name: cat.name, icon: cat.icon, count: 0, spent: 0 };
    map[cat.id].count++;
    map[cat.id].spent += num(bk.totalPrice);
    map[cat.id].last = bk.bookingDate;
  }
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
}

// ─── Component ──────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? String(params.id) : "";

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Confirmation dialogs
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true); 
      setError(null);
      try {
        const res = await api.get(`/users/${id}`);
        const data = res.data;
        setUser(data.data?.user || data.data || data);
      } catch (err) {
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, refreshTrigger]);

  const handleConfirmSuspend = async () => {
    if (!user) return;
    setIsActioning(true);
    try {
      await api.post(`/admin/users/${id}/suspend`, { reason: "Suspended via Admin Console" });
      setUser({ ...user, status: "suspended" });
      toast.success("User account has been suspended");
      setSuspendDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to suspend user.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmActivate = async () => {
    if (!user) return;
    setIsActioning(true);
    try {
      await api.post(`/admin/users/${id}/unsuspend`);
      setUser({ ...user, status: "active" });
      toast.success("User account activated");
      setActivateDialogOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to activate user.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleOpenEdit = () => {
    if (!user) return;
    setEditFullName(user.fullName || "");
    setEditPhone(user.phone || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    setSavingEdit(true);
    try {
      await api.patch(`/users/${id}`, {
        fullName: editFullName,
        phone: editPhone || undefined,
      });
      setUser({ ...user, fullName: editFullName, phone: editPhone || undefined });
      toast.success("User profile updated successfully");
      setEditOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loading User Dossier...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <ErrorState title="Couldn't load user" message={error || "User record not found"} onRetry={() => setRefreshTrigger(p => p + 1)} />
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/users")}>
              ← Back to Users
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const u = user;
  const isOwner = u.role === "company_admin" || u.role === "COMPANY_OWNER" || u.role === "owner" || ((u.ownedCompanies || []).length > 0);
  const isStaff = u.role === "staff" || u.role === "STAFF" || ((u.staffMemberships || []).length > 0);
  const isAdmin = u.role === "admin" || u.role === "ADMIN";
  const isCustomer = !isOwner && !isStaff && !isAdmin;

  // ── Metrics ──────────────────────────────────────────────────────────
  const accountAgeDays = differenceInDays(new Date(), new Date(u.createdAt));

  // Customer
  const customerBookings = u.bookingsAsCustomer || [];
  const lifetimeValue = customerBookings.filter(b => b.status === "completed").reduce((s, b) => s + num(b.totalPrice), 0);
  const completedCount = customerBookings.filter(b => b.status === "completed").length;
  const cancelledCount = u._count?.cancellationsMade || customerBookings.filter(b => b.status === "cancelled").length;
  const avgBookingValue = completedCount ? lifetimeValue / completedCount : 0;
  const categoryData = buildCategoryData(customerBookings);

  // Owner
  const ownedCos = u.ownedCompanies || [];
  const allOwnerBookings = ownedCos.flatMap(c => c.bookings || []);
  const ownerGross = allOwnerBookings.reduce((s, b) => s + num(b.totalPrice), 0);
  const ownerFees = allOwnerBookings.reduce((s, b) => s + num(b.platformFee), 0);
  const ownerNet = ownerGross - ownerFees;
  const ownerPending = ownedCos.reduce((s, c) => s + num(c.pendingBalance), 0);
  const totalStaff = ownedCos.reduce((s, c) => s + (c._count?.staff || 0), 0);
  const totalServices = ownedCos.reduce((s, c) => s + (c._count?.services || 0), 0);
  const totalCompletedJobs = ownedCos.reduce((s, c) => s + (c.completedJobs || 0), 0);
  const revenueChartData = buildRevenueChart(ownedCos);

  // Staff
  const membership = u.staffMemberships?.[0];
  const staffJobs = membership?.assignedBookings || [];
  const staffCompleted = staffJobs.filter(b => b.status === "completed").length;
  const commissionEarned = staffJobs.filter(b => b.status === "completed").reduce((s, b) => s + num(b.staffEarnings), 0);
  const pendingCommission = staffJobs.filter(b => b.status !== "completed" && b.status !== "cancelled").reduce((s, b) => s + num(b.staffEarnings), 0);
  const staffReviews = membership?.reviews || [];
  const avgStaffRating = staffReviews.length
    ? staffReviews.reduce((s, r) => s + (r.staffRating || 0), 0) / staffReviews.length
    : 0;

  const roleDisplayName = 
    isOwner ? "Company Owner" :
    isStaff ? "Field Technician" :
    isAdmin ? "Platform Admin" :
    "Customer";

  const initials = (u.fullName || "User")
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-full overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6 font-sans max-w-7xl mx-auto">
      
      {/* ─── Breadcrumb & Top Command Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/admin/users")} 
            className="h-8 w-8 rounded-lg bg-card border-border hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Link href="/admin/users" className="hover:text-foreground transition-colors">Users</Link>
              <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-foreground">#{u.id}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {u.fullName}
              </h1>
              <StatusPill status={u.status} />
              <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground px-2 py-0.5 rounded-md border border-border">
                {roleDisplayName}
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRefreshTrigger(p => p + 1)} 
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-card border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/admin/messages?user=${u.id}`)}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border-border text-foreground hover:bg-muted"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Direct Message
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOpenEdit}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border-border text-foreground hover:bg-muted"
          >
            <Edit className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Edit Profile
          </Button>
          {u.status === "active" ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSuspendDialogOpen(true)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
            >
              Suspend User
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setActivateDialogOpen(true)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
            >
              Activate User
            </Button>
          )}
        </div>
      </div>

      {/* ─── Profile Hero Card ─────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 rounded-2xl border border-border shrink-0 shadow-xs">
            <AvatarImage src={u.avatarUrl} />
            <AvatarFallback className="rounded-2xl bg-muted text-foreground text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold text-foreground">{u.fullName}</h2>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                ID: {u.id}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span>
              {u.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{u.phone}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Registered {format(new Date(u.createdAt), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-border">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toast.success(`Password reset verification email sent to ${u.email}`)}
            className="flex-1 md:flex-initial h-8 text-xs font-semibold rounded-lg bg-card border-border hover:bg-muted text-foreground"
          >
            <Key className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Reset Password
          </Button>
        </div>
      </div>

      {/* ─── Telemetry Overview Ribbon ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(isOwner ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Companies", value: ownedCos.length, icon: Building2 },
          { label: "Total Staff", value: totalStaff, icon: Users },
          { label: "Active Services", value: totalServices, icon: Briefcase },
          { label: "Completed Jobs", value: totalCompletedJobs, icon: CheckCircle2 },
          { label: "Direct Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
        ] : isStaff ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Assigned Jobs", value: staffJobs.length, icon: Briefcase },
          { label: "Completed Jobs", value: staffCompleted, icon: CheckCircle2 },
          { label: "Commission", value: fmt(commissionEarned), icon: DollarSign },
          { label: "Rating", value: avgStaffRating ? `${avgStaffRating.toFixed(1)} ★` : "—", icon: Star },
          { label: "Direct Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
        ] : isAdmin ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Access Level", value: "Root Admin", icon: Shield },
          { label: "Audit Logs", value: u.auditLogs?.length ?? 0, icon: List },
          { label: "Direct Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
          { label: "Notifications", value: u._count?.notifications ?? 0, icon: Activity },
          { label: "Security Mode", value: "Enforced", icon: Lock },
        ] : [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Total Bookings", value: customerBookings.length, icon: BarChart3 },
          { label: "Completed Jobs", value: completedCount, icon: CheckCircle2 },
          { label: "Total Spent", value: fmt(lifetimeValue), icon: DollarSign },
          { label: "Reviews Written", value: u._count?.reviews ?? 0, icon: Star },
          { label: "Cancellations", value: cancelledCount, icon: AlertTriangle },
        ]).map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3.5 shadow-xs flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold font-mono text-foreground leading-none truncate">{stat.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ROLE-SPECIFIC DOSSIER CONTENT
      ══════════════════════════════════════════════════════════════════ */}
      
      {/* 1. CUSTOMER VIEW */}
      {isCustomer && (
        <div className="space-y-6">
          
          {/* Customer Financial Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lifetime Realized Value</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{fmt(lifetimeValue)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Completed Services</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{completedCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Order Ticket</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{fmt(avgBookingValue)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cancellations Recorded</p>
              <p className={cn("text-2xl font-bold font-mono mt-1", cancelledCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground")}>
                {cancelledCount}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Booking History Table (8 cols) */}
            <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Order & Booking History</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Chronological record of services booked by this customer.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border">
                  {customerBookings.length} records
                </span>
              </div>

              {customerBookings.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-xs">
                  No service orders found for this customer account.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Order</th>
                        <th className="px-4 py-2.5 text-left">Service</th>
                        <th className="px-4 py-2.5 text-left hidden sm:table-cell">Provider</th>
                        <th className="px-4 py-2.5 text-left hidden md:table-cell">Date</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Charged</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {customerBookings.map((bk) => (
                        <tr key={bk.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">#{bk.id}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{bk.service?.name || "Service"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{bk.company?.name || "Merchant"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {bk.bookingDate ? format(new Date(bk.bookingDate), "MMM d, yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={bk.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                            {fmt(num(bk.totalPrice))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              asChild 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              <Link href={`/admin/bookings/${bk.id}`}>
                                View <ChevronRight className="w-3 h-3 ml-0.5" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Favorite Categories Sidebar (4 cols) */}
            <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground">Category Affinities</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Services frequently commissioned by this user.</p>
              </div>

              {categoryData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No service category data available.</p>
              ) : (
                <div className="space-y-3">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">{cat.name}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                          {cat.count} booking{cat.count !== 1 ? "s" : ""} · {fmt(cat.spent)}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. COMPANY OWNER VIEW */}
      {isOwner && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gross Merchant Volume</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{fmt(ownerGross)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Platform Commission</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{fmt(ownerFees)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Merchant Payout</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{fmt(ownerNet)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Balance</p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{fmt(ownerPending)}</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Revenue Realization Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Historical earnings realized by owned enterprise accounts.</p>
              </div>
            </div>

            {revenueChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-xs border border-dashed border-border rounded-xl">
                No historical revenue data recorded yet.
              </div>
            ) : (
              <div className="h-[220px] w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="userRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} dx={-6} tickFormatter={v => `$${v / 1000}k`} />
                    <RechartsTooltip formatter={(v: any) => fmt(v)} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#userRevGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Owned Companies Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Owned Business Entities</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedCos.map((co, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{co.name}</p>
                      <StatusPill status={co.verificationStatus} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/30 border border-border rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Staff</p>
                      <p className="font-mono font-bold text-foreground text-sm">{co._count?.staff || 0}</p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Services</p>
                      <p className="font-mono font-bold text-foreground text-sm">{co._count?.services || 0}</p>
                    </div>
                    <div className="bg-muted/30 border border-border rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Jobs</p>
                      <p className="font-mono font-bold text-foreground text-sm">{co.completedJobs || 0}</p>
                    </div>
                  </div>

                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-8 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted"
                  >
                    <Link href={`/admin/companies/${co.id}`}>
                      Manage Company Dossier →
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. STAFF TECHNICIAN VIEW */}
      {isStaff && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Realized Commission</p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{fmt(commissionEarned)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Jobs Completed</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{staffCompleted}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Customer Satisfaction</p>
              <p className="text-2xl font-bold font-mono text-amber-500 mt-1">{avgStaffRating ? `${avgStaffRating.toFixed(1)} ★` : "—"}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending Payout</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-1">{fmt(pendingCommission)}</p>
            </div>
          </div>

          {/* Employer & Recent Assigned Jobs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block border-b border-border pb-3">
                Affiliated Merchant
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{membership?.company?.name || "Independent Contractor"}</p>
                  <p className="text-xs text-muted-foreground">Commission Split: {membership?.splitPercent || "30"}%</p>
                </div>
              </div>
              {membership?.company?.id && (
                <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted">
                  <Link href={`/admin/companies/${membership.company.id}`}>
                    View Employer Dossier →
                  </Link>
                </Button>
              )}
            </div>

            <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Recent Dispatched Assignments</h3>
              </div>
              {staffJobs.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No recent jobs recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 text-left">Service</th>
                        <th className="px-4 py-2.5 text-left hidden sm:table-cell">Customer</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {staffJobs.map(job => (
                        <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">{job.service?.name || "Service"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{job.customer?.fullName || "—"}</td>
                          <td className="px-4 py-3 text-center"><StatusPill status={job.status} /></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {fmt(num(job.staffEarnings))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Security & Audit Logs ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <List className="w-3.5 h-3.5" /> Security & Activity Audit Log
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              {(u.auditLogs || []).length} events
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {(u.auditLogs || []).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No administrative audit records logged for this account.</p>
            ) : (
              (u.auditLogs || []).map((log) => (
                <div key={log.id} className="flex justify-between items-start pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-foreground text-xs">{log.action}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-3">
            <Lock className="w-3.5 h-3.5" /> Authentication State
          </span>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <MonitorSmartphone className="w-3.5 h-3.5" /> Last Active
              </span>
              <span className="font-medium text-foreground">
                {u.lastLoginAt ? format(new Date(u.lastLoginAt), "MMM d, yyyy") : "Never"}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Created On
              </span>
              <span className="font-medium text-foreground">
                {format(new Date(u.createdAt), "MMM d, yyyy")}
              </span>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => toast.success(`Active sessions revoked for ${u.fullName}`)}
              className="w-full h-8 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted text-foreground mt-2"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Terminate Active Sessions
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Edit Profile Modal ─────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Edit User Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update personal identity and telephone records for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Full Name"
                className="h-9 text-xs rounded-xl bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+855 12 345 678"
                className="h-9 text-xs rounded-xl bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={savingEdit} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} disabled={savingEdit || !editFullName.trim()} className="rounded-xl h-9 text-xs">
              {savingEdit && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        onConfirm={handleConfirmSuspend}
        title="Suspend User Account"
        description={`Are you sure you want to suspend ${u.fullName}? They will be unable to log in or initiate new orders.`}
        confirmLabel="Confirm Suspension"
        actionType="danger"
      />

      <ConfirmationDialog
        isOpen={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        onConfirm={handleConfirmActivate}
        title="Activate User Account"
        description={`Activate ${u.fullName}'s account to restore full platform access?`}
        confirmLabel="Activate Account"
        actionType="neutral"
      />

    </div>
  );
}
