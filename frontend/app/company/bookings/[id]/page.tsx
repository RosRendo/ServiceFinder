'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Calendar, Clock, MapPin, DollarSign,
    CheckCircle, CheckCircle2, XCircle, Timer, Loader2,
    UserPlus, Phone, Mail, Building2, ShieldCheck,
    ChevronRight, Star, Camera, MessageSquare, AlertTriangle,
    Printer, ExternalLink, Copy, Check, Navigation,
    FileText, User, Sparkles, Receipt, AlertCircle,
    ArrowUpRight, Shield, Tag, Compass, Layers, CheckCheck
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

// ─── Status Visual Styles ─────────────────────────────────────────────────────
const statusStyles: Record<string, {
    badgeClass: string;
    dotClass: string;
    label: string;
    icon: any;
}> = {
    pending: {
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        dotClass: "bg-amber-500",
        label: "Pending Acceptance",
        icon: Timer
    },
    confirmed: {
        badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
        dotClass: "bg-blue-500",
        label: "Confirmed & Dispatched",
        icon: CheckCircle
    },
    in_progress: {
        badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 shadow-[0_0_15px_rgba(99,102,241,0.2)]",
        dotClass: "bg-indigo-500 animate-ping",
        label: "In Progress (On Site)",
        icon: Clock
    },
    completed: {
        badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-[0_0_14px_rgba(16,185,129,0.18)]",
        dotClass: "bg-emerald-500",
        label: "Completed & Verified",
        icon: ShieldCheck
    },
    cancelled: {
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        dotClass: "bg-rose-500",
        label: "Cancelled",
        icon: XCircle
    },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
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
    actualStartTime?: string | null;
    actualEndTime?: string | null;
    serviceAddress: string;
    totalPrice: number;
    platformFee: number;
    companyEarnings: number;
    staffEarnings?: number;
    latitude: number | string | null;
    longitude: number | string | null;
    staffStartLatitude?: number | string | null;
    staffStartLongitude?: number | string | null;
    proofOfWorkImageUrl?: string | null;
    proofOfWorkPhoto?: string | null;
    customerNotes?: string | null;
    staffNotes?: string | null;
    createdAt?: string;
    customer: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        avatar?: string | null;
        role?: string;
    };
    service: {
        id: string;
        name: string;
        description: string;
        basePrice: number;
        durationMin?: number;
        serviceType?: {
            name: string;
            category?: { name: string };
        };
    };
    assignedStaff: {
        id: string;
        role: string;
        status?: string;
        user?: {
            id: string;
            fullName: string;
            phone: string;
            email: string;
            workingStatus?: string;
        };
        fullName?: string;
    } | null;
    statusLogs?: StatusLog[];
    review?: {
        companyRating: number;
        companyComment?: string | null;
        staffRating?: number;
        staffComment?: string | null;
        createdAt?: string;
    } | null;
    checklist?: Array<{
        id: number | string;
        title: string;
        completed: boolean;
    }>;
    progressPercent?: number;
    payment?: {
        id: string;
        status: string;
        method?: string;
        amount: number;
        paidAt?: string;
    } | null;
    cancellation?: {
        reason?: string;
        cancelledBy?: string;
        cancelledAt?: string;
    } | null;
}

export default function CompanyBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Modals
    const [showProofModal, setShowProofModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Staff assignment
    const [staffList, setStaffList] = useState<any[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [loadingStaff, setLoadingStaff] = useState(false);

    const { toast } = useToast();

    // ─── Fetch Booking ────────────────────────────────────────────────────────
    const fetchBooking = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${id}`);
            const payload = res.data?.data || res.data;
            setBooking(payload.booking || payload);
        } catch {
            toast({
                title: "Failed to load booking",
                description: "The requested booking could not be retrieved.",
                variant: "destructive"
            });
            setTimeout(() => router.push("/company/bookings"), 1500);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    // ─── Load Staff for Assignment ────────────────────────────────────────────
    const loadStaff = async () => {
        setLoadingStaff(true);
        try {
            const res = await api.get(`/companies/my-company/staff`);
            const payload = res.data?.data || res.data;
            setStaffList(Array.isArray(payload) ? payload : (payload.staff || []));
        } catch {
            toast({
                title: "Error",
                description: "Failed to load company technicians list.",
                variant: "destructive"
            });
        } finally {
            setLoadingStaff(false);
        }
    };

    useEffect(() => {
        if (showAssignModal) {
            loadStaff();
        }
    }, [showAssignModal]);

    // ─── Status Actions ───────────────────────────────────────────────────────
    const handleStatusUpdate = async (action: "accept" | "reject" | "complete" | "cancel") => {
        if (!id) return;
        setActionLoading(true);
        try {
            if (action === "accept") {
                await api.patch(`/bookings/${id}/accept`);
                toast({ title: "Booking Accepted", description: "Customer has been notified." });
            } else if (action === "reject") {
                await api.patch(`/bookings/${id}/reject`);
                toast({ title: "Booking Declined", description: "Booking has been declined." });
            } else if (action === "complete") {
                await api.patch(`/bookings/${id}/complete`);
                toast({ title: "Job Completed", description: "Work verified and invoice settled." });
            } else if (action === "cancel") {
                await api.patch(`/bookings/${id}/cancel`, { reason: "Cancelled by company dispatcher" });
                toast({ title: "Booking Cancelled", description: "Cancellation recorded." });
            }
            await fetchBooking();
        } catch (err: any) {
            toast({
                title: "Action failed",
                description: err.response?.data?.message || err.message || "Failed to update booking status.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAssignStaff = async () => {
        if (!id || !selectedStaffId) return;
        setActionLoading(true);
        try {
            await api.patch(`/bookings/${id}/assign-staff`, { staffId: selectedStaffId });
            toast({ title: "Technician Dispatched", description: "Staff member assigned to booking." });
            setShowAssignModal(false);
            await fetchBooking();
        } catch (err: any) {
            toast({
                title: "Assignment failed",
                description: err.response?.data?.message || err.message || "Failed to assign staff.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Formatting Helpers ───────────────────────────────────────────────────
    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        toast({ title: "Copied to clipboard", description: text });
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return iso;
        }
    };

    const formatTime = (start: string, end: string) => {
        const fmt = (iso: string) => {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return iso;
            const h = d.getUTCHours(), m = d.getUTCMinutes();
            const ampm = h >= 12 ? "PM" : "AM";
            return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
        };
        return `${fmt(start)} – ${fmt(end)}`;
    };

    const formatExactTime = (iso?: string | null) => {
        if (!iso) return null;
        try {
            const d = new Date(iso);
            if (isNaN(d.getTime())) return null;
            return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        } catch {
            return null;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground tracking-wide">
                    Loading Dispatch Console...
                </p>
            </div>
        );
    }

    if (!booking) return null;

    const currentStatus = statusStyles[booking.status] ?? {
        badgeClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground",
        label: booking.status,
        icon: Timer
    };
    const StatusIcon = currentStatus.icon;

    const technicianName = booking.assignedStaff?.user?.fullName || booking.assignedStaff?.fullName || null;
    const technicianPhone = booking.assignedStaff?.user?.phone || null;
    const technicianRole = booking.assignedStaff?.role || "Technician";
    const workPhotoUrl = booking.proofOfWorkImageUrl || booking.proofOfWorkPhoto || null;

    // Financial calculations
    const grossPrice = Number(booking.totalPrice ?? 0);
    const platformFee = Number(booking.platformFee ?? 0);
    const staffEarnings = Number(booking.staffEarnings ?? (grossPrice * 0.5));
    const companyNet = Number(booking.companyEarnings ?? (grossPrice - platformFee - staffEarnings));
    const profitMargin = grossPrice > 0 ? Math.round((companyNet / grossPrice) * 100) : 40;

    // Percentage splits for visual bar
    const staffPct = grossPrice > 0 ? Math.round((staffEarnings / grossPrice) * 100) : 50;
    const companyPct = grossPrice > 0 ? Math.round((companyNet / grossPrice) * 100) : 40;
    const feePct = 100 - staffPct - companyPct;

    // Stepper logic
    const isCancelled = booking.status === "cancelled";
    const stepOrder = ["pending", "confirmed", "in_progress", "completed"];
    const currentStepIndex = stepOrder.indexOf(booking.status);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10 pb-24">
            
            {/* ─── EXECUTIVE COMMAND HEADER ───────────────────────────────── */}
            <div className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Top sub-bar: Breadcrumbs + Context Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                            <Link
                                href="/company/bookings"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted font-medium transition-all"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Bookings
                            </Link>
                            <span className="text-muted-foreground/40 font-mono">/</span>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted/80 text-foreground font-mono text-xs font-bold border border-border/60">
                                <span>#{booking.id}</span>
                                <button
                                    onClick={() => copyToClipboard(booking.id, "id")}
                                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copy Order ID"
                                >
                                    {copiedField === "id" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-2">
                            {booking.status === "pending" && (
                                <>
                                    <Button
                                        size="sm"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate("accept")}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/15"
                                    >
                                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                                        Accept Order
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate("reject")}
                                        className="h-9 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                                    >
                                        Decline
                                    </Button>
                                </>
                            )}

                            {booking.status === "confirmed" && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedStaffId(booking.assignedStaff?.id || "");
                                            setShowAssignModal(true);
                                        }}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-primary hover:from-indigo-700 hover:to-primary/90 text-primary-foreground font-semibold text-xs shadow-md shadow-indigo-600/15"
                                    >
                                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                        {booking.assignedStaff ? "Reassign Staff" : "Assign Technician"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate("cancel")}
                                        className="h-9 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}

                            {booking.status === "in_progress" && (
                                <>
                                    <Button
                                        size="sm"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate("complete")}
                                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/15"
                                    >
                                        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
                                        Mark Completed
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={actionLoading}
                                        onClick={() => handleStatusUpdate("cancel")}
                                        className="h-9 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowInvoiceModal(true)}
                                className="h-9 px-3.5 rounded-xl border-border bg-card/80 hover:bg-muted text-xs font-semibold text-foreground shadow-2xs"
                            >
                                <Receipt className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                Invoice & Receipt
                            </Button>
                        </div>
                    </div>

                    {/* Main Title & Hero KPI Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                                    {booking.service.name}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${currentStatus.badgeClass}`}>
                                    <span className={`w-2 h-2 rounded-full ${currentStatus.dotClass}`} />
                                    {currentStatus.label}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    {formatDate(booking.bookingDate)}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                    {formatTime(booking.startTime, booking.endTime)}
                                </span>
                                {booking.service.durationMin && (
                                    <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium">
                                            {booking.service.durationMin} mins duration
                                        </span>
                                    </>
                                )}
                                {booking.service.serviceType?.name && (
                                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-[11px]">
                                        {booking.service.serviceType.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Executive Metric Capsule */}
                        <div className="flex items-center gap-3 bg-card border border-border/80 rounded-2xl p-2.5 px-4 shadow-sm shrink-0">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gross Value</p>
                                <p className="text-lg font-black text-foreground font-heading">
                                    ${grossPrice.toFixed(2)}
                                </p>
                            </div>
                            <div className="w-px h-8 bg-border/80" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Net Profit</p>
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-heading">
                                    +${companyNet.toFixed(2)}
                                </p>
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-500/20">
                                {profitMargin}% Margin
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── WORKSPACE CONTENT CONTAINER ────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* ─── 1. MODERN PIPELINE JOURNEY STEPPER ─────────────────── */}
                <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm overflow-hidden relative">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            <h2 className="text-xs font-extrabold text-foreground uppercase tracking-widest">
                                Order Lifecycle Status
                            </h2>
                        </div>
                        {booking.status === "completed" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                <CheckCheck className="w-3.5 h-3.5" /> All Milestones Completed & Verified
                            </span>
                        )}
                        {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                <AlertTriangle className="w-3.5 h-3.5" /> Order Cancelled
                            </span>
                        )}
                    </div>

                    {isCancelled ? (
                        <div className="rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                                    Booking terminated before completion
                                </p>
                                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                                    Reason: {booking.cancellation?.reason || "Cancelled by client or company."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Connecting Track Line */}
                            <div className="hidden md:block absolute top-5 left-8 right-8 h-1 bg-muted rounded-full z-0">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700"
                                    style={{
                                        width: currentStepIndex === 0 ? "10%" :
                                               currentStepIndex === 1 ? "40%" :
                                               currentStepIndex === 2 ? "70%" : "100%"
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                                {/* Step 1: Placed */}
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                                        currentStepIndex >= 0
                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                        <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Milestone 1</p>
                                        <p className="text-sm font-bold text-foreground">Order Booked</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {booking.createdAt ? formatDate(booking.createdAt) : "Received"}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2: Dispatched */}
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                                        currentStepIndex >= 1
                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                                            : currentStepIndex === 0
                                            ? "bg-primary/10 text-primary border-primary animate-pulse"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                        {currentStepIndex >= 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Milestone 2</p>
                                        <p className="text-sm font-bold text-foreground">
                                            {technicianName ? "Dispatched" : "Staff Allocation"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[160px]">
                                            {technicianName ? technicianName : "Awaiting assignment"}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3: In Progress */}
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                                        currentStepIndex >= 2
                                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25"
                                            : currentStepIndex === 1
                                            ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 animate-pulse"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                        {currentStepIndex >= 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Milestone 3</p>
                                        <p className="text-sm font-bold text-foreground">On-Site Work</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatExactTime(booking.actualStartTime) ? `Started at ${formatExactTime(booking.actualStartTime)}` : "Live on arrival"}
                                        </p>
                                    </div>
                                </div>

                                {/* Step 4: Finished */}
                                <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                                        currentStepIndex >= 3
                                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25"
                                            : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                        {currentStepIndex >= 3 ? <ShieldCheck className="w-5 h-5" /> : "4"}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Milestone 4</p>
                                        <p className="text-sm font-bold text-foreground">Completed & Settled</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {formatExactTime(booking.actualEndTime) ? `Ended at ${formatExactTime(booking.actualEndTime)}` : "Quality sign-off"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── 2. MAIN 8:4 COMMAND GRID ───────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ════ LEFT COLUMN (8 cols): SERVICE EXECUTION ════ */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Card A: Service Scope & Customer Instructions */}
                        <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-base font-bold text-foreground font-heading">
                                        Job Scope & Execution Requirements
                                    </h2>
                                </div>
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">
                                    Base Rate: ${Number(booking.service.basePrice).toFixed(2)}
                                </span>
                            </div>

                            <p className="text-sm text-foreground/80 leading-relaxed mb-6 font-normal">
                                {booking.service.description || "Comprehensive service delivered adhering strictly to company standard operating procedures."}
                            </p>

                            {/* Customer Instructions Quote */}
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 mb-6 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                                    <MessageSquare className="w-3.5 h-3.5" /> Customer Special Instructions
                                </div>
                                {booking.customerNotes ? (
                                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 italic pl-1 border-l-2 border-amber-500/40">
                                        "{booking.customerNotes}"
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        No special gate code or custom instructions were noted by customer.
                                    </p>
                                )}
                            </div>

                            {/* Task Checklist Progress */}
                            {booking.checklist && Array.isArray(booking.checklist) && booking.checklist.length > 0 && (
                                <div className="pt-2 border-t border-border/60">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            Service Checklist
                                        </span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                            {booking.progressPercent ?? 100}% Completed
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-4">
                                        <div
                                            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${booking.progressPercent ?? 100}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {booking.checklist.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                                                    item.completed
                                                        ? 'bg-emerald-500/5 border-emerald-500/25 text-foreground'
                                                        : 'bg-muted/20 border-border text-muted-foreground'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                                    item.completed
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                                        : 'border-muted-foreground/40 bg-background'
                                                }`}>
                                                    {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <span className={item.completed ? "line-through opacity-85" : ""}>
                                                    {item.title}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Card B: Location & Map Launcher */}
                        <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm overflow-hidden relative">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-base font-bold text-foreground font-heading">
                                        Location & Dispatch Navigation
                                    </h2>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(booking.serviceAddress, "address")}
                                    className="h-8 text-xs px-3 rounded-xl border-border hover:bg-muted font-medium"
                                >
                                    {copiedField === "address" ? <Check className="w-3 h-3 text-emerald-600 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                                    Copy Address
                                </Button>
                            </div>

                            {/* Location Callout Banner */}
                            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <p className="text-sm font-bold text-foreground leading-relaxed">
                                        {booking.serviceAddress}
                                    </p>
                                    {booking.latitude && booking.longitude && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                                            <Compass className="w-3 h-3 text-primary" />
                                            <span>GPS: {Number(booking.latitude).toFixed(4)}, {Number(booking.longitude).toFixed(4)}</span>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    size="sm"
                                    className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shrink-0 shadow-sm"
                                    asChild
                                >
                                    <a
                                        href={booking.latitude && booking.longitude
                                            ? `https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.serviceAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Navigation className="w-3.5 h-3.5 mr-1.5" />
                                        Directions (Maps)
                                    </a>
                                </Button>
                            </div>

                            {booking.staffStartLatitude && booking.staffStartLongitude && (
                                <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Compass className="w-3.5 h-3.5 text-primary" />
                                    Technician origin recorded: {Number(booking.staffStartLatitude).toFixed(4)}, {Number(booking.staffStartLongitude).toFixed(4)}
                                </p>
                            )}
                        </div>

                        {/* Card C: Proof of Work & Customer Review */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Proof of Work */}
                            <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Camera className="w-4 h-4 text-primary" /> Proof of Work Photo
                                        </h3>
                                        {workPhotoUrl && (
                                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                                                Verified
                                            </span>
                                        )}
                                    </div>

                                    {workPhotoUrl ? (
                                        <div
                                            onClick={() => setShowProofModal(true)}
                                            className="group relative h-44 rounded-xl overflow-hidden border border-border cursor-pointer bg-muted"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={workPhotoUrl.replace('localhost', '127.0.0.1')}
                                                alt="Proof of work completion"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5 backdrop-blur-xs">
                                                <ExternalLink className="w-4 h-4" /> Click to view full image
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-44 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/70 p-4 text-center bg-muted/10">
                                            <Camera className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                                            <p className="text-xs font-bold text-foreground">No photos attached</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Technician signed off without photo upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Review & Rating */}
                            <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Star className="w-4 h-4 text-amber-500" /> Customer Review
                                        </h3>
                                        {booking.review && (
                                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                                                Verified Client
                                            </span>
                                        )}
                                    </div>

                                    {booking.review ? (
                                        <div className="h-44 rounded-xl bg-amber-500/5 border border-amber-500/20 p-5 flex flex-col justify-center">
                                            <div className="flex gap-1 mb-3">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${
                                                            i < (booking.review?.companyRating || 0)
                                                                ? "fill-amber-400 text-amber-400"
                                                                : "text-muted-foreground/25"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs font-medium text-foreground italic line-clamp-3 leading-relaxed">
                                                {booking.review.companyComment
                                                    ? `"${booking.review.companyComment}"`
                                                    : "Customer rated 5/5 stars with verified sign-off."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-44 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground/70 p-4 text-center bg-muted/10">
                                            <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-muted-foreground" />
                                            <p className="text-xs font-bold text-foreground">Awaiting review</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">Customer will receive an automated feedback prompt</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card D: Lifecycle Audit Trail */}
                        <div className="bg-card rounded-2xl border border-border/80 p-6 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <h2 className="text-base font-bold text-foreground font-heading">
                                        Audit & Event History
                                    </h2>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {(booking.statusLogs?.length || 0)} recorded transactions
                                </span>
                            </div>

                            {booking.statusLogs && booking.statusLogs.length > 0 ? (
                                <div className="space-y-4 relative pl-5 border-l-2 border-primary/20 ml-2 py-1">
                                    {booking.statusLogs.map((log) => {
                                        const dateObj = new Date(log.changedAt);
                                        const timeDisplay = isNaN(dateObj.getTime())
                                            ? log.changedAt
                                            : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " • " + dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                                        return (
                                            <div key={log.id} className="relative group">
                                                {/* Connecting node */}
                                                <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background bg-primary shadow-xs" />

                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-foreground capitalize">
                                                            {log.oldStatus ? `${log.oldStatus.replace('_', ' ')} → ${log.newStatus?.replace('_', ' ')}` : `Status set to ${log.newStatus?.replace('_', ' ')}`}
                                                        </span>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            Action by {log.changedBy ? `User #${log.changedBy}` : "Automated System Service"}
                                                        </p>
                                                    </div>
                                                    <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                                                        {timeDisplay}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground py-4 text-center">
                                    No audit transitions recorded for this booking.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ════ RIGHT COLUMN (4 cols): FINTECH & CRM CONTROL RAIL ════ */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* 1. FINTECH EXECUTIVE FINANCIAL SETTLEMENT CARD */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl overflow-hidden relative">
                            {/* Decorative ambient background glow */}
                            <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                                        Payout Settlement
                                    </span>
                                </div>
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                                    {booking.payment?.status || "Authorized"}
                                </span>
                            </div>

                            {/* Hero Profit Metric */}
                            <div className="mb-5">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Retained Company Net Profit
                                </p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-black text-emerald-400 font-heading tracking-tight">
                                        +${companyNet.toFixed(2)}
                                    </span>
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {profitMargin}% Share
                                    </span>
                                </div>
                            </div>

                            {/* Distribution Segment Bar */}
                            <div className="space-y-1.5 mb-6">
                                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                    <span>Revenue Distribution</span>
                                    <span>${grossPrice.toFixed(2)} Total</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${companyPct}%` }} className="bg-emerald-500" title="Company Net" />
                                    <div style={{ width: `${staffPct}%` }} className="bg-indigo-500" title="Staff Payout" />
                                    <div style={{ width: `${feePct}%` }} className="bg-slate-600" title="Platform Fee" />
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Company ({companyPct}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-indigo-500" /> Staff ({staffPct}%)
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-slate-600" /> Fee ({feePct}%)
                                    </span>
                                </div>
                            </div>

                            {/* Itemized Payout Breakdown */}
                            <div className="space-y-3 text-xs border-t border-slate-800/80 pt-4">
                                <div className="flex justify-between text-slate-300">
                                    <span>Gross Customer Paid</span>
                                    <span className="font-bold text-white font-mono">${grossPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-rose-400">
                                    <span>Platform Fee (10%)</span>
                                    <span className="font-semibold font-mono">-${platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-indigo-300">
                                    <span>Technician Payout (50%)</span>
                                    <span className="font-semibold font-mono">-${staffEarnings.toFixed(2)}</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => setShowInvoiceModal(true)}
                                className="w-full mt-6 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
                            >
                                <Receipt className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                                View Full Invoice
                            </Button>
                        </div>

                        {/* 2. Customer Dossier Card */}
                        <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-primary" /> Customer Dossier
                                </span>
                                <Link
                                    href={`/company/customers/${booking.customer.id}`}
                                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                                >
                                    CRM Profile <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="flex items-center gap-3.5 mb-4">
                                <Avatar className="w-12 h-12 rounded-xl border border-border shadow-xs">
                                    <AvatarFallback className="font-bold text-primary bg-primary/10 rounded-xl text-base">
                                        {booking.customer.fullName ? booking.customer.fullName.charAt(0) : "C"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-sm text-foreground truncate">
                                        {booking.customer.fullName}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {booking.customer.email}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 py-2 border-t border-border/60 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Phone Contact</span>
                                    <span className="font-bold text-foreground font-mono">
                                        {booking.customer.phone || "Not provided"}
                                    </span>
                                </div>
                            </div>

                            {booking.customer.phone && (
                                <div className="mt-4 pt-3 border-t border-border/60">
                                    <Button
                                        size="sm"
                                        className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs"
                                        asChild
                                    >
                                        <a href={`tel:${booking.customer.phone}`}>
                                            <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Customer
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 3. Field Technician Card */}
                        <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-primary" /> Dispatched Staff
                                </span>
                                {booking.assignedStaff && (
                                    <button
                                        onClick={() => {
                                            setSelectedStaffId(booking.assignedStaff?.id || "");
                                            setShowAssignModal(true);
                                        }}
                                        className="text-xs font-bold text-primary hover:underline"
                                    >
                                        Reassign
                                    </button>
                                )}
                            </div>

                            {booking.assignedStaff ? (
                                <div>
                                    <div className="flex items-center gap-3.5 mb-4">
                                        <Avatar className="w-12 h-12 rounded-xl border border-border shadow-xs">
                                            <AvatarFallback className="font-bold text-emerald-600 bg-emerald-500/10 rounded-xl text-base">
                                                {technicianName ? technicianName.charAt(0) : "T"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-sm text-foreground truncate">
                                                {technicianName}
                                            </h3>
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground capitalize mt-0.5">
                                                {technicianRole}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 py-2 border-t border-border/60 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Mobile Phone</span>
                                            <span className="font-bold text-foreground font-mono">
                                                {technicianPhone || "Registered on Staff App"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Staff Member ID</span>
                                            <span className="font-mono text-muted-foreground font-medium">
                                                #{booking.assignedStaff.id}
                                            </span>
                                        </div>
                                    </div>

                                    {technicianPhone && (
                                        <div className="mt-4 pt-3 border-t border-border/60">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full h-9 rounded-xl border-border text-xs font-bold hover:bg-muted"
                                                asChild
                                            >
                                                <a href={`tel:${technicianPhone}`}>
                                                    <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Staff Member
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-5 space-y-3">
                                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 mx-auto flex items-center justify-center shadow-xs">
                                        <UserPlus className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-foreground">Technician Needed</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Order is ready for staff assignment.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowAssignModal(true)}
                                        className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                                    >
                                        Assign Technician Now
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* 4. Guarantee Shield */}
                        <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-foreground">Escrow & Guarantee Protected</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                        All service terms satisfied. No active disputes filed.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* ─── MODAL: DISPATCH STAFF ──────────────────────────────────── */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="rounded-2xl max-w-md bg-background border border-border">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground">
                            Dispatch Field Technician
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Select a qualified technician to assign to Order #{booking.id}.
                        </DialogDescription>
                    </DialogHeader>

                    {loadingStaff ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary opacity-60" />
                        </div>
                    ) : staffList.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs">
                            No active staff members available.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 py-2">
                            {staffList.filter(s => s.status !== 'inactive').map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setSelectedStaffId(s.id)}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                                        selectedStaffId === s.id
                                            ? "border-primary bg-primary/10 text-primary shadow-xs"
                                            : "border-border hover:bg-muted/50"
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-xs text-foreground">{s.fullName || s.user?.fullName}</p>
                                        <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{s.role || "Technician"}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                        selectedStaffId === s.id ? "border-primary bg-primary text-white" : "border-border"
                                    }`}>
                                        {selectedStaffId === s.id && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <DialogFooter className="flex gap-2 sm:gap-2 mt-4">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-9 text-xs font-semibold"
                            onClick={() => setShowAssignModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!selectedStaffId || actionLoading}
                            onClick={handleAssignStaff}
                            className="flex-1 rounded-xl h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                        >
                            {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                            Confirm Dispatch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: PROOF OF WORK ───────────────────────────────────── */}
            <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
                <DialogContent className="rounded-2xl max-w-2xl bg-background border border-border p-5">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <Camera className="w-4 h-4 text-primary" /> Work Completion Verification
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            High-resolution photo uploaded upon on-site completion.
                        </DialogDescription>
                    </DialogHeader>
                    {workPhotoUrl && (
                        <div className="rounded-xl overflow-hidden border border-border mt-3 bg-muted/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={workPhotoUrl.replace('localhost', '127.0.0.1')}
                                alt="High-resolution proof of work"
                                className="w-full max-h-[70vh] object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── MODAL: INVOICE & RECEIPT ─────────────────────────────────── */}
            <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
                <DialogContent className="rounded-2xl max-w-md bg-background border border-border p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-primary" /> Official Receipt #{booking.id}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Operational receipt and revenue split documentation.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 text-xs py-4 border-y border-border/80">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Name</span>
                            <span className="font-bold text-foreground">{booking.service.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Client Name</span>
                            <span className="font-medium text-foreground">{booking.customer.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Date Delivered</span>
                            <span className="font-medium text-foreground">{formatDate(booking.bookingDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Dispatched Technician</span>
                            <span className="font-medium text-foreground">{technicianName || "Unassigned"}</span>
                        </div>

                        <div className="pt-3 border-t border-border/60 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Gross Price Authorized</span>
                                <span className="font-bold font-mono text-foreground">${grossPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600 dark:text-rose-400">
                                <span>Platform Service Fee</span>
                                <span className="font-mono">-${platformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Technician Payout</span>
                                <span className="font-mono">-${staffEarnings.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm pt-3 border-t border-border text-foreground">
                                <span>Company Net Profit</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono">+${companyNet.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="flex-1 rounded-xl h-9 text-xs font-semibold"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowInvoiceModal(false)}
                            className="flex-1 rounded-xl h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
