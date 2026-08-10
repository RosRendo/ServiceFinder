'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Calendar, Clock, MapPin, User, DollarSign,
    CheckCircle, XCircle, Timer, Loader2, UserPlus, Phone,
    MapIcon, Briefcase, Building2, ShieldCheck, ChevronRight,
    Star, Camera, MessageSquare, AlertTriangle, Download, Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
    pending: { bg: "bg-amber-100/50", text: "text-amber-600", border: "border-amber-200/50", label: "Pending", icon: Timer },
    confirmed: { bg: "bg-blue-100/50", text: "text-blue-600", border: "border-blue-200/50", label: "Confirmed", icon: CheckCircle },
    in_progress: { bg: "bg-indigo-100/50", text: "text-indigo-600", border: "border-indigo-200/50", label: "In Progress", icon: Clock },
    completed: { bg: "bg-emerald-100/50", text: "text-emerald-600", border: "border-emerald-200/50", label: "Completed", icon: ShieldCheck },
    cancelled: { bg: "bg-rose-100/50", text: "text-rose-600", border: "border-rose-200/50", label: "Cancelled", icon: XCircle },
};

interface StatusLog {
    id: string;
    oldStatus: string | null;
    newStatus: string | null;
    changedBy: string | null;
    changedAt: string;
}

interface BookingDetail {
    id: string;
    status: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    serviceAddress: string;
    totalPrice: number;
    platformFee: number;
    companyEarnings: number;
    latitude: number | null;
    longitude: number | null;
    proofOfWorkImageUrl?: string;
    customer: { id: string; fullName: string; email: string; phone: string; avatar?: string };
    service: { id: string; name: string; description: string; basePrice: number };
    assignedStaff: { id: string; fullName: string; role: string } | null;
    statusLogs?: StatusLog[];
    review?: { companyRating: number; companyComment?: string | null } | null;
    checklist?: any;
    progressPercent?: number;
}

export default function CompanyBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showProofImage, setShowProofImage] = useState(false);
    const { toast } = useToast();


    const fetchBooking = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${id}`);
            const payload = res.data.data || res.data;
            setBooking(payload.booking || payload);
        } catch {
            toast({ title: "Error", description: "Failed to load booking details.", variant: "destructive" });
            setTimeout(() => router.push("/company/bookings"), 1500);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBooking(); }, [id]);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const formatTime = (start: string, end: string) => {
        const fmt = (iso: string) => {
            const d = new Date(iso);
            const h = d.getUTCHours(), m = d.getUTCMinutes();
            const ampm = h >= 12 ? "PM" : "AM";
            return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
        };
        return `${fmt(start)} – ${fmt(end)}`;
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
        </div>
    );

    if (!booking) return null;

    const statusInfo = statusConfig[booking.status] ?? { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border", label: booking.status, icon: Timer };
    const StatusIcon = statusInfo.icon;

    return (
        <div className="h-full overflow-y-auto bg-muted/30 min-h-screen">
            <div className="bg-background border-b border-border">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        <Link href="/company/bookings" className="hover:text-foreground transition-colors">Bookings</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground">Audit Detail: #{booking.id.slice(-6)}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/company/bookings">
                                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-border shadow-sm hover:bg-muted/30 transition-colors bg-background">
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-foreground tracking-tight">
                                        {booking.service.name}
                                    </h1>
                                    <span className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {statusInfo.label}
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{formatDate(booking.bookingDate)} • {formatTime(booking.startTime, booking.endTime)}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-xl h-10 bg-background border-border shadow-sm text-foreground font-bold uppercase tracking-widest text-[10px]">
                                <Download className="w-3.5 h-3.5 mr-2" /> Export Invoice
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Financial Summary</span>
                    </div>
                    <div className="grid grid-cols-4 divide-x divide-border/50">
                        <div className="p-5 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5">Gross Price</p>
                            <p className="text-2xl font-black text-foreground">${Number(booking.totalPrice ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="p-5 text-center bg-rose-50/50">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">Platform Fee</p>
                            <p className="text-2xl font-black text-rose-600">-${Number(booking.platformFee ?? 0).toFixed(2)}</p>
                        </div>
                        <div className="p-5 text-center">
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-1.5">Add-ons / Tips</p>
                            <p className="text-2xl font-black text-foreground">$0.00</p>
                        </div>
                        <div className="p-5 text-center bg-emerald-50/50">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Net Earnings</p>
                            <p className="text-2xl font-black text-emerald-700">${Number(booking.companyEarnings ?? 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Parties Involved</span>
                            </div>
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-border/50">
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <th className="px-5 py-4 font-semibold text-muted-foreground w-1/3 align-top text-xs">Customer</th>
                                        <td className="px-5 py-4">
                                            <div className="font-bold text-foreground">{booking.customer.fullName}</div>
                                            <div className="text-xs font-medium text-muted-foreground mt-0.5">{booking.customer.phone || booking.customer.email}</div>
                                            <Link href={`/company/customers/${booking.customer.id}`} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline mt-2 inline-block">View CRM Profile</Link>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <th className="px-5 py-4 font-semibold text-muted-foreground w-1/3 align-top text-xs">Assigned Staff</th>
                                        <td className="px-5 py-4">
                                            {booking.assignedStaff ? (
                                                <>
                                                    <div className="font-bold text-foreground">{booking.assignedStaff.fullName}</div>
                                                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{booking.assignedStaff.role}</div>
                                                    <Link href={`/company/staff/${booking.assignedStaff.id}`} className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline mt-2 inline-block">View Staff Analytics</Link>
                                                </>
                                            ) : (
                                                <div className="text-xs font-medium text-muted-foreground/60 italic">Unassigned</div>
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <th className="px-5 py-4 font-semibold text-muted-foreground w-1/3 align-top text-xs">Location</th>
                                        <td className="px-5 py-4">
                                            <div className="font-medium text-foreground text-sm leading-relaxed">{booking.serviceAddress}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Line Items Ledger</span>
                            </div>
                            <table className="w-full text-sm text-left border-collapse">
                                <tbody className="divide-y divide-border/50">
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-muted-foreground text-xs">{booking.service.name} Base</td>
                                        <td className="px-5 py-3.5 font-bold text-foreground text-right text-sm">${Number(booking.service.basePrice).toFixed(2)}</td>
                                    </tr>
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-muted-foreground text-xs">Service Area Surcharge</td>
                                        <td className="px-5 py-3.5 font-bold text-foreground text-right text-sm">$0.00</td>
                                    </tr>
                                    <tr className="hover:bg-muted/10 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-muted-foreground text-xs">Customer Tip</td>
                                        <td className="px-5 py-3.5 font-bold text-foreground text-right text-sm">$0.00</td>
                                    </tr>
                                    <tr className="bg-muted/30 border-t border-border">
                                        <td className="px-5 py-4 font-bold text-foreground text-xs uppercase tracking-widest">Total Authorized</td>
                                        <td className="px-5 py-4 font-black text-foreground text-right text-lg">${Number(booking.totalPrice).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Settings className="w-3.5 h-3.5 text-muted-foreground/60" /> System Audit Log
                                </span>
                            </div>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-muted/10">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest border-b border-border/50">Timestamp</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest border-b border-border/50">Action</th>
                                        <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest border-b border-border/50 text-right">User</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {(booking.statusLogs && booking.statusLogs.length > 0) ? booking.statusLogs.map((log) => {
                                        const ts = new Date(log.changedAt);
                                        const timeStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                        const action = log.oldStatus
                                            ? `${log.oldStatus.replace('_', ' ')} → ${log.newStatus?.replace('_', ' ') || '?'}`
                                            : `Status set to ${log.newStatus?.replace('_', ' ') || 'unknown'}`;
                                        const actor = log.changedBy ? `User #${log.changedBy.slice(-4)}` : 'System';
                                        return (
                                            <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-5 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{timeStr}</td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-foreground capitalize">{action}</td>
                                                <td className="px-5 py-3.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest text-right">{actor}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-6 text-xs text-muted-foreground/60 text-center">No audit events recorded.</td>
                                        </tr>
                                    )}

                                </tbody>
                            </table>
                        </div>
                        {/* Service Checklist Progress */}
                        {booking.checklist && Array.isArray(booking.checklist) && booking.checklist.length > 0 && (
                            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/60" /> Service Checklist Progress
                                    </span>
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                        {booking.progressPercent || 0}% Completed
                                    </span>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Progress Bar */}
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${booking.progressPercent || 0}%` }}
                                        />
                                    </div>
                                    
                                    {/* Checklist Steps */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                        {booking.checklist.map((item: any) => (
                                            <div 
                                                key={item.id} 
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                                    item.completed 
                                                        ? 'bg-emerald-50/30 border-emerald-100/80 text-emerald-900' 
                                                        : 'bg-muted/10 border-border/50 text-muted-foreground'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                                    item.completed 
                                                        ? 'bg-emerald-500 border-emerald-600 text-white' 
                                                        : 'border-muted-foreground/30 bg-background text-transparent'
                                                }`}>
                                                    {item.completed && <CheckCircle className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <span className={`text-xs font-semibold ${item.completed ? 'line-through opacity-85' : ''}`}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Camera className="w-3.5 h-3.5 text-muted-foreground/60" /> Proof of Work
                                    </span>
                                </div>
                                <div className="p-5">
                                    {booking.proofOfWorkImageUrl ? (
                                        <div className="w-full h-48 rounded-lg bg-muted/30 border border-border cursor-pointer hover:opacity-90 transition-opacity overflow-hidden">
                                            <img src={booking.proofOfWorkImageUrl.replace('localhost', '127.0.0.1')} alt="Proof of work" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 rounded-lg bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/60">
                                            <Camera className="w-8 h-8 mb-3 opacity-30" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No photos</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Star className="w-3.5 h-3.5 text-muted-foreground/60" /> Customer Review
                                    </span>
                                </div>
                                <div className="p-5">
                                    {booking.status === 'completed' && booking.review ? (
                                        <div className="text-center h-48 rounded-lg flex flex-col items-center justify-center bg-amber-50/50 border border-amber-100 p-5">
                                            <div className="flex gap-1 mb-4">
                                                {[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < (booking.review?.companyRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />)}
                                            </div>
                                            <p className="text-sm font-semibold text-amber-900 italic">{booking.review.companyComment ? `"${booking.review.companyComment}"` : 'No written comment.'}</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-48 rounded-lg bg-muted/30 border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/60">
                                            <MessageSquare className="w-8 h-8 mb-3 opacity-30" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Waiting</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-rose-50/50 rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-rose-50/80 border-b border-rose-100">
                                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Dispute Management
                                </span>
                            </div>
                            <div className="p-5">
                                <p className="text-sm text-rose-900/80 font-medium mb-5">No disputes have been filed for this booking.</p>
                                <Button variant="outline" className="rounded-xl bg-background border-rose-200 text-rose-700 font-bold hover:bg-rose-50 text-xs h-10 shadow-sm" disabled>
                                    Authorize Refund
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
