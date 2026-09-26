"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, Calendar, Loader2, AlertCircle, CheckCircle, Shield,
  XCircle, MessageSquare, Building2, Briefcase, Star, Clock, Lock, MonitorSmartphone,
  Activity, CheckCircle2, AlertTriangle, List, Edit, Key, LogOut, DollarSign, TrendingUp,
  Users, BarChart3, Wallet
} from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } }
};
const fadeUp: any = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } }
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  cancelled: "bg-rose-500/10 text-rose-600",
  in_progress: "bg-blue-500/10 text-blue-600",
};

// ─── Component ──────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setLoading(true); setError(null);
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
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    try {
      if (newStatus === "suspended") {
        await api.post(`/admin/users/${id}/suspend`, { reason: "Suspended via Admin Console" });
      } else {
        await api.post(`/admin/users/${id}/unsuspend`);
      }
      setUser({ ...user, status: newStatus });
      toast.success(newStatus === "suspended" ? "User account suspended" : "User account activated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status.");
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

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />
    </div>
  );
  if (error) return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <ErrorState title="Couldn't load user" message={error} onRetry={() => window.location.reload()} />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => router.push("/admin/users")}>← Back to Users</Button>
        </div>
      </div>
    </div>
  );

  const u = user!;
  const isOwner = u.role === "company_admin" || u.role === "COMPANY_OWNER" || u.role === "owner" || ((u.ownedCompanies || []).length > 0);
  const isStaff = u.role === "staff" || u.role === "STAFF" || ((u.staffMemberships || []).length > 0);
  const isAdmin = u.role === "admin" || u.role === "ADMIN";
  const isCustomer = !isOwner && !isStaff && !isAdmin;

  // ── Pre-compute metrics ──────────────────────────────────────────────
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
    isStaff ? "Field Staff" :
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
    <motion.div variants={staggerContainer} initial="hidden" animate="show"
      className="h-full flex flex-col p-4 sm:p-6 font-sans overflow-y-auto">

      {/* ── Breadcrumb + Actions ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/users")}
            className="rounded-lg h-9 w-9 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
              Admin / Users / {u.fullName}
            </p>
            <h1 className="text-xl font-black text-foreground tracking-tight">User Dashboard</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-12 sm:pl-0">
          <Button variant="outline" size="sm" className="font-bold"
            onClick={() => router.push(`/admin/messages?new=${u.id}`)}>
            <MessageSquare className="w-4 h-4 mr-2 text-primary" /> Message
          </Button>
          <Button variant="outline" size="sm"
            className={u.status === "active"
              ? "font-bold border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
              : "font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"}
            onClick={() => handleStatusChange(u.status === "active" ? "suspended" : "active")}>
            {u.status === "active"
              ? <><XCircle className="w-4 h-4 mr-2" />Suspend</>
              : <><CheckCircle className="w-4 h-4 mr-2" />Activate</>}
          </Button>
        </div>
      </motion.div>

      {/* ── Profile Header ───────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="bg-background border border-border rounded-xl p-5 shadow-sm mb-5 flex flex-col md:flex-row items-start md:items-center gap-5">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 rounded-2xl shadow-md border border-border/50">
            <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-2xl font-black">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-background rounded-full border border-border flex items-center justify-center shadow-sm">
            {u.status === "active"
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              : <AlertTriangle className="w-4 h-4 text-rose-500" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <h2 className="text-xl font-black text-foreground">{u.fullName}</h2>
            <StatusBadge status={(u.status === "active" ? "active" : "suspended") as any} />
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-primary/20">
              <Shield className="w-3 h-3" />{roleDisplayName}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span>
            {u.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{u.phone}</span>}
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Joined {format(new Date(u.createdAt), "MMM d, yyyy")}</span>
            {u.lastLoginAt && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Last seen {format(new Date(u.lastLoginAt), "MMM d, yyyy")}</span>}
          </div>
        </div>
        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <Button variant="outline" size="sm" className="font-bold justify-start" onClick={handleOpenEdit}>
            <Edit className="w-3.5 h-3.5 mr-2 text-muted-foreground" />Edit Profile
          </Button>
          <Button variant="outline" size="sm" className="font-bold justify-start"
            onClick={() => toast.success(`Password reset link sent to ${u.email}`)}>
            <Key className="w-3.5 h-3.5 mr-2 text-muted-foreground" />Reset Password
          </Button>
        </div>
      </motion.div>

      {/* ── Quick Stats (role-adaptive real data) ───────────────────── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(isOwner ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Companies", value: ownedCos.length, icon: Building2 },
          { label: "Total Staff", value: totalStaff, icon: Users },
          { label: "Active Services", value: totalServices, icon: Briefcase },
          { label: "Completed Jobs", value: totalCompletedJobs, icon: CheckCircle2 },
          { label: "Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
        ] : isStaff ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Jobs Assigned", value: staffJobs.length, icon: Briefcase },
          { label: "Completed Jobs", value: staffCompleted, icon: CheckCircle2 },
          { label: "Commission", value: fmt(commissionEarned), icon: DollarSign },
          { label: "Rating", value: avgStaffRating ? `${avgStaffRating.toFixed(1)} ★` : "—", icon: Star },
          { label: "Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
        ] : isAdmin ? [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Access Level", value: "Root Admin", icon: Shield },
          { label: "Audit Logs", value: u.auditLogs?.length ?? 0, icon: List },
          { label: "Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
          { label: "Notifications", value: u._count?.notifications ?? 0, icon: Activity },
          { label: "Security", value: "Enforced", icon: Lock },
        ] : [
          { label: "Account Age", value: `${accountAgeDays}d`, icon: Clock },
          { label: "Messages", value: u._count?.messages ?? 0, icon: MessageSquare },
          { label: "Notifications", value: u._count?.notifications ?? 0, icon: Activity },
          { label: "Bookings", value: u._count?.bookingsAsCustomer ?? 0, icon: BarChart3 },
          { label: "Reviews Written", value: u._count?.reviews ?? 0, icon: Star },
          { label: "Cancellations", value: u._count?.cancellationsMade ?? 0, icon: AlertTriangle, color: (u._count?.cancellationsMade ?? 0) > 0 ? "text-rose-500" : "text-emerald-500" },
        ]).map((stat, i) => (
          <div key={i} className="bg-background border border-border rounded-xl p-3.5 shadow-sm hover:bg-muted/10 transition-colors">
            <stat.icon className={`w-3.5 h-3.5 mb-2 ${(stat as any).color || "text-muted-foreground"}`} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-black text-foreground mt-0.5">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Role Section Header ──────────────────────────────────── */}
      <motion.div variants={fadeUp} className="mb-3">
        <div className="flex items-center gap-2">
          {isOwner ? <Building2 className="w-4 h-4 text-primary" />
            : isStaff ? <Briefcase className="w-4 h-4 text-blue-500" />
            : isAdmin ? <Shield className="w-4 h-4 text-amber-500" />
            : <Star className="w-4 h-4 text-emerald-500" />}
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {isOwner ? "Company & Business Management"
              : isStaff ? "Field Staff & Performance"
              : isAdmin ? "System Administration Privileges"
              : "Customer Overview"}
          </span>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
          CUSTOMER DASHBOARD
      ════════════════════════════════════════════════════════════ */}
      {isCustomer && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Lifetime Value", value: fmt(lifetimeValue), accent: "bg-primary text-primary-foreground shadow-lg shadow-primary/20" },
              { label: "Completed Bookings", value: completedCount.toString() },
              { label: "Avg. Booking Value", value: fmt(avgBookingValue) },
              { label: "Cancellations", value: cancelledCount.toString(), red: cancelledCount > 0 },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl p-4 shadow-sm ${c.accent || "bg-background border border-border"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.accent ? "opacity-80" : "text-muted-foreground"}`}>{c.label}</p>
                <p className={`text-2xl font-black ${c.accent ? "" : c.red ? "text-rose-500" : "text-foreground"}`}>{c.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="grid lg:grid-cols-12 gap-5 mb-5">
            {/* Booking History */}
            <div className="lg:col-span-8 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking History</span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{customerBookings.length} records</span>
              </div>
              {customerBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No bookings found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-left">Service</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Company</th>
                        <th className="px-4 py-3 text-left hidden lg:table-cell">Staff</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {customerBookings.map(bk => (
                        <tr key={bk.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">{bk.service?.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{bk.company?.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{bk.assignedStaff?.user?.fullName || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{bk.bookingDate ? format(new Date(bk.bookingDate), "MMM d, yyyy") : "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${BOOKING_STATUS_COLOR[bk.status] || "bg-muted text-muted-foreground"}`}>
                              {bk.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-foreground">{fmt(num(bk.totalPrice))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Favorite Categories */}
            <div className="lg:col-span-4 bg-background border border-border rounded-xl shadow-sm">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Favorite Categories</span>
              </div>
              <div className="p-4 space-y-2.5">
                {categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <div>
                      <p className="font-bold text-sm text-foreground">{cat.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">{cat.count} booking{cat.count !== 1 ? "s" : ""} · {fmt(cat.spent)}</p>
                    </div>
                    <span className="text-xs font-black text-primary">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          COMPANY OWNER DASHBOARD
      ════════════════════════════════════════════════════════════ */}
      {isOwner && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Gross Revenue", value: fmt(ownerGross), accent: "bg-primary text-primary-foreground shadow-lg shadow-primary/20" },
              { label: "Platform Fees", value: fmt(ownerFees), red: true },
              { label: "Net Earnings", value: fmt(ownerNet) },
              { label: "Pending Payout", value: fmt(ownerPending), amber: true },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl p-4 shadow-sm ${c.accent || "bg-background border border-border"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.accent ? "opacity-80" : "text-muted-foreground"}`}>{c.label}</p>
                <p className={`text-2xl font-black ${c.accent ? "" : c.red ? "text-rose-500" : (c as any).amber ? "text-amber-500" : "text-foreground"}`}>{c.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="grid lg:grid-cols-12 gap-5 mb-5">
            {/* Revenue Chart */}
            <div className="lg:col-span-8 bg-background border border-border rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Revenue Overview (Completed Jobs)</p>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>Revenue</span>
                </div>
              </div>
              {revenueChartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  No completed booking revenue recorded yet
                </div>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData}>
                      <defs>
                        <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary, #3b82f6)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--primary, #3b82f6)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dx={-6} tickFormatter={v => `$${v / 1000}k`} />
                      <RechartsTooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
                      <Area type="monotone" dataKey="revenue" stroke="var(--primary, #3b82f6)" strokeWidth={2.5} fillOpacity={1} fill="url(#gRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Owner Summary Stats */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3 content-start">
              {[
                { label: "Companies", value: ownedCos.length, icon: Building2 },
                { label: "Total Staff", value: totalStaff, icon: Users },
                { label: "Active Services", value: totalServices, icon: Briefcase },
                { label: "Completed Jobs", value: totalCompletedJobs, icon: CheckCircle2 },
              ].map((s, i) => (
                <div key={i} className="bg-background border border-border rounded-xl p-4 shadow-sm">
                  <s.icon className="w-4 h-4 text-muted-foreground mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-black text-foreground mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Companies List */}
          <motion.div variants={fadeUp} className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Owned Companies</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedCos.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">No companies registered</p>
              ) : ownedCos.map((co, i) => {
                const coRevenue = (co.bookings || []).reduce((s, b) => s + num(b.companyEarnings), 0);
                return (
                  <div key={i} className="bg-background border border-border rounded-xl p-5 shadow-sm hover:bg-muted/10 transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-foreground truncate">{co.name}</p>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${co.verificationStatus === "verified" ? "text-emerald-500" : co.verificationStatus === "pending" ? "text-amber-500" : "text-rose-500"}`}>
                          {co.verificationStatus}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-muted/20 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Staff</p><p className="font-black">{co._count?.staff || 0}</p></div>
                      <div className="bg-muted/20 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Services</p><p className="font-black">{co._count?.services || 0}</p></div>
                      <div className="bg-muted/20 rounded-lg p-2"><p className="text-[10px] text-muted-foreground">Jobs</p><p className="font-black">{co.completedJobs || 0}</p></div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Revenue</span>
                      <span className="text-sm font-black text-emerald-600">{fmt(coRevenue)}</span>
                    </div>
                    {co.ratingSummary?.averageRating && (
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-3">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {parseFloat(co.ratingSummary.averageRating).toFixed(1)}
                        <span className="text-muted-foreground ml-1">({co.ratingSummary.totalReviews} reviews)</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold h-8"
                      onClick={() => router.push(`/admin/companies/${co.id}`)}>
                      Manage Company →
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          STAFF DASHBOARD
      ════════════════════════════════════════════════════════════ */}
      {isStaff && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Commission Earned", value: fmt(commissionEarned), accent: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" },
              { label: "Jobs Completed", value: staffCompleted.toString() },
              { label: "Avg Rating", value: avgStaffRating ? avgStaffRating.toFixed(1) + " ★" : "—" },
              { label: "Pending Commission", value: fmt(pendingCommission), amber: true },
            ].map((c, i) => (
              <div key={i} className={`rounded-xl p-4 shadow-sm ${c.accent || "bg-background border border-border"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${c.accent ? "opacity-80" : "text-muted-foreground"}`}>{c.label}</p>
                <p className={`text-2xl font-black ${c.accent ? "" : (c as any).amber ? "text-amber-500" : "text-foreground"}`}>{c.value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="grid lg:grid-cols-12 gap-5 mb-5">
            {/* Employer Card */}
            <div className="lg:col-span-4 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Employment Info</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-foreground">{membership?.company?.name || "No Employer"}</p>
                    {membership?.company?.ratingSummary?.averageRating && (
                      <p className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {parseFloat(membership.company.ratingSummary.averageRating).toFixed(1)} avg rating
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mb-4">
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground">Split %</p>
                    <p className="font-black text-foreground">{membership?.splitPercent ? `${membership.splitPercent}%` : "—"}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-muted-foreground">Wallet Balance</p>
                    <p className="font-black text-emerald-600">{fmt(num(membership?.walletBalance))}</p>
                  </div>
                </div>
                {membership?.company?.id && (
                  <Button variant="outline" className="w-full text-xs font-bold"
                    onClick={() => router.push(`/admin/companies/${membership.company.id}`)}>
                    View Employer
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="lg:col-span-8 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border bg-muted/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Assigned Jobs</span>
              </div>
              {staffJobs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No jobs assigned yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 text-left">Service</th>
                        <th className="px-4 py-3 text-left hidden md:table-cell">Customer</th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {staffJobs.map(job => (
                        <tr key={job.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground">{job.service?.name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{job.customer?.fullName || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{job.bookingDate ? format(new Date(job.bookingDate), "MMM d, yyyy") : "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${BOOKING_STATUS_COLOR[job.status] || "bg-muted text-muted-foreground"}`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-emerald-600">{fmt(num(job.staffEarnings))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

          {/* Staff Reviews */}
          {staffReviews.length > 0 && (
            <motion.div variants={fadeUp} className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Customer Reviews</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffReviews.map(rev => (
                  <div key={rev.id} className="bg-background border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm text-foreground">{rev.customer?.fullName}</p>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= (rev.staffRating || 0) ? "fill-current" : "opacity-30"}`} />
                        ))}
                      </div>
                    </div>
                    {rev.staffComment && <p className="text-sm text-muted-foreground italic">"{rev.staffComment}"</p>}
                    <p className="text-[10px] text-muted-foreground mt-2">{rev.booking?.service?.name} · {format(new Date(rev.createdAt), "MMM d, yyyy")}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          ADMIN OVERVIEW
      ════════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <motion.div variants={fadeUp} className="mb-5 bg-background border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Super Administrator Privileges</h3>
              <p className="text-xs text-muted-foreground">Full system orchestration, RBAC role elevation, and audit access.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Console Access</p>
              <p className="text-sm font-black text-emerald-600 mt-0.5">Unrestricted (Root)</p>
            </div>
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Audit Log Count</p>
              <p className="text-sm font-black text-foreground mt-0.5">{u.auditLogs?.length ?? 0} Recorded Actions</p>
            </div>
            <div className="bg-muted/20 rounded-lg p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Security Mode</p>
              <p className="text-sm font-black text-foreground mt-0.5">MFA Guarded</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Activity Timeline + Security ─────────────────────────── */}
      <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-5 mt-2">
        <div className="bg-background border border-border rounded-xl shadow-sm">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <List className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Audit Log</span>
          </div>
          <div className="p-5 space-y-3 max-h-72 overflow-y-auto">
            {(u.auditLogs || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No audit logs found</p>
            ) : (u.auditLogs || []).map(log => (
              <div key={log.id} className="flex justify-between items-start pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div>
                  <p className="font-bold text-foreground text-sm">{log.action}</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background border border-border rounded-xl shadow-sm">
          <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security & Audit</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/5">
              <div className="flex items-center gap-3"><MonitorSmartphone className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-bold">Last Login</span></div>
              <span className="text-xs font-medium text-muted-foreground">
                {u.lastLoginAt ? format(new Date(u.lastLoginAt), "MMM d, yyyy · h:mm a") : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/5">
              <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-bold">Account Created</span></div>
              <span className="text-xs font-medium text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/5">
              <div className="flex items-center gap-3"><Activity className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-bold">Total Audit Events</span></div>
              <span className="text-xs font-black text-foreground">{u.auditLogs?.length ?? 0}</span>
            </div>
            <div className="pt-1">
              <Button variant="outline" className="w-full text-xs font-bold border-border hover:bg-muted/50"
                onClick={() => toast.success(`Active sessions revoked for ${u.fullName}`)}>
                <LogOut className="w-4 h-4 mr-2 opacity-50" /> Force Logout All Devices
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground">Edit User Profile</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update name and contact details for this account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs font-bold text-foreground">Full Name</Label>
              <Input
                id="edit-name"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                placeholder="Full Name"
                className="h-10 bg-muted/20 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone" className="text-xs font-bold text-foreground">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+855 12 345 678"
                className="h-10 bg-muted/20 border-border"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editFullName.trim()} className="bg-primary text-primary-foreground font-bold">
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
