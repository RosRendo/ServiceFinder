"use client"

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, RotateCcw, Mail, Phone, Briefcase, Calendar, CheckCircle2, ShieldCheck, Activity, Star, Clock, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import { useCompanies } from "@/lib/hooks/useCompanies";
import { format, formatDistanceToNow } from "date-fns";
import { StaffWalletCard } from "@/components/staff/StaffWalletCard";
import { StaffScheduleManager } from "@/components/staff/StaffScheduleManager";

interface StaffDetail {
    id: string;
    userId: string;
    role: string;
    status: string;
    createdAt?: string;
    activeRequests?: number;
    completedJobs?: number;
    averageRating?: number | null;
    user?: { fullName?: string; email?: string; phone?: string | null; avatar?: string | null };
    recentBookings?: {
        id: string;
        serviceName: string;
        customerName: string;
        status: string;
        date: string;
    }[];
    recentReviews?: {
        id: string;
        rating: number;
        comment?: string | null;
        customerName: string;
        customerAvatar?: string | null;
        date: string;
    }[];
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
        <div className="min-h-screen flex items-center justify-center pb-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );
    
    if (error && !staff) return (
        <div className="min-h-screen flex items-center justify-center pb-20 px-4">
            <div className="bg-white border border-gray-200 p-6 flex flex-col items-center gap-4 max-w-md w-full rounded-lg text-center shadow-sm">
                <p className="text-rose-600 font-medium text-lg">{error}</p>
                <Button variant="outline" className="border-gray-200 text-gray-700 bg-white hover:bg-gray-50 rounded-md px-6" onClick={() => router.back()}>Go Back</Button>
            </div>
        </div>
    );
    
    if (!staff) return null;

    const isActive = staff.status === "active";

    return (
        <div className="min-h-screen pb-24">
            <main className="max-w-5xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl h-10 w-10 hover:bg-slate-50 shrink-0 border-gray-200">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight line-clamp-1">{staff.user?.fullName || "Staff Member"}</h1>
                            <p className="text-sm font-medium text-gray-500">Staff Profile</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pl-14 sm:pl-0">
                        {!isActive ? (
                            <Button onClick={handleReactivate} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-10">
                                <RotateCcw className="h-4 w-4 mr-2" /> Reactivate
                            </Button>
                        ) : (
                            <Button onClick={handleRemove} variant="destructive" disabled={isDeleting} className="rounded-xl w-full sm:w-auto h-10">
                                <Trash2 className="h-4 w-4 mr-2" /> {isDeleting ? "Removing..." : "Remove Staff"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Info Card */}
                    <div className="lg:col-span-8 space-y-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm overflow-hidden relative">
                            
                            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2 relative z-10">
                                <Briefcase className="w-4 h-4 text-primary" /> Profile Information
                            </h2>

                            <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-full shadow-sm border border-gray-100 shrink-0">
                                    {staff.user?.avatar && <AvatarImage src={staff.user.avatar} alt={staff.user.fullName || "Avatar"} className="object-cover" />}
                                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                                        {staff.user?.fullName?.charAt(0) || "S"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3 mb-1">
                                            <h1 className="text-xl font-semibold text-gray-900">{staff.user?.fullName}</h1>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${
                                                isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                                {staff.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">{staff.role || "Staff Member"}</p>
                                    </div>

                                    <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                <Mail className="h-3.5 w-3.5 text-gray-500" />
                                            </div>
                                            <span className="font-medium text-gray-700 truncate">{staff.user?.email || "No email provided"}</span>
                                        </div>
                                        {staff.user?.phone && (
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                    <Phone className="h-3.5 w-3.5 text-gray-500" />
                                                </div>
                                                <span className="font-medium text-gray-700">{staff.user.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                            </div>
                                            <span className="font-medium text-gray-700">Joined {staff.createdAt ? format(new Date(staff.createdAt), "MMMM d, yyyy") : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* System Identifiers */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                            <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-gray-400" /> System Identifiers
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">User ID</p>
                                    <p className="text-sm font-medium text-gray-700 font-mono break-all">{staff.userId}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <p className="text-xs font-medium text-gray-500 mb-1">Staff Record ID</p>
                                    <p className="text-sm font-medium text-gray-700 font-mono break-all">{staff.id}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Staff Wallet & Commissions */}
                        <StaffWalletCard staffId={staff.id} />

                        {/* Recent Reviews */}
                        {staff.recentReviews && staff.recentReviews.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                                <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" /> Recent Reviews
                                </h2>
                                <div className="space-y-4">
                                    {staff.recentReviews.map((review, i) => (
                                        <div key={review.id} className={`${i !== 0 ? 'border-t border-gray-100 pt-4' : ''}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 rounded-full">
                                                        {review.customerAvatar && <AvatarImage src={review.customerAvatar} alt={review.customerName} />}
                                                        <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">{review.customerName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(review.date), { addSuffix: true })}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                                ))}
                                            </div>
                                            {review.comment && <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">"{review.comment}"</p>}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Staff Schedule Manager */}
                        <StaffScheduleManager staffId={staff.id} />
                    </div>

                    {/* Sidebar Stats & Recent Activity */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-32">
                                <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center mb-2">
                                    <Activity className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{staff.activeRequests || 0}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">Active Jobs</p>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-32">
                                <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center mb-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-gray-900">{staff.completedJobs || 0}</p>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">Completed</p>
                                </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-32 col-span-2">
                                <div className="flex items-start justify-between">
                                    <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center mb-2">
                                        <Star className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="flex -space-x-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center z-10 text-[8px] font-bold text-amber-700">5</div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-2xl font-semibold text-gray-900">{staff.averageRating ? staff.averageRating.toFixed(1) : "N/A"}</p>
                                        <p className="text-xs text-amber-500 font-medium">{staff.recentReviews?.length || 0} reviews</p>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 mt-0.5">Average Rating</p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Recent Jobs Timeline */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Recent Jobs
                                </h2>
                                <Link href={`/company/bookings?staffId=${staff.id}`}>
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/5 text-xs h-7 px-2">View All</Button>
                                </Link>
                            </div>
                            
                            {staff.recentBookings && staff.recentBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {staff.recentBookings.map((booking) => (
                                        <Link key={booking.id} href={`/company/bookings/${booking.id}`} className="block group">
                                            <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${booking.status === 'completed' ? 'bg-emerald-500' : booking.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">{booking.serviceName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{booking.customerName} • {format(new Date(booking.date), "MMM d")}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">No recent jobs</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>

            </main>
        </div>
    );
}
