"use client";

import { useEffect, useState, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, 
  CheckCircle, XCircle, Timer, Loader2, ShieldCheck, 
  Building2, MessageSquare, Activity, ShieldAlert,
  CreditCard, Briefcase, FileText, Download, UserPlus, Phone,
  ChevronRight, ExternalLink, AlertTriangle, AlertCircle, RefreshCw,
  Percent, ArrowUpRight
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/StatusPill";
import { UserDrawer } from "@/components/drawers/UserDrawer";
import { CompanyDrawer } from "@/components/drawers/CompanyDrawer";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AdminBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Drawer States
  const [customerDrawerOpen, setCustomerDrawerOpen] = useState(false);
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false);
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);

  // Modal States
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  const [assignStaffModalOpen, setAssignStaffModalOpen] = useState(false);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const bookingId = params?.id ? String(params.id) : "";

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const payload = res.data?.data || res.data;
        setBooking(payload.booking || payload);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load booking details.", variant: "destructive" });
        router.push("/admin/bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, router, toast, refreshTrigger]);

  const fetchCompanyStaff = async (companyId: string) => {
    try {
      const res = await api.get(`/companies/${companyId}/staff`);
      const payload = res.data?.data || res.data;
      setAvailableStaff(payload.staff || payload);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load staff for assignment", variant: "destructive" });
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      return toast({ title: "Error", description: "Cancellation reason is required", variant: "destructive" });
    }
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${booking.id}/cancel`, { reason: cancelReason });
      toast({ title: "Success", description: "Booking cancelled successfully" });
      setCancelModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to cancel", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!newStatus) return toast({ title: "Error", description: "Please select a status", variant: "destructive" });
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${booking.id}/status`, { status: newStatus });
      toast({ title: "Success", description: "Booking status updated" });
      setStatusModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update status", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffId) return toast({ title: "Error", description: "Please select a staff member", variant: "destructive" });
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${booking.id}/assign-staff`, { staffId: selectedStaffId });
      toast({ title: "Success", description: "Staff assigned successfully" });
      setAssignStaffModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to assign staff", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Loading Booking Dossier...</p>
      </div>
    );
  }

  if (!booking) return null;

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (start?: string, end?: string) => {
    if (!start) return "N/A";
    const cleanTime = (t: string) => {
      if (!t) return "";
      if (t.includes("T")) {
        const parts = t.split("T");
        return parts[1] ? parts[1].slice(0, 5) : t;
      }
      return t.slice(0, 5);
    };
    return end ? `${cleanTime(start)} - ${cleanTime(end)}` : cleanTime(start);
  };

  const isAssigned = !!booking.assignedStaff;

  return (
    <div className="h-full overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6 font-sans max-w-7xl mx-auto">
      
      {/* ─── Breadcrumb & Top Command Bar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push("/admin/bookings")} 
            className="h-8 w-8 rounded-lg bg-card border-border hover:bg-muted shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Link href="/admin/bookings" className="hover:text-foreground transition-colors">Bookings</Link>
              <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
              <span className="text-foreground">#{booking.id}</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-foreground tracking-tight">
                Order #{booking.id}
              </h1>
              <StatusPill status={booking.status} />
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRefreshTrigger(prev => prev + 1)} 
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-card border-border text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setStatusModalOpen(true)}
            className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border-border text-foreground hover:bg-muted"
          >
            Override Status
          </Button>
          {booking.status !== "cancelled" && booking.status !== "completed" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCancelModalOpen(true)}
              className="h-8 px-3 text-xs font-semibold rounded-lg border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
            >
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* ─── Telemetry Overview Ribbon ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold font-mono text-foreground leading-none">${Number(booking.totalPrice).toFixed(2)}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Customer Total</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
              ${Number(booking.platformFee).toFixed(2)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Platform Take (10%)</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold font-mono text-foreground leading-none">
              ${Number(booking.companyEarnings).toFixed(2)}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1 truncate">Merchant Net</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate leading-none">
              {formatDate(booking.bookingDate)}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-1 truncate">
              {formatTime(booking.startTime, booking.endTime)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: Dossier & Sidebar ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Service Information Card */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Booked Service Details
              </span>
              <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">
                {booking.service?.durationMin || 60} MIN DURATION
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-20 h-20 rounded-xl bg-muted/60 border border-border flex items-center justify-center shrink-0 overflow-hidden">
                {booking.service?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.service.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <h2 className="text-base font-bold text-foreground">{booking.service?.name || "Service Item"}</h2>
                  <p className="text-base font-bold font-mono text-foreground">${Number(booking.service?.basePrice || booking.totalPrice).toFixed(2)}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {booking.service?.serviceType?.name || "Standard Maintenance"}
                  {booking.service?.serviceType?.category?.name ? ` • ${booking.service.serviceType.category.name}` : ""}
                </p>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-medium truncate">{booking.serviceAddress || "Local Service Address"}</span>
                </div>
              </div>
            </div>

            {booking.customerNotes && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-400 mt-2">
                <span className="font-bold block uppercase tracking-wider text-[10px] mb-1">Customer Note</span>
                "{booking.customerNotes}"
              </div>
            )}
          </div>

          {/* Operational Parties Grid: Customer & Provider/Staff */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Customer Entity Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Customer Dossier
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCustomerDrawerOpen(true)}
                  className="h-6 px-2 text-[11px] font-semibold text-foreground hover:bg-muted"
                >
                  Quick Drawer <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 rounded-xl border border-border">
                  <AvatarImage src={booking.customer?.avatarUrl} />
                  <AvatarFallback className="rounded-xl bg-muted text-foreground font-bold text-sm">
                    {booking.customer?.fullName?.[0] || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{booking.customer?.fullName || "Customer"}</p>
                  <p className="text-xs text-muted-foreground truncate">{booking.customer?.email || "No email"}</p>
                  {booking.customer?.phone && (
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{booking.customer.phone}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button 
                  asChild
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-8 text-xs font-semibold rounded-lg bg-card border-border hover:bg-muted"
                >
                  <Link href={`/admin/users/${booking.customer?.id || booking.customerId}`}>
                    Full Profile ↗
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/admin/messages?user=${booking.customer?.id || booking.customerId}`)}
                  className="h-8 px-3 text-xs font-semibold rounded-lg bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Provider & Assigned Technician Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Provider & Technician
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCompanyDrawerOpen(true)}
                  className="h-6 px-2 text-[11px] font-semibold text-foreground hover:bg-muted"
                >
                  Quick Drawer <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {booking.company?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.company.logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{booking.company?.name || "Merchant Company"}</p>
                    <p className="text-xs text-muted-foreground">{booking.company?.phone || "Phone on file"}</p>
                  </div>
                </div>

                {/* Staff Sub-Card */}
                <div className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
                  {booking.assignedStaff ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 rounded-lg border border-border">
                        <AvatarImage src={booking.assignedStaff.user?.avatarUrl} />
                        <AvatarFallback className="rounded-lg bg-muted text-foreground text-xs font-bold">
                          {booking.assignedStaff.user?.fullName?.[0] || "T"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{booking.assignedStaff.user?.fullName}</p>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Field Technician</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-xs font-semibold text-muted-foreground">No Technician Assigned</span>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      fetchCompanyStaff(booking.companyId);
                      setAssignStaffModalOpen(true);
                    }}
                    className="h-7 px-2.5 text-[11px] font-bold rounded-lg bg-card border-border hover:bg-muted"
                  >
                    {booking.assignedStaff ? "Reassign" : "Assign"}
                  </Button>
                </div>
              </div>

              <div className="pt-1">
                <Button 
                  asChild
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs font-semibold rounded-lg bg-card border-border hover:bg-muted"
                >
                  <Link href={`/admin/companies/${booking.company?.id || booking.companyId}`}>
                    Full Company Dossier ↗
                  </Link>
                </Button>
              </div>
            </div>

          </div>

          {/* Status & Lifecycle Timeline */}
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Order Audit Log & Timeline
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Created: {new Date(booking.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 pl-1">
              <div className="flex items-start gap-3 relative pb-4 border-l border-border pl-4 last:border-0 last:pb-0">
                <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground">Order Initialized</p>
                  <p className="text-[11px] text-muted-foreground">Order was placed and queued in dispatch ledger.</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {(booking.statusLogs || []).map((log: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3 relative pb-4 border-l border-border pl-4 last:border-0 last:pb-0">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-foreground/60" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground capitalize">
                      Transition: {log.newStatus?.replace('_', ' ') || log.status?.replace('_', ' ') || 'Status Updated'}
                    </p>
                    {log.comment && <p className="text-[11px] text-muted-foreground">"{log.comment}"</p>}
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{new Date(log.changedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Financial Breakdown Card */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <CreditCard className="w-3.5 h-3.5" /> Financial Settlement
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Service Base Price</span>
                <span className="font-mono text-foreground font-semibold">
                  ${Number(booking.service?.basePrice || booking.totalPrice).toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1">
                  Platform Fee
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 rounded">10%</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  +${Number(booking.platformFee).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="font-bold text-foreground">Total Customer Charged</span>
                <span className="text-base font-bold font-mono text-foreground">
                  ${Number(booking.totalPrice).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Merchant Settlement</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  ${Number(booking.companyEarnings).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Dispatch Actions */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <Activity className="w-3.5 h-3.5" /> Administrative Actions
            </span>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                onClick={() => setStatusModalOpen(true)}
                className="w-full justify-start h-9 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted text-foreground"
              >
                <Activity className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Change Booking Status
              </Button>

              <Button 
                variant="outline" 
                onClick={() => {
                  fetchCompanyStaff(booking.companyId);
                  setAssignStaffModalOpen(true);
                }}
                className="w-full justify-start h-9 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted text-foreground"
              >
                <UserPlus className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                {booking.assignedStaff ? "Reassign Field Technician" : "Assign Field Technician"}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => router.push(`/admin/messages?user=${booking.customerId}`)}
                className="w-full justify-start h-9 text-xs font-semibold rounded-xl bg-card border-border hover:bg-muted text-foreground"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                Direct Message Customer
              </Button>

              {booking.status !== "cancelled" && (
                <Button 
                  variant="outline" 
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full justify-start h-9 text-xs font-semibold rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10"
                >
                  <XCircle className="w-3.5 h-3.5 mr-2" />
                  Cancel & Void Booking
                </Button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ─── DRAWERS ────────────────────────────────────────────────────── */}
      {booking.customer && (
        <UserDrawer 
          open={customerDrawerOpen} 
          onClose={() => setCustomerDrawerOpen(false)} 
          user={{
            id: booking.customer.id?.toString() || "",
            fullName: booking.customer.fullName || "Customer",
            email: booking.customer.email || "",
            phone: booking.customer.phone || null,
            role: "customer",
            status: "active",
            createdAt: booking.createdAt,
          }} 
        />
      )}
      {booking.company && (
        <CompanyDrawer 
          open={companyDrawerOpen} 
          onClose={() => setCompanyDrawerOpen(false)} 
          company={{
            id: booking.company.id?.toString() || "",
            name: booking.company.name || "Company",
            owner: typeof booking.company.owner === 'object' ? booking.company.owner?.fullName : (booking.company.owner || "Owner"),
            ownerEmail: typeof booking.company.owner === 'object' ? booking.company.owner?.email : (booking.company.email || ""),
            phone: booking.company.phone || "",
            staffCount: 0,
            platformFee: 15,
            rating: 5,
            totalRevenue: 0,
            totalBookings: 0,
            status: "active",
            joinedDate: booking.createdAt,
            verified: true,
            services: [],
            documents: [],
            logoUrl: booking.company.logoUrl,
          }} 
        />
      )}
      {booking.assignedStaff && (
        <StaffDrawer 
          open={staffDrawerOpen} 
          onClose={() => setStaffDrawerOpen(false)} 
          staff={{
            id: booking.assignedStaff.id?.toString() || "",
            name: booking.assignedStaff.user?.fullName || booking.assignedStaff.name || "Assigned Staff",
            role: booking.assignedStaff.role || "worker",
            status: booking.assignedStaff.status || "active",
            phone: booking.assignedStaff.user?.phone || booking.assignedStaff.phone || "",
            currentLocation: "Phnom Penh",
            jobsCompleted: booking.assignedStaff.jobsCompleted ?? 0,
            pendingPayout: booking.assignedStaff.pendingPayout ?? 0,
            splitPercent: booking.assignedStaff.splitPercent ?? null,
            compliance: [],
            schedule: [],
          }} 
        />
      )}

      {/* ─── MODALS ─────────────────────────────────────────────────────── */}
      {/* Cancel Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Cancel Booking</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please provide an administrative reason for cancelling this booking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cancellation Reason</Label>
              <Textarea 
                placeholder="e.g. Customer requested cancellation via phone" 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)} 
                className="text-xs rounded-xl border-border bg-background min-h-[90px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)} disabled={actionLoading} className="rounded-xl h-9 text-xs">
              Nevermind
            </Button>
            <Button variant="destructive" size="sm" onClick={handleCancelBooking} disabled={actionLoading || !cancelReason.trim()} className="rounded-xl h-9 text-xs">
              {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />} Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Change Booking Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Override the lifecycle state of this booking in the dispatch database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">New State</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background border-border">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)} disabled={actionLoading} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleChangeStatus} disabled={actionLoading || !newStatus} className="rounded-xl h-9 text-xs">
              {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />} Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Modal */}
      <Dialog open={assignStaffModalOpen} onOpenChange={setAssignStaffModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Assign Field Technician</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an authorized technician from the service provider's workforce.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Technician</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-background border-border">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableStaff.map((staff: any) => (
                    <SelectItem key={staff.id} value={String(staff.id)}>
                      {staff.user?.fullName} ({staff.role || "Technician"})
                    </SelectItem>
                  ))}
                  {availableStaff.length === 0 && (
                    <SelectItem value="none" disabled>No technicians registered with company</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAssignStaffModalOpen(false)} disabled={actionLoading} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssignStaff} disabled={actionLoading || !selectedStaffId || selectedStaffId === 'none'} className="rounded-xl h-9 text-xs">
              {actionLoading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />} Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
