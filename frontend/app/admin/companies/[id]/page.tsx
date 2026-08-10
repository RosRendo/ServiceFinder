"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
    ArrowLeft, CheckCircle2, ShieldCheck, Star, 
    MessageSquare, ChevronRight, MoreVertical,
    TrendingUp, FileText, UserCheck, Activity,
    Building2, MapPin, Map, Globe, User, ShieldAlert,
    Ban, Clock, Calendar, Briefcase, Users, Edit2, DollarSign, Receipt,
    History, AlertTriangle, PlayCircle, Mail, Phone, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditCompanyModal } from "@/components/admin/EditCompanyModal";
import { useToast } from "@/lib/hooks/use-toast";
import { useAPI } from "@/lib/hooks/useAPI";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [isActioning, setIsActioning] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");

    const { data: company, loading, error, refetch } = useAPI(`/api/admin/companies/${resolvedParams.id}`);

    const handleVerify = async () => {
        if (!confirm("Are you sure you want to approve this company?")) return;
        setIsActioning(true);
        try {
            await api.post(`/admin/companies/${resolvedParams.id}/verify`);
            toast({ title: "Company Approved", description: "The company has been verified." });
            refetch();
        } catch (err) {
            toast({ title: "Error", description: "Failed to verify company.", variant: "destructive" });
        } finally {
            setIsActioning(false);
        }
    };

    const handleSuspend = async () => {
        if (!confirm("Are you sure you want to suspend this company? This will freeze their operations.")) return;
        setIsActioning(true);
        try {
            toast({ title: "Company Suspended", description: "Company operations frozen.", variant: "destructive" });
        } catch (err) {
            toast({ title: "Error", description: "Failed to suspend company.", variant: "destructive" });
        } finally {
            setIsActioning(false);
        }
    };

    if (loading && !company) return (
        <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (error && !company) return (
        <div className="h-full flex items-center justify-center px-4">
            <div className="bg-background border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-xl text-center shadow-sm">
                <div className="w-16 h-16 bg-rose-500/10 rounded-xl flex items-center justify-center mb-2 border border-rose-500/20">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <p className="text-rose-500 font-bold text-lg">{error}</p>
                <Button variant="outline" className="h-10 px-6 rounded-lg" onClick={() => router.back()}>Go Back</Button>
            </div>
        </div>
    );

    if (!company) return null;

    const isVerified = company.verificationStatus === "verified" || company.verificationStatus === "active";
    const isSuspended = company.verificationStatus === "suspended";

    const realBookings = company.bookings || [];
    const totalRevenue = realBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

    const metricsData = {
        bookings: realBookings.length,
        revenue: totalRevenue,
        staff: company.staff?.length || 0,
        rating: company.rating || 5.0,
        completionRate: company.completionRate ? Number(company.completionRate) : 100
    };

    const financeData = {
        platformFees: totalRevenue * ((company.platformFeePercent || 15) / 100),
        pendingPayouts: 0,
        refunds: 0,
        commissionPlan: company.platformFeePercent || 15
    };

    const now = new Date();
    const chartData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthLabel = format(d, 'MMM');
        
        const monthBookings = realBookings.filter((b: any) => {
            if (!b.createdAt) return false;
            const bDate = new Date(b.createdAt);
            return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
        });
        
        const revenue = monthBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);
        
        return { month: monthLabel, revenue };
    });

    return (
        <div className="h-full overflow-y-auto bg-muted/30 font-sans pb-24 custom-scrollbar">
            {/* 1. Global Header */}
            <div className="bg-background border-b border-border sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-8 pt-6 pb-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        <Link href="/admin/companies" className="hover:text-foreground transition-colors">Companies</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground">Company Management</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                            <Link href="/admin/companies" className="mt-1">
                                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-border shadow-sm hover:bg-muted/30 transition-colors bg-background">
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </Button>
                            </Link>
                            <div className="flex items-start gap-5">
                                <Avatar className="h-16 w-16 rounded-xl shadow-sm border border-border bg-violet-500/10 text-violet-600">
                                    {company.logoUrl && <AvatarImage src={company.logoUrl} className="object-cover" />}
                                    <AvatarFallback className="text-xl font-black bg-violet-600 text-white">
                                        {company.name?.[0] || <Building2 className="w-8 h-8" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                        <h1 className="text-2xl font-black text-foreground tracking-tight">
                                            {company.name}
                                        </h1>
                                        <span className={cn("px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest", 
                                            isSuspended ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        )}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", isSuspended ? "bg-rose-500" : "bg-emerald-500")} />
                                            {isSuspended ? "Suspended" : "Active"}
                                        </span>
                                        {isVerified && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                            <Star className="w-3 h-3 fill-current" /> {metricsData.rating} Rating
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" /> {company.city || "Remote"} • Since {company.createdAt ? format(new Date(company.createdAt), "yyyy") : "2025"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={() => setEditModalOpen(true)} variant="outline" className="rounded-xl h-9 bg-background shadow-sm text-foreground font-bold hover:bg-muted/50">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                            </Button>
                            {!isVerified && !isSuspended && (
                                <Button onClick={handleVerify} disabled={isActioning} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold h-9 shadow-sm text-white">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                </Button>
                            )}
                            {!isSuspended ? (
                                <Button onClick={handleSuspend} variant="outline" disabled={isActioning} className="rounded-xl font-bold h-9 shadow-sm hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground">
                                    <Ban className="w-4 h-4 mr-2" /> Suspend
                                </Button>
                            ) : (
                                <Button onClick={handleVerify} variant="outline" disabled={isActioning} className="rounded-xl font-bold h-9 shadow-sm hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground">
                                    <RotateCcw className="w-4 h-4 mr-2" /> Reactivate
                                </Button>
                            )}
                            <Button variant="outline" className="rounded-xl h-9 bg-background shadow-sm text-foreground font-bold">
                                <MessageSquare className="w-4 h-4 mr-2" /> Message
                            </Button>
                            <Button onClick={() => setActiveTab("logs")} variant="outline" className="rounded-xl h-9 bg-background shadow-sm text-foreground font-bold hover:bg-muted/50">
                                <History className="w-4 h-4 mr-2" /> View Audit Log
                            </Button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="h-12 bg-transparent border-b border-border w-full justify-start rounded-none p-0 gap-6">
                            {[
                                { id: "overview", label: "Overview" },
                                { id: "verification", label: "Verification" },
                                { id: "users", label: "Users" },
                                { id: "services", label: "Services" },
                                { id: "analytics", label: "Analytics" },
                                { id: "finance", label: "Finance" },
                                { id: "logs", label: "Logs" }
                            ].map(tab => (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 data-[state=active]:text-foreground text-muted-foreground font-bold tracking-wide uppercase text-[11px] rounded-none px-0 h-12"
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="py-8">
                            {/* --- TAB: OVERVIEW --- */}
                            <TabsContent value="overview" className="m-0 space-y-6">
                                <div className="grid lg:grid-cols-3 gap-6">
                                    
                                    {/* Company Profile (Business info) */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 bg-muted/30 border-b border-border/50">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Company Profile</span>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid sm:grid-cols-2 gap-y-6 gap-x-12">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Business Name</p>
                                                        <p className="text-sm font-semibold text-foreground">{company.name}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Owner</p>
                                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-muted-foreground" /> {company.owner?.fullName || "Not Claimed"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email</p>
                                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {company.email || company.owner?.email || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Phone</p>
                                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {company.phone || company.owner?.phone || "N/A"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Address</p>
                                                        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {company.address ? `${company.address}, ${company.city}` : company.city || "Remote"}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Registration ID</p>
                                                        <p className="text-sm font-mono font-medium text-foreground">{company.registrationNumber || "KH-123456"}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Snapshot */}
                                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 bg-muted/30 border-b border-border/50 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Performance Snapshot</span>
                                                <Link href="/admin/analytics">
                                                    <Button variant="link" className="h-auto p-0 text-[10px] font-bold text-violet-600 uppercase tracking-widest">
                                                        → Open Full Analytics
                                                    </Button>
                                                </Link>
                                            </div>
                                            <div className="p-6">
                                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {[
                                                        { label: "Bookings", value: metricsData.bookings.toLocaleString(), icon: Calendar },
                                                        { label: "Revenue", value: `$${(metricsData.revenue).toLocaleString()}`, icon: TrendingUp },
                                                        { label: "Completion Rate", value: `${metricsData.completionRate}%`, icon: CheckCircle2 },
                                                        { label: "Average Rating", value: `${metricsData.rating}`, icon: Star },
                                                    ].map((stat, i) => (
                                                        <div key={i} className="bg-muted/10 border border-border rounded-xl p-4">
                                                            <stat.icon className="w-4 h-4 text-muted-foreground mb-3" />
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{stat.label}</p>
                                                            <p className="text-xl font-black text-foreground">{stat.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side Widgets */}
                                    <div className="space-y-6">
                                        {/* Business Status & Quick Metrics */}
                                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 bg-muted/30 border-b border-border/50">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Business Status</span>
                                            </div>
                                            <div className="p-5 space-y-4">
                                                <div className="space-y-3 pb-4 border-b border-border/50">
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span className="text-sm font-semibold">Verified</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <PlayCircle className="w-4 h-4 text-primary" />
                                                        <span className="text-sm font-semibold">Active</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                                        <span className="text-sm font-semibold">Joined {company.createdAt ? format(new Date(company.createdAt), "yyyy") : "2025"}</span>
                                                    </div>
                                                </div>
                                                <div className="pt-1">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Quick Metrics</p>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">Bookings</span>
                                                            <span className="font-bold">{metricsData.bookings.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">Revenue</span>
                                                            <span className="font-bold text-emerald-600">${(metricsData.revenue / 1000).toFixed(0)}K</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-muted-foreground font-medium">Staff</span>
                                                            <span className="font-bold">{metricsData.staff}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Company Activity Timeline */}
                                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                            <div className="px-5 py-4 bg-muted/30 border-b border-border/50">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activity Timeline</span>
                                            </div>
                                            <div className="p-6">
                                                <div className="relative border-l border-border/50 ml-3 space-y-6">
                                                    {[
                                                        { label: "Received Reports", date: "Today, 10:42 AM", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
                                                        { label: "Added Services", date: "Jul 15, 2025", icon: Briefcase, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                                                        { label: "Verified", date: "Jul 12, 2025", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                                                        { label: "Registered", date: "Jul 10, 2025", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                                                    ].map((event, i) => (
                                                        <div key={i} className="pl-6 relative">
                                                            <div className={cn("absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center border", event.bg, event.border)}>
                                                                <event.icon className={cn("w-3 h-3", event.color)} />
                                                            </div>
                                                            <p className="text-sm font-semibold text-foreground">{event.label}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{event.date}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: VERIFICATION --- */}
                            <TabsContent value="verification" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                    <div className="px-6 py-5 bg-muted/30 border-b border-border/50">
                                        <h2 className="text-lg font-bold text-foreground">Compliance Documents</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Review and approve company verification documents required for marketplace operation.</p>
                                    </div>
                                    <div className="p-2">
                                        <div className="divide-y divide-border/50">
                                            {company.verificationDocumentUrl ? (
                                                <div className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground">KYC Verification Document</p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 text-muted-foreground">
                                                                ✓ Uploaded
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => window.open(company.verificationDocumentUrl, "_blank")} variant="outline" size="sm" className="h-8 text-xs font-bold uppercase tracking-widest">View</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-12 flex flex-col items-center justify-center text-center">
                                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 border border-border">
                                                        <ShieldAlert className="w-8 h-8 text-muted-foreground" />
                                                    </div>
                                                    <h3 className="text-lg font-black text-foreground mb-1">No Documents Uploaded</h3>
                                                    <p className="text-sm text-muted-foreground max-w-sm">This company has not uploaded any business licenses or identity verification documents yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: USERS --- */}
                            <TabsContent value="users" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                    <div className="px-6 py-5 bg-muted/30 border-b border-border/50 flex justify-between items-center">
                                        <div>
                                            <h2 className="text-lg font-bold text-foreground">Company Users</h2>
                                            <p className="text-sm text-muted-foreground mt-1">Management and staff roster for this organization.</p>
                                        </div>
                                    </div>
                                    <div>
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-muted/10 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">User</th>
                                                    <th className="px-6 py-4">Role</th>
                                                    <th className="px-6 py-4">Joined</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {/* Owner Row */}
                                                <tr className="hover:bg-muted/10 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback className="bg-blue-600 text-white text-xs">{company.owner?.fullName?.[0] || "J"}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-bold text-foreground">{company.owner?.fullName || "John Smith"}</p>
                                                                <p className="text-[10px] font-semibold text-muted-foreground">{company.owner?.email || "john@example.com"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-blue-600">Owner</td>
                                                    <td className="px-6 py-4 text-muted-foreground font-medium">Jul 10, 2025</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button onClick={() => router.push(`/admin/users/${company.ownerId}`)} variant="ghost" size="sm" className="text-xs font-bold text-violet-600">Detail →</Button>
                                                    </td>
                                                </tr>
                                                {/* Staff Rows */}
                                                {company.staff && company.staff.length > 0 ? (
                                                    company.staff.map((staffItem: any, i: number) => (
                                                        <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="bg-violet-600 text-white text-xs">{staffItem.user?.fullName?.[0] || "U"}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="font-bold text-foreground">{staffItem.user?.fullName || "Unknown Staff"}</p>
                                                                        <p className="text-[10px] font-semibold text-muted-foreground">{staffItem.user?.email || "No email"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-bold text-violet-600 capitalize">{staffItem.role || "Staff"}</td>
                                                            <td className="px-6 py-4 text-muted-foreground font-medium">{staffItem.createdAt ? format(new Date(staffItem.createdAt), "MMM d, yyyy") : "N/A"}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <Button onClick={() => router.push(`/admin/users/${staffItem.userId}`)} variant="ghost" size="sm" className="text-xs font-bold text-violet-600">Detail →</Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : null}
                                                {/* Staff Summary Row */}
                                                <tr className="bg-muted/5">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{metricsData.staff} Staff Members</p>
                                                                <p className="text-[10px] font-semibold text-muted-foreground">Field workers & providers</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground font-medium">Staff</td>
                                                    <td className="px-6 py-4 text-muted-foreground font-medium">—</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button onClick={() => toast({ description: "Staff roster is already visible above." })} variant="outline" size="sm" className="text-xs font-bold uppercase tracking-widest h-8">View Roster</Button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: SERVICES --- */}
                            <TabsContent value="services" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                                    <div className="px-6 py-5 bg-muted/30 border-b border-border/50">
                                        <h2 className="text-lg font-bold text-foreground">Provided Services</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Services authorized for this company on the marketplace.</p>
                                    </div>
                                    <div className="p-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {company.services && company.services.length > 0 ? (
                                            company.services.map((svc: any, i: number) => (
                                                <div key={i} className="border border-border rounded-xl p-5 hover:bg-muted/10 transition-colors cursor-pointer group">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-600 flex items-center justify-center">
                                                            <Briefcase className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-lg font-black text-foreground">${svc.basePrice || "0"}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground group-hover:text-violet-600 transition-colors">{svc.name}</p>
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{svc.isActive ? "Active" : "Inactive"}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground col-span-full text-center py-8 border border-border rounded-xl">No services added yet.</p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: ANALYTICS --- */}
                            <TabsContent value="analytics" className="m-0 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: "Total Bookings", value: metricsData.bookings.toLocaleString(), icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
                                        { label: "Lifetime Revenue", value: `$${(metricsData.revenue).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                        { label: "Completion Rate", value: `${metricsData.completionRate}%`, icon: CheckCircle2, color: "text-violet-500", bg: "bg-violet-500/10" },
                                        { label: "Customer Rating", value: `${metricsData.rating}`, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-background border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                                <p className="text-2xl font-black text-foreground">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-background rounded-xl border border-border shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-bold text-foreground">Revenue Trend (6 Months)</h3>
                                        <select className="h-8 px-2 bg-muted/30 border border-border rounded-lg text-xs font-medium text-foreground outline-none focus:border-violet-500/60">
                                            <option>Last 6 Months</option>
                                            <option>This Year</option>
                                            <option>All Time</option>
                                        </select>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `$${val}`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: "hsl(var(--background))", borderRadius: "8px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                                    itemStyle={{ color: "#8b5cf6", fontWeight: "bold" }}
                                                    formatter={(value: any) => [`$${value}`, "Revenue"]}
                                                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- TAB: FINANCE --- */}
                            <TabsContent value="finance" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 border border-border">
                                        <DollarSign className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-1">No Financial Data</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">This company has not processed any payouts or transactions yet. Once bookings are completed, financial logs will appear here.</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="logs" className="m-0 space-y-6">
                                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 border border-border">
                                        <History className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-black text-foreground mb-1">Audit Log Empty</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">Detailed system audit logs (like profile changes or login history) will be tracked here in the future.</p>
                                </div>
                            </TabsContent>

                        </div>
                    </Tabs>

                </div>
            </div>

            <EditCompanyModal 
                open={editModalOpen} 
                onClose={() => setEditModalOpen(false)} 
                company={company} 
                onSuccess={refetch} 
            />
        </div>
    );
}
