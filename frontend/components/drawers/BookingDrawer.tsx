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
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "Pending", icon: Timer },
    confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "Confirmed", icon: CheckCircle },
    in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20", label: "In Progress", icon: Clock },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", label: "Completed", icon: ShieldCheck },
    cancelled: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", label: "Cancelled", icon: XCircle },
};

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="border-b border-border/50 px-6 py-5">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">{title}</p>
            {children}
        </div>
    );
}

export function BookingDrawer({ open, onClose, bookingId, onBookingUpdated, isAdmin }: { open: boolean; onClose: () => void; bookingId: string | null; onBookingUpdated?: () => void; isAdmin?: boolean }) {
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

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
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
            <BaseDrawer open={open} onClose={onClose} title="Booking Details" width="lg">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                </div>
            </BaseDrawer>
        );
    }

    const cfg = statusConfig[booking.status] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", label: booking.status, icon: Timer };
    const StatusIcon = cfg.icon;

    return (
        <BaseDrawer open={open} onClose={onClose} title={`Booking #${booking.id?.toString().slice(-6)}`} subtitle={formatDate(booking.bookingDate)} width="lg">
            <div className="p-6 space-y-6">

                {/* Header / Status Section */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{booking.service?.name || "Service Booking"}</h3>
                        <div className="flex flex-col items-start gap-2">
                            <span className={cn("inline-flex px-2 py-1 rounded-md border items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest relative overflow-hidden", cfg.bg, cfg.text, cfg.border)}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {cfg.label}
                                {booking.status === 'pending' && (
                                    <motion.div
                                        className="absolute top-0 bottom-0 w-8 bg-white/40 blur-[2px]"
                                        animate={{ left: ["-20%", "120%"] }}
                                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                    />
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!booking.assignedStaff && booking.status !== "completed" && booking.status !== "cancelled" && (
                            <Button size="sm" className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                                <UserPlus className="w-4 h-4 mr-2" /> Assign
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl h-10 px-4 border-border hover:bg-muted/50 font-bold"
                            onClick={() => {
                                const path = isAdmin 
                                    ? `/admin/bookings/${booking.id}` 
                                    : `/company/bookings/${booking.id}`;
                                router.push(path);
                                onClose();
                            }}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" /> Full View
                        </Button>
                    </div>
                </div>

                {/* Schedule & Location */}
                <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" /> Schedule & Location
                    </p>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Time</span>
                        <span className="font-medium">{formatTime(booking.startTime, booking.endTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Address</span>
                        <span className="font-medium text-right max-w-[200px] truncate">{booking.serviceAddress}</span>
                    </div>
                    {booking.staffStartLatitude && booking.staffStartLongitude && (
                        <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
                            <span className="text-muted-foreground flex items-center gap-2"><Map className="w-3.5 h-3.5" /> Staff Origin</span>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${booking.staffStartLatitude},${booking.staffStartLongitude}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">
                                View Map <ArrowUpRight className="w-3 h-3" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Customer Details */}
                <div className="flex items-center gap-4 bg-muted/10 border border-border rounded-xl p-4">
                    <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm">
                        <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground">{booking.customer?.fullName?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{booking.customer?.fullName || "Customer"}</p>
                        <p className="text-xs text-muted-foreground truncate">{booking.customer?.email || "No email"}</p>
                    </div>
                    {booking.customer?.phone && (
                        <Button variant="outline" size="sm" className="rounded-lg h-8 font-medium text-foreground border-border hover:bg-muted/50" asChild>
                            <a href={`tel:${booking.customer.phone}`}><Phone className="w-3.5 h-3.5 mr-2" /> Call</a>
                        </Button>
                    )}
                </div>

                {/* Staff Assignment */}
                <div className="bg-muted/10 border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Staff Assignment
                    </p>
                    {booking.assignedStaff ? (
                        <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10 rounded-xl border border-border/50 shadow-sm">
                                <AvatarFallback className="bg-muted text-foreground font-bold rounded-xl">{(booking.assignedStaff.user?.fullName || booking.assignedStaff.fullName)?.charAt(0) || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-foreground truncate">{booking.assignedStaff.user?.fullName || booking.assignedStaff.fullName || "Staff Member"}</p>
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{booking.assignedStaff.role?.replace(/_/g, " ")}</p>
                            </div>
                            {!isAdmin && (
                                <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs font-medium border-border hover:bg-muted/50" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                                    Reassign
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <UserPlus className="w-5 h-5 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-bold text-foreground">No staff assigned</p>
                            {!isAdmin && <p className="text-xs text-muted-foreground mt-1">Assign a team member to proceed.</p>}
                            {isAdmin && <p className="text-xs text-muted-foreground mt-1">Pending company assignment.</p>}
                        </div>
                    )}
                </div>

                {/* Inline assign panel */}
                {!isAdmin && showAssign && (
                    <div className="p-4 bg-muted/10 border border-border rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                        <h4 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3">Select Staff Member</h4>
                        {loadingStaff ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-primary opacity-50" />
                            </div>
                        ) : staff.length === 0 ? (
                            <div className="text-center py-4 bg-muted/30 rounded-lg border border-border/40">
                                <p className="text-xs font-medium text-muted-foreground">No active staff found.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {staff.filter(s => s.status !== 'inactive').map((s) => (
                                    <label
                                        key={s.id}
                                        className={cn("flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all", selectedStaffId === s.id ? "border-primary bg-primary/5" : "border-border/50 bg-background hover:border-border hover:bg-muted/30")}
                                    >
                                        <input type="radio" name="staff" value={s.id} checked={selectedStaffId === s.id} onChange={(e) => setSelectedStaffId(e.target.value)} className="sr-only" />
                                        <Avatar className="w-8 h-8 rounded-lg border border-border/50"><AvatarFallback className="rounded-lg font-bold bg-muted text-foreground text-xs">{s.fullName?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-foreground truncate">{s.fullName}</p>
                                            <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">{s.role}</p>
                                        </div>
                                        <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors", selectedStaffId === s.id ? 'border-primary bg-primary' : 'border-border')}>
                                            {selectedStaffId === s.id && <CheckCircle className="w-2.5 h-2.5 text-primary-foreground" />}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" className="flex-1 rounded-lg h-9 text-xs font-medium border-border" onClick={() => setShowAssign(false)}>Cancel</Button>
                            <Button className="flex-1 rounded-lg h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium" disabled={!selectedStaffId || assigning} onClick={handleAssign}>
                                {assigning ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <UserPlus className="w-3 h-3 mr-2" />} Confirm
                            </Button>
                        </div>
                    </div>
                )}

                {/* Financials */}
                <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
                    <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
                        <DollarSign className="w-3.5 h-3.5" /> Financials
                    </p>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gross Price</span>
                        <span className="font-medium text-foreground">${Number(booking.totalPrice ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span className="font-medium text-rose-500">-${Number(booking.platformFee ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-border/50">
                        <span className="font-bold text-emerald-500 uppercase tracking-widest text-[10px]">Net Earnings</span>
                        <span className="font-bold text-foreground text-base">${Number(booking.companyEarnings ?? 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* Proof of Work */}
                {booking.proofOfWorkImageUrl && (
                    <div className="space-y-3 bg-muted/10 border border-border rounded-xl p-4">
                        <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Proof of Work
                        </p>
                        <div
                            className="w-full h-32 rounded-lg bg-muted border border-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowProofImage(true)}
                        >
                            <img
                                src={booking.proofOfWorkImageUrl.replace('localhost', '127.0.0.1')}
                                alt="Proof of work"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' }}
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
                                onClick={(e) => { e.stopPropagation(); setShowProofImage(false); }}
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                            <img
                                src={booking.proofOfWorkImageUrl.replace('localhost', '127.0.0.1')}
                                alt="Full Proof of work"
                                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-white/20"
                                onClick={(e) => e.stopPropagation()}
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80' }}
                            />
                            <p className="text-white/60 text-sm font-medium mt-4">Proof of Work submitted by {booking.assignedStaff?.fullName || 'Staff'}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </BaseDrawer>
    );
}
