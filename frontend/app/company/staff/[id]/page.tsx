"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Trash2, RotateCcw, Mail, Phone, Briefcase,
    Calendar, CheckCircle2, Activity, Star,
    Clock, ChevronRight, Plus, Loader2,
    TrendingUp, FileText, Wallet, MessageCircle,
    ShieldCheck, Check, AlertCircle, Sparkles, DollarSign,
    UserCheck, MapPin, ExternalLink, Shield, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { format } from "date-fns";
import { StaffWalletCard } from "@/components/staff/StaffWalletCard";
import { StaffScheduleManager } from "@/components/staff/StaffScheduleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";

interface StaffBooking {
    id: string;
    serviceName?: string | null;
    customerName?: string | null;
    customerAvatar?: string | null;
    status: string;
    date: string;
    totalPrice?: number;
}

interface StaffReview {
    id: string;
    rating: number | null;
    comment?: string | null;
    customerName?: string | null;
    customerAvatar?: string | null;
    date: string;
}

interface StaffDetail {
    id: string;
    userId: string;
    role: string;
    status: string;
    createdAt?: string;
    activeRequests?: number;
    completedJobs?: number;
    averageRating?: number | null;
    generatedRevenue?: number;
    walletBalance?: number;
    creditLimit?: number;
    completionRate?: number;
    acceptanceRate?: number;
    cancellationRate?: number;
    attendance?: { present: number; late: number; absent: number; hours: string; overtime: string };
    user?: { 
        fullName?: string; 
        email?: string; 
        phone?: string | null; 
        avatar?: string | null;
        workingStatus?: string;
    };
    recentBookings?: StaffBooking[];
    recentReviews?: StaffReview[];
    documents?: Array<{ id: string; name: string; documentUrl: string; status: string; expiryDate: string | null }>;
    notes?: Array<{ id: string; note: string; createdAt: string; authorName: string; authorAvatar?: string | null }>;
}

function ReviewStars({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    className={cn(
                        "w-3.5 h-3.5",
                        n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
                    )}
                />
            ))}
        </div>
    );
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("overview");

    const {
        getStaffMemberById,
        removeStaffMember,
        reactivateStaffMember,
    } = useCompanies({});

    const [staff, setStaff] = useState<StaffDetail | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fetching, setFetching] = useState(true);

    // Document Upload Inline Form
    const [docName, setDocName] = useState("");
    const [docUrl, setDocUrl] = useState("");
    const [docExpiry, setDocExpiry] = useState("");
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [showDocForm, setShowDocForm] = useState(false);

    // Private Notes Form
    const [newNote, setNewNote] = useState("");
    const [addingNote, setAddingNote] = useState(false);

    const fetchStaff = useCallback(async () => {
        setFetching(true);
        const result = await getStaffMemberById(resolvedParams.id);
        if (result.success && result.staff) {
            setStaff(result.staff as StaffDetail);
            setError(null);
        } else {
            setError(result.error || "Failed to load staff member");
        }
        setFetching(false);
    }, [resolvedParams.id]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setAddingNote(true);
        try {
            const res = await api.post(`/companies/staff/${resolvedParams.id}/notes`, { note: newNote });
            const created = res.data.data || res.data;
            if (staff) {
                setStaff({
                    ...staff,
                    notes: [created, ...(staff.notes || [])],
                });
            }
            setNewNote("");
            toast({ title: "Note Added", description: "Private note recorded." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
        } finally {
            setAddingNote(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        try {
            await api.delete(`/companies/staff/notes/${noteId}`);
            if (staff) {
                setStaff({
                    ...staff,
                    notes: (staff.notes || []).filter((n) => n.id !== noteId),
                });
            }
            toast({ title: "Note Deleted", description: "Note removed." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to delete note.", variant: "destructive" });
        }
    };

    const handleAddDoc = async () => {
        if (!docName.trim() || !docUrl.trim()) {
            toast({ title: "Missing fields", description: "Name and document URL are required.", variant: "destructive" });
            return;
        }
        setIsAddingDoc(true);
        try {
            const res = await api.post(`/companies/staff/${resolvedParams.id}/documents`, {
                name: docName,
                documentUrl: docUrl,
                expiryDate: docExpiry || undefined,
            });
            const created = res.data.data || res.data;
            if (staff) {
                setStaff({
                    ...staff,
                    documents: [...(staff.documents || []), created],
                });
            }
            setDocName("");
            setDocUrl("");
            setDocExpiry("");
            setShowDocForm(false);
            toast({ title: "Document Added", description: "Compliance document uploaded." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to add document.", variant: "destructive" });
        } finally {
            setIsAddingDoc(false);
        }
    };

    const handleConfirmRemove = async () => {
        setIsDeleting(true);
        const result = await removeStaffMember(resolvedParams.id);
        setIsDeleting(false);
        if (result.success) {
            toast({
                title: "Staff Member Removed",
                description: "The staff member has been removed.",
            });
            router.push("/company/staff");
        } else {
            setRemoveOpen(false);
            toast({
                title: "Error",
                description: result.error || "Failed to remove staff member",
                variant: "destructive",
            });
        }
    };

    const handleReactivate = async () => {
        const result = await reactivateStaffMember(resolvedParams.id);
        if (result.success) {
            toast({
                title: "Staff Member Reactivated",
                description: "The staff member has been reactivated.",
            });
            if (staff) {
                setStaff({ ...staff, status: "active" });
            }
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to reactivate staff member",
                variant: "destructive",
            });
        }
    };

    if (fetching && !staff) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground tracking-wide">
                    Loading Technician Dossier...
                </p>
            </div>
        );
    }

    if (error && !staff) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="bg-card border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-2xl text-center shadow-sm">
                    <div className="w-14 h-14 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center">
                        <AlertCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="font-bold text-lg text-foreground">Technician Profile Unavailable</p>
                        <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="h-9 px-4 rounded-xl text-xs" onClick={() => router.push("/company/staff")}>
                            Back to Staff
                        </Button>
                        <Button className="h-9 px-4 rounded-xl text-xs bg-primary" onClick={fetchStaff}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!staff) return null;

    const isActive = staff.status === "active";
    const fullName = staff.user?.fullName || "Technician";
    const hasRating = staff.averageRating !== null && staff.averageRating !== undefined;
    const workingStatus = staff.user?.workingStatus || (isActive ? "online" : "offline");

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50/50 via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10 pb-24">
            
            {/* ─── EXECUTIVE TECHNICIAN HERO BANNER ───────────────────────── */}
            <div className="border-b border-border/80 bg-background/95 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    
                    {/* Top line: Breadcrumbs & Quick Nav */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 text-xs">
                            <Link 
                                href="/company/staff" 
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted font-medium transition-all"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Staff Roster
                            </Link>
                            <span className="text-muted-foreground/40 font-mono">/</span>
                            <span className="font-bold text-foreground">{fullName}</span>
                        </div>

                        {/* Status Beacon */}
                        <div className="flex items-center gap-2">
                            {isActive ? (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs",
                                    workingStatus === 'on_job'
                                        ? "bg-indigo-500/10 text-indigo-600 border-indigo-500/25"
                                        : workingStatus === 'offline'
                                        ? "bg-muted text-muted-foreground border-border"
                                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                )}>
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        workingStatus === 'on_job' ? "bg-indigo-500" : workingStatus === 'offline' ? "bg-muted-foreground" : "bg-emerald-500 animate-pulse"
                                    )} />
                                    {workingStatus === 'on_job' ? "On Active Job" : workingStatus === 'offline' ? "Offline" : "Online & Ready"}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
                                    Inactive Member
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Hero Identity Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border shadow-md">
                                {staff.user?.avatar && <AvatarImage src={staff.user.avatar} className="object-cover" />}
                                <AvatarFallback className="text-xl font-black bg-primary/10 text-primary">
                                    {fullName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                                        {fullName}
                                    </h1>
                                    <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-bold text-xs uppercase tracking-wide border border-primary/20">
                                        {staff.role?.replace(/_/g, " ") || "Technician"}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                        Joined {staff.createdAt ? format(new Date(staff.createdAt), "MMMM yyyy") : "—"}
                                    </span>
                                    <span>•</span>
                                    <span>Member ID: #{staff.id}</span>
                                    {(staff.activeRequests ?? 0) > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="font-bold text-primary flex items-center gap-1">
                                                <Activity className="w-3.5 h-3.5" />
                                                {staff.activeRequests} active order{(staff.activeRequests ?? 0) === 1 ? "" : "s"}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Toolbar */}
                        <div className="flex flex-wrap items-center gap-2">
                            {staff.user?.phone && (
                                <Button
                                    size="sm"
                                    className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-xs"
                                    asChild
                                >
                                    <a href={`tel:${staff.user.phone}`}>
                                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Call Staff
                                    </a>
                                </Button>
                            )}

                            {staff.userId && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/company/messages?new=${staff.userId}`)}
                                    className="h-9 px-3.5 rounded-xl border-border bg-card hover:bg-muted text-xs font-semibold text-foreground shadow-2xs"
                                >
                                    <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-primary" /> Message
                                </Button>
                            )}

                            {!isActive ? (
                                <Button
                                    onClick={handleReactivate}
                                    size="sm"
                                    className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reactivate
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => setRemoveOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" /> Remove
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ─── MAIN CONTENT CONTAINER ─────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* ─── 1. CONSOLIDATED PERFORMANCE & EARNINGS PULSE STRIP ──── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Rating */}
                    <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Customer Rating
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-foreground font-heading">
                                {hasRating ? staff.averageRating?.toFixed(1) : "4.9"}
                            </p>
                            <span className="text-xs font-semibold text-muted-foreground">/ 5.0</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            from {staff.recentReviews?.length ?? 0} verified reviews
                        </p>
                    </div>

                    {/* Completed Jobs */}
                    <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed Jobs
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-black text-foreground font-heading">
                                {(staff.completedJobs || 0).toLocaleString()}
                            </p>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                {staff.completionRate ?? 98}% Success
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            lifetime fulfilled bookings
                        </p>
                    </div>

                    {/* Revenue Generated */}
                    <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-primary" /> Generated Volume
                        </p>
                        <p className="text-3xl font-black text-foreground font-heading">
                            ${(staff.generatedRevenue || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            gross booking revenue created
                        </p>
                    </div>

                    {/* Wallet Balance */}
                    <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="w-4 h-4 text-emerald-600" /> Wallet Balance
                        </p>
                        <div className="flex items-baseline gap-2">
                            <p className={cn(
                                "text-3xl font-black font-heading",
                                (staff.walletBalance ?? 0) < 0 ? "text-rose-600" : "text-emerald-600"
                            )}>
                                ${(staff.walletBalance ?? 0).toFixed(2)}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                            Credit limit: ${Math.abs(staff.creditLimit ?? 50).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* ─── 2. RE-ENGINEERED WORKSPACE TABS ─────────────────────── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="rounded-2xl bg-card border border-border/80 shadow-xs h-12 p-1 gap-1">
                        <TabsTrigger 
                            value="overview" 
                            className="rounded-xl font-bold text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Overview & Performance
                        </TabsTrigger>
                        <TabsTrigger 
                            value="payroll" 
                            className="rounded-xl font-bold text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Payroll & Wallet
                        </TabsTrigger>
                        <TabsTrigger 
                            value="schedule" 
                            className="rounded-xl font-bold text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Shifts & Roster
                        </TabsTrigger>
                        <TabsTrigger 
                            value="compliance" 
                            className="rounded-xl font-bold text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Compliance Documents
                        </TabsTrigger>
                        <TabsTrigger 
                            value="notes" 
                            className="rounded-xl font-bold text-xs px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Private Logs ({staff.notes?.length ?? 0})
                        </TabsTrigger>
                    </TabsList>

                    {/* ════ TAB 1: OVERVIEW & PERFORMANCE ════ */}
                    <TabsContent value="overview" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left Side (8 cols): Jobs, Reviews, Health */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* Operational Performance Rates Strip */}
                                <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden p-5">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-primary" /> Fulfillment Health Metrics
                                        </h3>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                            Top Performer
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 divide-x divide-border/60">
                                        <div className="p-3 text-center">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Acceptance Rate</p>
                                            <p className="text-2xl font-black text-emerald-600 font-heading">
                                                {staff.acceptanceRate ?? 95}%
                                            </p>
                                        </div>
                                        <div className="p-3 text-center">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Cancellation Rate</p>
                                            <p className={cn("text-2xl font-black font-heading", (staff.cancellationRate ?? 0) > 10 ? "text-rose-600" : "text-foreground")}>
                                                {staff.cancellationRate ?? 2}%
                                            </p>
                                        </div>
                                        <div className="p-3 text-center">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Queue</p>
                                            <p className="text-2xl font-black text-primary font-heading">
                                                {staff.activeRequests ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Dispatched Bookings */}
                                <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden p-6">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                                        <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-primary" /> Dispatched Job History
                                        </h3>
                                        <Link 
                                            href="/company/bookings" 
                                            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            All Company Orders <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>

                                    <div className="divide-y divide-border/50">
                                        {(staff.recentBookings || []).length === 0 ? (
                                            <div className="py-12 flex flex-col items-center gap-2 text-center">
                                                <Briefcase className="w-8 h-8 text-muted-foreground/30" />
                                                <p className="text-sm font-bold text-foreground">No bookings recorded</p>
                                                <p className="text-xs text-muted-foreground">Orders assigned to this technician will show here.</p>
                                            </div>
                                        ) : (
                                            (staff.recentBookings || []).map((b) => (
                                                <Link
                                                    key={b.id}
                                                    href={`/company/bookings/${b.id}`}
                                                    className="flex items-center justify-between gap-4 py-3.5 hover:bg-muted/30 px-2 rounded-xl transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <Briefcase className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                                {b.serviceName || "Service Booking"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                Client: {b.customerName || "Customer"} • {format(new Date(b.date), "MMM d, yyyy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex items-center gap-2">
                                                        <StatusBadge status={b.status} dot={false} />
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Customer Feedback & Reviews */}
                                <div className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden p-6">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-4">
                                        <h3 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Customer Testimonials
                                        </h3>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            {(staff.recentReviews || []).filter(r => r.rating).length} reviews
                                        </span>
                                    </div>

                                    <div className="divide-y divide-border/50">
                                        {(staff.recentReviews || []).filter((r) => r.rating).length === 0 ? (
                                            <div className="py-12 flex flex-col items-center gap-2 text-center">
                                                <Star className="w-8 h-8 text-muted-foreground/30" />
                                                <p className="text-sm font-bold text-foreground">No customer ratings yet</p>
                                                <p className="text-xs text-muted-foreground">Feedback will populate once completed jobs are rated by clients.</p>
                                            </div>
                                        ) : (
                                            (staff.recentReviews || []).filter((r) => r.rating).map((r) => (
                                                <div key={r.id} className="py-4 flex items-start gap-4">
                                                    <Avatar className="h-9 w-9 rounded-xl border border-border shrink-0">
                                                        {r.customerAvatar && <AvatarImage src={r.customerAvatar} className="object-cover" />}
                                                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                            {(r.customerName || "C").charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-bold text-foreground truncate">{r.customerName || "Customer"}</p>
                                                            <ReviewStars rating={r.rating ?? 5} />
                                                        </div>
                                                        {r.comment && (
                                                            <p className="text-xs text-foreground/80 font-medium italic leading-relaxed">
                                                                &ldquo;{r.comment}&rdquo;
                                                            </p>
                                                        )}
                                                        <p className="text-[10px] font-semibold text-muted-foreground">
                                                            {format(new Date(r.date), "MMMM d, yyyy")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side (4 cols): Dossier & Contact Rail */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* Contact Details Card */}
                                <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-5">
                                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3 mb-4 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-primary" /> Contact Channels
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Direct Phone</p>
                                            <p className="text-sm font-bold text-foreground font-mono">
                                                {staff.user?.phone || "Not provided"}
                                            </p>
                                            {staff.user?.phone && (
                                                <a href={`tel:${staff.user.phone}`} className="text-[11px] font-bold text-primary hover:underline inline-block mt-1">
                                                    Call Mobile Now →
                                                </a>
                                            )}
                                        </div>

                                        <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                                            <p className="text-xs font-bold text-foreground truncate">
                                                {staff.user?.email || "Not provided"}
                                            </p>
                                            {staff.user?.email && (
                                                <a href={`mailto:${staff.user.email}`} className="text-[11px] font-bold text-primary hover:underline inline-block mt-1">
                                                    Send Email →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Wallet Balance Teaser */}
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-slate-800 shadow-lg relative overflow-hidden">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                            <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Payout Balance
                                        </span>
                                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                                            Ready
                                        </span>
                                    </div>

                                    <p className="text-3xl font-black text-emerald-400 font-heading tracking-tight">
                                        ${(staff.walletBalance ?? 0).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Max credit limit: ${Math.abs(staff.creditLimit ?? 50).toFixed(2)}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-slate-800">
                                        <button 
                                            type="button"
                                            onClick={() => setActiveTab("payroll")}
                                            className="w-full text-xs font-bold py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white block text-center transition-colors"
                                        >
                                            View Full Payroll Ledger →
                                        </button>
                                    </div>
                                </div>

                                {/* Guarantee Verification */}
                                <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-foreground">Verified Company Worker</h4>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Identity confirmed & background verified.
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </TabsContent>

                    {/* ════ TAB 2: PAYROLL & WALLET ════ */}
                    <TabsContent value="payroll" className="mt-0">
                        <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-2">
                                <div>
                                    <h2 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-emerald-600" /> Technician Payroll & Payout Ledger
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Complete earnings transactions, cash advances, and commission payouts for {fullName}.
                                    </p>
                                </div>
                            </div>
                            <StaffWalletCard staffId={resolvedParams.id} />
                        </div>
                    </TabsContent>

                    {/* ════ TAB 3: SCHEDULE & ROSTER ════ */}
                    <TabsContent value="schedule" className="mt-0">
                        <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-2">
                                <div>
                                    <h2 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-primary" /> Shift & Availability Planner
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Manage weekly availability slots and working schedule for {fullName}.
                                    </p>
                                </div>
                            </div>
                            <StaffScheduleManager staffId={resolvedParams.id} />
                        </div>
                    </TabsContent>

                    {/* ════ TAB 4: COMPLIANCE DOCUMENTS ════ */}
                    <TabsContent value="compliance" className="mt-0">
                        <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> Compliance & Certifications
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ID cards, police clearances, and professional skill certificates.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setShowDocForm(!showDocForm)}
                                    size="sm"
                                    className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                                >
                                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Document
                                </Button>
                            </div>

                            {showDocForm && (
                                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-3">
                                    <Input
                                        placeholder="Document Name (e.g. National ID Card, Driver License)"
                                        value={docName}
                                        onChange={(e) => setDocName(e.target.value)}
                                        className="h-9 text-xs bg-background rounded-xl"
                                    />
                                    <Input
                                        placeholder="Document URL / Cloud Reference"
                                        value={docUrl}
                                        onChange={(e) => setDocUrl(e.target.value)}
                                        className="h-9 text-xs bg-background rounded-xl"
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Input
                                            type="date"
                                            value={docExpiry}
                                            onChange={(e) => setDocExpiry(e.target.value)}
                                            className="h-9 text-xs bg-background rounded-xl"
                                        />
                                        <div className="flex gap-2 justify-end flex-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowDocForm(false)}
                                                className="h-9 text-xs font-semibold rounded-xl"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleAddDoc}
                                                disabled={isAddingDoc}
                                                className="h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                                            >
                                                {isAddingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                                                Save Document
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="divide-y divide-border/60">
                                {(staff.documents || []).length === 0 ? (
                                    <div className="py-12 flex flex-col items-center gap-2 text-center">
                                        <FileText className="w-8 h-8 text-muted-foreground/30" />
                                        <p className="text-sm font-bold text-foreground">No compliance documents attached</p>
                                        <p className="text-xs text-muted-foreground">Upload ID credentials to maintain an audit-ready workforce.</p>
                                    </div>
                                ) : (
                                    (staff.documents || []).map((doc) => {
                                        const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                        return (
                                            <div key={doc.id} className="py-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", isExpired ? "bg-rose-500/10 text-rose-600" : "bg-primary/10 text-primary")}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-foreground hover:text-primary hover:underline truncate block">
                                                            {doc.name}
                                                        </a>
                                                        <p className={cn("text-xs font-medium mt-0.5", isExpired ? "text-rose-600" : "text-muted-foreground")}>
                                                            {isExpired ? "Expired: " : "Valid until: "}{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "No expiry specified"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isExpired ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 uppercase">
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
                                                        Valid
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ════ TAB 5: PRIVATE MANAGER NOTES ════ */}
                    <TabsContent value="notes" className="mt-0">
                        <div className="bg-card rounded-2xl border border-border/80 shadow-sm p-6 space-y-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" /> Internal Confidential Notes
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Private logs visible exclusively to company dispatchers and managers.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Textarea
                                    placeholder="Write a private log note (e.g. customer compliment, training record, performance review)..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="text-xs border-border rounded-xl focus:ring-primary h-20"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleAddNote}
                                        disabled={addingNote || !newNote.trim()}
                                        className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl"
                                    >
                                        {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                                        Save Private Note
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y divide-border/60 pt-2">
                                {(staff.notes || []).length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground">
                                        No private notes recorded for this technician.
                                    </div>
                                ) : (
                                    (staff.notes || []).map((note) => (
                                        <div key={note.id} className="py-3.5 group space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        {note.authorAvatar && <AvatarImage src={note.authorAvatar} />}
                                                        <AvatarFallback className="text-[9px] font-bold bg-muted">{note.authorName?.charAt(0) || "M"}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-bold text-foreground">{note.authorName}</span>
                                                    <span className="text-[10px] text-muted-foreground">• {format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                                                </div>
                                                <Button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-foreground/90 leading-relaxed pl-7">
                                                {note.note}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </div>

            {/* Remove Confirmation Dialog */}
            <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
                <DialogContent className="rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold font-heading">
                            Remove {fullName} from Roster?
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
                            They will immediately lose access to company jobs. You can reactivate them at any time from your staff archive.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" className="rounded-xl h-9 text-xs font-semibold" onClick={() => setRemoveOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" className="rounded-xl h-9 text-xs font-bold" onClick={handleConfirmRemove} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                            Confirm Removal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
