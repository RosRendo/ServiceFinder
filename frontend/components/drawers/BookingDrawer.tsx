"use client";

import { useEffect, useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Calendar, Clock, MapPin, User, DollarSign, CheckCircle, XCircle, Timer, Loader2, UserPlus, Phone, Briefcase, Building2, ShieldCheck, Image as ImageIcon, Map } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
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

export function BookingDrawer({ open, onClose, bookingId, onBookingUpdated }: { open: boolean; onClose: () => void; bookingId: string | null; onBookingUpdated?: () => void }) {
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
        <BaseDrawer open={open} onClose={onClose} title={`Booking #${booking.id.slice(-6)}`} subtitle={formatDate(booking.bookingDate)} width="lg">
            
            {/* Header / Status Section */}
            <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/10">
                <div>
                   <h3 className="text-xl font-black text-foreground mb-1">{booking.service.name}</h3>
                   <div className="flex flex-col items-start gap-2">
                       <span className={`inline-flex px-2.5 py-1 rounded-full border items-center gap-1.5 font-bold text-xs uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border} relative overflow-hidden`}>
                           <StatusIcon className="w-3.5 h-3.5" />
                           {cfg.label}
                           
                           {/* Cylon Sweeping Beam for Pending */}
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
                {!booking.assignedStaff && booking.status !== "completed" && booking.status !== "cancelled" && (
                    <Button size="sm" className="rounded-xl h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                        <UserPlus className="w-4 h-4 mr-2" /> Assign
                    </Button>
                )}
            </div>

            {/* Schedule */}
            <Section title={<><Calendar className="w-3.5 h-3.5 text-primary" /> Schedule & Location</>}>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                       <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/10">
                           <Clock className="w-4 h-4 text-amber-500" />
                       </div>
                       <div>
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Time</p>
                           <p className="text-sm font-bold text-foreground">{formatTime(booking.startTime, booking.endTime)}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-3">
                       <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/10">
                           <MapPin className="w-4 h-4 text-rose-500" />
                       </div>
                       <div>
                           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Address</p>
                           <p className="text-sm font-bold text-foreground">{booking.serviceAddress}</p>
                       </div>
                    </div>
                    
                    {/* Live Staff GPS Tracking Map Link */}
                    {booking.staffStartLatitude && booking.staffStartLongitude && (
                        <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                           <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/10">
                               <Map className="w-4 h-4 text-indigo-500" />
                           </div>
                           <div className="flex-1">
                               <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Staff Origin Location</p>
                               <a 
                                 href={`https://www.google.com/maps/search/?api=1&query=${booking.staffStartLatitude},${booking.staffStartLongitude}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                               >
                                 View on Google Maps <MapPin className="w-3 h-3" />
                               </a>
                               <p className="text-[10px] text-muted-foreground mt-0.5">Staff dispatched from this location.</p>
                           </div>
                        </div>
                    )}
                </div>
            </Section>

            {/* Customer Details */}
            <Section title={<><User className="w-3.5 h-3.5 text-emerald-500" /> Customer Details</>}>
                <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm">
                        <AvatarFallback className="rounded-xl font-black bg-emerald-500/10 text-emerald-600">{booking.customer.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-bold text-base text-foreground">{booking.customer.fullName}</p>
                        <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                    </div>
                    {booking.customer.phone && (
                        <Button variant="outline" size="sm" className="rounded-lg h-9 font-bold text-foreground border-border hover:bg-muted shadow-sm" asChild>
                            <a href={`tel:${booking.customer.phone}`}><Phone className="w-4 h-4 mr-2" /> Call</a>
                        </Button>
                    )}
                </div>
            </Section>

            {/* Staff Assignment */}
            <Section title={<><Building2 className="w-3.5 h-3.5 text-indigo-500" /> Staff Assignment</>}>
                {booking.assignedStaff ? (
                    <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-xl border border-border/50">
                        <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm">
                            <AvatarFallback className="bg-indigo-500/10 text-indigo-600 font-black rounded-xl text-lg">
                                {booking.assignedStaff.fullName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-base font-bold text-foreground tracking-tight">{booking.assignedStaff.fullName}</p>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{booking.assignedStaff.role}</p>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 font-bold text-foreground border-border hover:bg-muted" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                            Reassign
                        </Button>
                    </div>
                ) : (
                    <div className="bg-muted/20 rounded-xl p-6 border-2 border-border border-dashed text-center">
                        <UserPlus className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-black text-foreground mb-1">No staff assigned</p>
                        <p className="text-xs font-medium text-muted-foreground">Assign a team member to proceed.</p>
                    </div>
                )}
            </Section>

            {/* Inline assign panel */}
            {showAssign && (
                <div className="border-b border-border/50 p-6 bg-muted/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h4 className="font-black text-sm text-foreground uppercase tracking-wider mb-4">Select Staff Member</h4>
                    {loadingStaff ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-6 bg-muted/30 rounded-xl border border-border/40">
                            <p className="text-xs font-bold text-muted-foreground">No active staff found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                            {staff.filter(s => s.status !== 'inactive').map((s) => (
                                <label
                                    key={s.id}
                                    className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all", selectedStaffId === s.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 bg-background hover:border-border hover:bg-muted/30")}
                                >
                                    <input type="radio" name="staff" value={s.id} checked={selectedStaffId === s.id} onChange={(e) => setSelectedStaffId(e.target.value)} className="sr-only" />
                                    <Avatar className="w-10 h-10 rounded-lg border border-border/50 shadow-sm"><AvatarFallback className="rounded-lg font-black bg-muted text-foreground">{s.fullName.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-foreground">{s.fullName}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5"><span className="text-primary">{s.role}</span></p>
                                    </div>
                                    <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", selectedStaffId === s.id ? 'border-primary bg-primary' : 'border-border')}>
                                        {selectedStaffId === s.id && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="flex-1 rounded-xl h-10 text-xs font-bold border-border" onClick={() => setShowAssign(false)}>Cancel</Button>
                        <Button className="flex-1 rounded-xl h-10 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm" disabled={!selectedStaffId || assigning} onClick={handleAssign}>
                            {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <UserPlus className="w-3.5 h-3.5 mr-2" />} Confirm
                        </Button>
                    </div>
                </div>
            )}

            {/* Financials */}
            <Section title={<><DollarSign className="w-3.5 h-3.5 text-amber-500" /> Financials</>}>
                <div className="bg-muted/20 rounded-xl p-4 border border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Gross Price:</span>
                        <span className="text-sm font-bold text-foreground">${Number(booking.totalPrice ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground">Platform Fee:</span>
                        <span className="text-sm font-bold text-rose-500">-${Number(booking.platformFee ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Net Earnings:</span>
                        <span className="text-lg font-black text-foreground">${Number(booking.companyEarnings ?? 0).toFixed(2)}</span>
                    </div>
                </div>
            </Section>
            
            {/* Proof of Work */}
            {booking.proofOfWorkImageUrl && (
                <Section title={<><ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Proof of Work</>}>
                    <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                        <p className="text-xs font-bold text-muted-foreground mb-3">Job Completion Photo</p>
                        <div 
                           className="w-full h-32 rounded-lg bg-muted border border-border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                           onClick={() => setShowProofImage(true)}
                        >
                           {/* Using standard img to avoid next/image strict host checks */}
                           <img 
                               src={booking.proofOfWorkImageUrl.replace('localhost', '127.0.0.1')} 
                               alt="Proof of work" 
                               className="w-full h-full object-cover" 
                               onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80' }}
                           />
                        </div>
                    </div>
                </Section>
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
            
            <div className="h-8" />
        </BaseDrawer>
    );
}
