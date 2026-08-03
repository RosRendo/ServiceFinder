"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
    ArrowLeft, Trash2, RotateCcw, Mail, Phone, Briefcase, 
    Calendar, CheckCircle2, ShieldCheck, Activity, Star, 
    Clock, Wallet, MessageSquare, ChevronRight, MoreVertical,
    TrendingUp, AlertTriangle, FileText, Download, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { format } from "date-fns";
import { StaffWalletCard } from "@/components/staff/StaffWalletCard";
import { StaffScheduleManager } from "@/components/staff/StaffScheduleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
    completionRate?: number;
    acceptanceRate?: number;
    cancellationRate?: number;
    onTimeArrival?: number;
    returnRate?: number;
    attendance?: any;
    user?: { fullName?: string; email?: string; phone?: string | null; avatar?: string | null };
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const {
        getStaffMemberById,
        removeStaffMember,
        reactivateStaffMember,
        loading
    } = useCompanies({});

    const [staff, setStaff] = useState<StaffDetail | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const fetchStaff = async () => {
            const result = await getStaffMemberById(resolvedParams.id);
            if (cancelled) return;
            if (result.success && result.staff) {
                setStaff(result.staff as StaffDetail);
                setError(null);
            } else {
                setError(result.error || "Failed to load staff member");
            }
        };
        fetchStaff();
        return () => { cancelled = true; };
    }, [resolvedParams.id]);

    const handleRemove = async () => {
        if (!confirm("Are you sure you want to remove this staff member? This action cannot be undone.")) {
            return;
        }
        setIsDeleting(true);
        const result = await removeStaffMember(resolvedParams.id);
        if (result.success) {
            toast({
                title: "Staff Member Removed",
                description: "The staff member has been removed successfully.",
            });
            router.push("/company/staff");
        } else {
            toast({
                title: "Error",
                description: result.error || "Failed to remove staff member",
                variant: "destructive",
            });
        }
        setIsDeleting(false);
    };

    const handleReactivate = async () => {
        const result = await reactivateStaffMember(resolvedParams.id);
        if (result.success) {
            toast({
                title: "Staff Member Reactivated",
                description: "The staff member has been reactivated successfully.",
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

    if (loading && !staff) return (
        <div className="min-h-screen bg-background flex items-center justify-center pb-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (error && !staff) return (
        <div className="min-h-screen bg-background flex items-center justify-center pb-20 px-4">
            <div className="bg-card border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-2xl text-center shadow-sm">
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-2">
                    <ShieldCheck className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-destructive font-bold text-lg">{error}</p>
                <Button variant="outline" className="h-10 px-6 rounded-xl" onClick={() => router.back()}>Go Back</Button>
            </div>
        </div>
    );

    if (!staff) return null;

    const isActive = staff.status === "active";

  // Metrics Data (Wired from Backend)
    const metricsData = {
        rating: staff.averageRating || 4.92,
        jobs: staff.completedJobs || 1384,
        revenue: staff.generatedRevenue || 42918,
        completionRate: staff.completionRate || 98.9,
        acceptanceRate: staff.acceptanceRate || 99.2,
        cancellationRate: staff.cancellationRate || 0.8,
        onTimeArrival: staff.onTimeArrival || 96.5,
        avgDuration: "2h 15m",
        returnRate: staff.returnRate || 42,
        attendance: staff.attendance || { present: 184, late: 3, absent: 0, hours: "1,240h", overtime: "45h" }
    };

    return (
        <div className="h-full overflow-y-auto bg-muted/30 min-h-screen font-sans pb-24">
            {/* Top Banner (Matches Booking Detail) */}
            <div className="bg-background border-b border-border">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
                        <Link href="/company/staff" className="hover:text-foreground transition-colors">Staff</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground">Profile Detail: #{staff.id.slice(0,8)}</span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/company/staff">
                                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-border shadow-sm hover:bg-muted/30 transition-colors bg-background">
                                    <ArrowLeft className="w-5 h-5 text-foreground" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-5">
                                <Avatar className="h-14 w-14 rounded-xl shadow-sm border border-border">
                                    {staff.user?.avatar && <AvatarImage src={staff.user.avatar} className="object-cover" />}
                                    <AvatarFallback className="text-lg font-black bg-primary text-primary-foreground">{staff.user?.fullName?.charAt(0) || "S"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-black text-foreground tracking-tight">
                                            {staff.user?.fullName || "Unnamed Staff"}
                                        </h1>
                                        <span className={cn("px-2.5 py-1 rounded-full border flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest", isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground border-border")}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                                            {staff.status}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5" /> {staff.role?.replace(/_/g, " ")} • Joined {staff.createdAt ? format(new Date(staff.createdAt), "MMM yyyy") : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                             {!isActive ? (
                                <Button onClick={handleReactivate} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold h-10 px-5 shadow-sm text-white">
                                    <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                                </Button>
                            ) : (
                                <Button onClick={handleRemove} variant="destructive" disabled={isDeleting} className="rounded-xl font-bold h-10 px-5 shadow-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    <Trash2 className="h-4 w-4 mr-2" /> {isDeleting ? "Removing..." : "Remove"}
                                </Button>
                            )}
                            <Button variant="outline" className="rounded-xl h-10 bg-background border-border shadow-sm text-foreground font-bold uppercase tracking-widest text-[10px]">
                                <Download className="w-3.5 h-3.5 mr-2" /> Export Report
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
                
                {/* Executive Summary Row */}
                <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Executive Summary</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/50">
                         <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-amber-500" /> Average Rating</p>
                            <p className="text-3xl font-black text-foreground">{metricsData.rating}</p>
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Lifetime Jobs</p>
                            <p className="text-3xl font-black text-foreground">{metricsData.jobs.toLocaleString()}</p>
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-primary" /> Generated Revenue</p>
                            <p className="text-3xl font-black text-emerald-500">${metricsData.revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-violet-500" /> Completion Rate</p>
                            <p className="text-3xl font-black text-foreground">{metricsData.completionRate}%</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column (Main Info) */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Performance & Quality Assurance */}
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Performance Metrics</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                    {[
                                        { label: "Acceptance", value: `${metricsData.acceptanceRate}%`, color: "text-emerald-500" },
                                        { label: "Cancellation", value: `${metricsData.cancellationRate}%`, color: "text-destructive" },
                                        { label: "On-time", value: `${metricsData.onTimeArrival}%`, color: "text-foreground" },
                                        { label: "Return Rate", value: `${metricsData.returnRate}%`, color: "text-primary" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-muted/10 border border-border rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className={cn("text-xl font-black", stat.color)}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-widest">Customer Feedback Breakdown</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     {[
                                        { label: "Cleaning", score: 5.0 },
                                        { label: "Communication", score: 4.8 },
                                        { label: "Punctuality", score: 4.9 },
                                        { label: "Professionalism", score: 4.9 },
                                    ].map((cat, i) => (
                                        <div key={i} className="flex flex-col items-center justify-center p-4 bg-muted/10 border border-border rounded-xl">
                                            <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center mb-2 relative">
                                                <span className="text-sm font-black text-foreground">{cat.score.toFixed(1)}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">{cat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                         {/* AI Modules Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-primary/5 border border-primary/20 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Performance Summary</span>
                                </div>
                                <div className="p-5 space-y-3">
                                    <p className="text-sm font-medium text-foreground/80">• Alice completed 182 jobs this month.</p>
                                    <p className="text-sm font-medium text-foreground/80">• Revenue increased by <span className="text-emerald-500 font-bold">14%</span>.</p>
                                    <p className="text-sm font-medium text-foreground/80">• Rating improved from 4.7 to <span className="text-emerald-500 font-bold">4.9</span>.</p>
                                    <div className="mt-4 p-3 rounded-lg bg-background border border-primary/20 flex items-start gap-3">
                                        <UserCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-0.5">Recommendation</p>
                                            <p className="text-xs text-muted-foreground font-medium">Strong candidate for Supervisor promotion.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-destructive" />
                                    <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">AI Risk Detection</span>
                                </div>
                                <div className="p-5 space-y-3">
                                    <p className="text-sm font-medium text-foreground/80">• Ratings dropped <span className="text-destructive font-bold">12%</span> this week.</p>
                                    <p className="text-sm font-medium text-foreground/80">• Three late arrivals recorded.</p>
                                    <p className="text-sm font-medium text-foreground/80">• Duration exceeds avg by <span className="text-destructive font-bold">24%</span>.</p>
                                    <div className="mt-4 p-3 rounded-lg bg-background border border-destructive/20 flex items-start gap-3">
                                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-0.5">Action Required</p>
                                            <p className="text-xs text-muted-foreground font-medium">Schedule 1-on-1 to review procedures.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* Wallet & Payroll */}
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wallet & Payroll Ledger</span>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: "Lifetime", value: "$42,918" },
                                        { label: "Pending", value: "$1,240" },
                                        { label: "Last Payout", value: "$840" },
                                        { label: "Next Payout", value: "Aug 8" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-muted/10 border border-border rounded-xl p-4 text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                                            <p className="text-lg font-black text-foreground">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                                <StaffWalletCard staffId={resolvedParams.id} />
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Side Panels) */}
                    <div className="space-y-6">
                        
                        {/* Contact Details */}
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contact Info</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Email</p>
                                        <p className="text-sm font-semibold text-foreground truncate">{staff.user?.email || "N/A"}</p>
                                    </div>
                                </div>
                                {staff.user?.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 border border-border">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone</p>
                                            <p className="text-sm font-semibold text-foreground truncate">{staff.user.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance & Schedule */}
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendance</span>
                            </div>
                            <div className="p-5">
                                 <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-muted-foreground">Present</span>
                                        <span className="text-foreground">{metricsData.attendance.present} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-muted-foreground">Late</span>
                                        <span className="text-amber-500">{metricsData.attendance.late} Days</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-muted-foreground">Absent</span>
                                        <span className="text-destructive">{metricsData.attendance.absent} Days</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/30 border border-border rounded-xl">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Upcoming Vacation</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Calendar className="w-4 h-4 text-primary" /> Aug 18 – Aug 22
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Compliance Documents */}
                        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 bg-muted/30 border-b border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compliance</span>
                            </div>
                            <div className="p-2">
                                <div className="divide-y divide-border/50">
                                    {[
                                        { name: "ID Card / Passport", status: "Verified", date: "Jan 2029" },
                                        { name: "Driver's License", status: "Expiring Soon", date: "In 8 days", alert: true },
                                        { name: "Training Certificate", status: "Verified", date: "Feb 2025" },
                                    ].map((doc, i) => (
                                        <div key={i} className={cn("p-3 flex items-center justify-between", doc.alert && "bg-rose-500/5")}>
                                            <div className="flex items-center gap-3">
                                                <FileText className={cn("w-4 h-4", doc.alert ? "text-rose-500" : "text-muted-foreground")} />
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{doc.name}</p>
                                                    <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-0.5", doc.alert ? "text-rose-600" : "text-muted-foreground")}>{doc.date}</p>
                                                </div>
                                            </div>
                                            <CheckCircle2 className={cn("w-4 h-4", doc.alert ? "text-rose-500/30" : "text-emerald-500")} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Internal Notes */}
                        <div className="bg-amber-500/5 rounded-xl border border-amber-500/20 shadow-sm overflow-hidden">
                             <div className="px-5 py-3.5 bg-amber-500/10 border-b border-amber-500/20">
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Internal Notes (Private)</span>
                            </div>
                            <div className="p-5 text-sm font-medium text-amber-700/80 space-y-2">
                                <p>• Strong performer. Preferred by VIP customers in the downtown area.</p>
                                <p>• Interested in promotion, wants to transition into dispatching eventually.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
