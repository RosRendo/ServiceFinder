"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Calendar, Clock, MapPin, User, DollarSign, 
  CheckCircle, XCircle, Timer, Loader2, ShieldCheck, 
  Building2, MessageSquare, Activity, ShieldAlert,
  CreditCard, Briefcase, FileText, Download, UserPlus, Phone
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserDrawer } from "@/components/drawers/UserDrawer";
import { CompanyDrawer } from "@/components/drawers/CompanyDrawer";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "Pending", icon: Timer },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "Confirmed", icon: CheckCircle },
  in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20", label: "In Progress", icon: Clock },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", label: "Completed", icon: ShieldCheck },
  cancelled: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", label: "Cancelled", icon: XCircle },
};

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

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${params.id}`);
        const payload = res.data?.data || res.data;
        setBooking(payload.booking || payload);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load booking details.", variant: "destructive" });
        router.push("/admin/bookings");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchBooking();
  }, [params.id, router, toast, refreshTrigger]);

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
    if (!cancelReason.trim()) return toast({ title: "Error", description: "Cancellation reason is required", variant: "destructive" });
    setActionLoading(true);
    try {
      await api.patch(`/bookings/${booking.id}/cancel`, { reason: cancelReason });
      toast({ title: "Success", description: "Booking cancelled successfully" });
      setCancelModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to cancel", variant: "destructive" });
    } finally { setActionLoading(false); }
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
    } finally { setActionLoading(false); }
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
    } finally { setActionLoading(false); }
  };

  const handleSimulatedAction = (actionName: string) => {
    toast({ title: "Action Simulated", description: `${actionName} triggered successfully (UI Only)` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!booking) return null;

  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/20">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border shrink-0 z-10 sticky top-0">
        <div className="px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-foreground">Booking <span className="text-violet-500 font-mono text-lg">#{booking.id}</span></h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>
            
            <div className="flex items-center gap-6 ml-11 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Created: {new Date(booking.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="font-medium text-foreground">
                  Scheduled: {formatDate(booking.bookingDate)} • {formatTime(booking.startTime, booking.endTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Scrolling Content Container ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service Info */}
            <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-violet-500" /> Service Information
              </h3>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                  {booking.service?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={booking.service.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : <Building2 className="w-8 h-8 text-muted-foreground opacity-50" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground text-xl">{booking.service?.name}</p>
                      <p className="text-sm text-muted-foreground mb-3">{booking.service?.serviceType?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-xl">${Number(booking.service?.basePrice).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Base Price</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-violet-500" /> {booking.service?.durationMin} Minutes
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-border">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Service Location</h4>
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{booking.serviceAddress}</p>
                </div>
                {booking.customerNotes && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-sm text-amber-700 dark:text-amber-400 mt-4">
                    <strong>Customer Note:</strong> "{booking.customerNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 uppercase tracking-wider">
                <User className="w-4 h-4 text-violet-500" /> Customer Information
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                  <AvatarImage src={booking.customer?.avatarUrl} />
                  <AvatarFallback className="text-xl bg-violet-100 text-violet-700">{booking.customer?.fullName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{booking.customer?.fullName}</h2>
                  <p className="text-sm text-muted-foreground">Registered User</p>
                </div>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setCustomerDrawerOpen(true)}>View Profile</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2"><Phone className="w-3 h-3" /> Phone</p>
                  <p className="font-medium text-foreground">{booking.customer?.phone || "N/A"}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2"><MessageSquare className="w-3 h-3" /> Email</p>
                  <p className="font-medium text-foreground">{booking.customer?.email || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Company & Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Tab */}
              <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-violet-500" /> Company Info
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {booking.company?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">{booking.company?.name || "N/A"}</h2>
                    <p className="text-xs text-muted-foreground">Service Provider</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-xs" onClick={() => setCompanyDrawerOpen(true)}>View Company</Button>
              </div>

              {/* Staff Tab */}
              <div className="bg-background rounded-xl border border-border p-6 shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-5 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-violet-500" /> Assigned Staff
                </h3>
                {booking.assignedStaff ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                        <AvatarImage src={booking.assignedStaff.user?.avatarUrl} />
                        <AvatarFallback className="text-sm bg-violet-100 text-violet-700">{booking.assignedStaff.user?.fullName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-base font-bold text-foreground">{booking.assignedStaff.user?.fullName}</h2>
                        <p className="text-xs text-muted-foreground">{booking.assignedStaff.user?.phone || "No Phone"}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full text-xs" onClick={() => setStaffDrawerOpen(true)}>View Staff</Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No staff assigned yet</p>
                    <Button variant="outline" className="w-full text-xs" onClick={() => {
                      fetchCompanyStaff(booking.companyId);
                      setAssignStaffModalOpen(true);
                    }}>Assign Staff</Button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (Sticky) */}
          <div className="space-y-6 lg:sticky lg:top-0 self-start">
            
            {/* Admin Actions */}
            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-violet-500" /> Admin Actions
                </h3>
              </div>
              <div className="p-2 flex flex-col">
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-muted font-medium text-sm" onClick={() => setStatusModalOpen(true)}>Change Status</Button>
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-muted font-medium text-sm" onClick={() => {
                  fetchCompanyStaff(booking.companyId);
                  setAssignStaffModalOpen(true);
                }}>Assign Staff</Button>
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-muted font-medium text-sm" onClick={() => handleSimulatedAction("Change Company")}>Change Company</Button>
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-muted font-medium text-sm" onClick={() => handleSimulatedAction("Send Notification")}>Send Notification</Button>
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-muted font-medium text-sm" onClick={() => handleSimulatedAction("Add Internal Note")}>Add Internal Note</Button>
                <div className="h-px bg-border my-2 mx-2" />
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-rose-500/10 text-rose-600 font-medium text-sm" onClick={() => handleSimulatedAction("Refund Payment")}>Refund Payment</Button>
                <Button variant="ghost" className="justify-start w-full text-left rounded-md hover:bg-rose-500/10 text-rose-600 font-medium text-sm" onClick={() => setCancelModalOpen(true)}>Cancel Booking</Button>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-violet-500" /> Financials
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-muted-foreground text-sm font-medium">Customer Paid</span>
                  <span className="font-bold text-foreground">${Number(booking.totalPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">Platform Fee</span>
                  <span className="font-bold text-emerald-500">${Number(booking.platformFee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm flex items-center gap-2">Company Earnings</span>
                  <span className="font-bold text-blue-500">${Number(booking.companyEarnings).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-background rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-6 uppercase tracking-wider">
                <Timer className="w-4 h-4 text-violet-500" /> Timeline
              </h3>
              <div className="space-y-5 pl-2">
                <div className="relative pl-6 pb-5 border-l-2 border-violet-500/20 last:border-0 last:pb-0">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-violet-100 border-2 border-violet-500" />
                  <p className="text-sm font-bold text-foreground">Booking Created</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(booking.createdAt).toLocaleString()}</p>
                </div>
                
                {booking.statusLogs?.map((log: any, idx: number) => (
                  <div key={idx} className="relative pl-6 pb-5 border-l-2 border-violet-500/20 last:border-0 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-violet-100 border-2 border-violet-500" />
                    <p className="text-sm font-bold text-foreground capitalize">{log.newStatus?.replace('_', ' ') || log.status?.replace('_', ' ') || 'Status Updated'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(log.changedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── DRAWERS ───────────────────────────────────────────── */}
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

      {/* ─── MODALS ────────────────────────────────────────────── */}
      {/* Cancel Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>Please provide a reason for cancelling this booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cancellation Reason</Label>
              <Textarea 
                placeholder="e.g. Customer requested cancellation via phone" 
                value={cancelReason} 
                onChange={(e) => setCancelReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} disabled={actionLoading}>Nevermind</Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={actionLoading || !cancelReason.trim()}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Booking Status</DialogTitle>
            <DialogDescription>Manually override the current status of this booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleChangeStatus} disabled={actionLoading || !newStatus}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Modal */}
      <Dialog open={assignStaffModalOpen} onOpenChange={setAssignStaffModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
            <DialogDescription>Select a staff member from the assigned company to handle this job.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Available Staff</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                <SelectContent>
                  {availableStaff.map((staff: any) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.user?.fullName}
                    </SelectItem>
                  ))}
                  {availableStaff.length === 0 && (
                    <SelectItem value="none" disabled>No staff available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignStaffModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button onClick={handleAssignStaff} disabled={actionLoading || !selectedStaffId || selectedStaffId === 'none'}>
              {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
