"use client";

import { useEffect, useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Calendar, Clock, MapPin, User, DollarSign, CheckCircle, XCircle, Timer, Loader2, UserPlus, Phone, Briefcase, Building2, ShieldCheck, Image as ImageIcon, Map, ArrowUpRight, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20", label: "Pending", icon: Timer },
  confirmed: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", label: "Confirmed", icon: CheckCircle },
  in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20", label: "In Progress", icon: Clock },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/20", label: "Completed", icon: ShieldCheck },
  cancelled: { bg: "bg-rose-500/10", text: "text-rose-600", border: "border-rose-500/20", label: "Cancelled", icon: XCircle },
};

export function BookingDrawer({
  open,
  onClose,
  bookingId,
  onBookingUpdated,
  isAdmin = false,
}: {
  open: boolean;
  onClose: () => void;
  bookingId: string | null;
  onBookingUpdated?: () => void;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showProofImage, setShowProofImage] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !bookingId) {
      setBooking(null);
      setShowAssign(false);
      return;
    }
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const payload = res.data.data || res.data;
        setBooking(payload.booking || payload);
      } catch {
        toast({ title: "Error", description: "Failed to load booking details.", variant: "destructive" });
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [open, bookingId, onClose, toast]);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get(`/companies/my-company/staff`);
      const payload = res.data.data || res.data;
      setStaff(Array.isArray(payload) ? payload : (payload.staff || []));
    } catch {
      toast({ title: "Error", description: "Failed to load staff list.", variant: "destructive" });
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAssign = async () => {
    if (!booking || !selectedStaffId) return;
    setAssigning(true);
    try {
      await api.patch(`/bookings/${booking.id}/assign-staff`, { staffId: selectedStaffId });
      toast({ title: "Success", description: "Staff assigned successfully!" });
      setShowAssign(false);

      // Refetch this booking
      const res = await api.get(`/bookings/${booking.id}`);
      const payload = res.data.data || res.data;
      setBooking(payload.booking || payload);

      // Notify parent
      onBookingUpdated?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to assign staff", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const formatTime = (start: string, end: string) => {
    const fmt = (iso: string) => {
      const d = new Date(iso);
      const h = d.getUTCHours(), m = d.getUTCMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
    };
    return `${fmt(start)} – ${fmt(end)}`;
  };

  if (loading || !booking) {
    return (
      <BaseDrawer open={open} onClose={onClose} title="Booking Inspection" width="lg">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
        </div>
      </BaseDrawer>
    );
  }

  const cfg = statusConfig[booking.status] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    label: booking.status,
    icon: Timer,
  };
  const StatusIcon = cfg.icon;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={`Booking #${booking.id?.toString().slice(-6).toUpperCase()}`}
      subtitle={booking.bookingDate ? formatDate(booking.bookingDate) : undefined}
      badge={
        <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", cfg.bg, cfg.text, cfg.border)}>
          <StatusIcon className="w-3 h-3" />
          {cfg.label}
        </span>
      }
      headerActions={
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs font-semibold border-border gap-1.5 hover:bg-muted"
          onClick={() => {
            const path = isAdmin ? `/admin/bookings/${booking.id}` : `/company/bookings/${booking.id}`;
            router.push(path);
            onClose();
          }}
        >
          <span>Full Order Desk</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </Button>
      }
      width="lg"
    >
      <div className="p-6 space-y-5 font-sans">
        {/* Service Hero Banner */}
        <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Service Requested
            </span>
            <h3 className="text-base font-bold text-foreground">
              {booking.service?.name || "Home Service Order"}
            </h3>
            {booking.company && (
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                Provided by <strong className="text-foreground">{booking.company.name}</strong>
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
              Total Order
            </span>
            <span className="font-mono text-lg font-extrabold text-foreground">
              ${Number(booking.totalPrice ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Schedule & Location Card */}
        <div className="space-y-3 bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Schedule & Service Address
          </p>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Window
            </span>
            <span className="font-semibold text-foreground">
              {booking.startTime && booking.endTime ? formatTime(booking.startTime, booking.endTime) : "Flexible Window"}
            </span>
          </div>
          <div className="flex justify-between items-start text-xs pt-1">
            <span className="text-muted-foreground flex items-center gap-2 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Address
            </span>
            <span className="font-medium text-foreground text-right max-w-[280px]">
              {booking.serviceAddress || "Address on record"}
            </span>
          </div>
          {booking.staffStartLatitude && booking.staffStartLongitude && (
            <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
              <span className="text-muted-foreground flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-muted-foreground" /> Live Coordinates
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${booking.staffStartLatitude},${booking.staffStartLongitude}`}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline flex items-center gap-1"
              >
                View on Map <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Customer Details Card */}
        <div className="flex items-center gap-3.5 bg-card border border-border rounded-2xl p-4">
          <Avatar className="w-11 h-11 rounded-xl border border-border">
            <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
              {booking.customer?.fullName?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs text-foreground truncate">{booking.customer?.fullName || "Client"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{booking.customer?.email || "No email"}</p>
          </div>
          {booking.customer?.phone && (
            <Button variant="outline" size="sm" className="rounded-xl h-8 px-3 text-xs font-semibold border-border gap-1.5" asChild>
              <a href={`tel:${booking.customer.phone}`}>
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </Button>
          )}
        </div>

        {/* Staff Assignment Card */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <p className="text-xs font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Assigned Technician
            </p>
            {!isAdmin && booking.status !== "completed" && booking.status !== "cancelled" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => {
                  setShowAssign(!showAssign);
                  if (!showAssign) fetchStaff();
                }}
              >
                {booking.assignedStaff ? "Reassign" : "Assign Technician"}
              </Button>
            )}
          </div>

          {booking.assignedStaff ? (
            <div className="flex items-center gap-3 pt-1">
              <Avatar className="w-10 h-10 rounded-xl border border-border">
                <AvatarFallback className="bg-muted text-foreground font-bold text-xs rounded-xl">
                  {(booking.assignedStaff.user?.fullName || booking.assignedStaff.fullName)?.charAt(0) || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-foreground truncate">
                    {booking.assignedStaff.user?.fullName || booking.assignedStaff.fullName || "Technician"}
                  </p>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {booking.assignedStaff.role?.replace(/_/g, " ") || "Field Staff"}
                </p>
              </div>
              {booking.assignedStaff.user?.phone && (
                <a
                  href={`tel:${booking.assignedStaff.user.phone}`}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <UserPlus className="w-5 h-5 text-muted-foreground mx-auto mb-1.5 opacity-50" />
              <p className="text-xs font-bold text-foreground">No Technician Dispatched</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isAdmin ? "Awaiting merchant staff assignment." : "Assign an available crew technician above."}
              </p>
            </div>
          )}

          {/* Inline assignment picker */}
          {!isAdmin && showAssign && (
            <div className="p-3.5 bg-muted/30 border border-border rounded-xl mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-2.5">
                Select Technician
              </h4>
              {loadingStaff ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              ) : staff.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No active technicians available.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaffId(s.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border",
                        selectedStaffId === s.id
                          ? "bg-primary/10 border-primary text-primary font-bold"
                          : "bg-card border-border hover:bg-muted text-foreground"
                      )}
                    >
                      <span>{s.user?.fullName || s.fullName}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.role || "worker"}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-semibold" onClick={() => setShowAssign(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!selectedStaffId || assigning}
                  onClick={handleAssign}
                >
                  {assigning ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <UserPlus className="w-3 h-3 mr-1.5" />}
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Financial Settlement Card */}
        <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
          <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Financial Breakdown
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Customer Total Paid</span>
            <span className="font-mono font-semibold text-foreground">${Number(booking.totalPrice ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Platform Commission ({booking.platformFee ? Math.round((booking.platformFee / (booking.totalPrice || 1)) * 100) : 10}%)</span>
            <span className="font-mono text-muted-foreground">-${Number(booking.platformFee ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="font-bold text-foreground text-xs uppercase tracking-wider">Merchant Payout</span>
            <span className="font-mono font-extrabold text-foreground text-sm">
              ${Number(booking.companyEarnings ?? ((booking.totalPrice || 0) - (booking.platformFee || 0))).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Proof of Work */}
        {booking.proofOfWorkImageUrl && (
          <div className="space-y-2.5 bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" /> Completion Proof
            </p>
            <div
              className="w-full h-32 rounded-xl bg-muted border border-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setShowProofImage(true)}
            >
              <img
                src={booking.proofOfWorkImageUrl.replace("localhost", "127.0.0.1")}
                alt="Proof of work"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80";
                }}
              />
            </div>
          </div>
        )}

        {/* Proof of Work Modal */}
        <AnimatePresence>
          {showProofImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4"
              onClick={() => setShowProofImage(false)}
            >
              <button
                className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProofImage(false);
                }}
              >
                <XCircle className="w-6 h-6" />
              </button>
              <img
                src={booking.proofOfWorkImageUrl.replace("localhost", "127.0.0.1")}
                alt="Full Proof of work"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80";
                }}
              />
              <p className="text-white/70 text-xs font-semibold mt-4">
                Completion proof submitted by {booking.assignedStaff?.fullName || "Staff"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseDrawer>
  );
}

export default BookingDrawer;
