'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Calendar, Clock, MapPin, User, DollarSign,
    CheckCircle, XCircle, Timer, Loader2, UserPlus, Phone,
    MapIcon, Briefcase, Building2, ShieldCheck, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string; icon: any }> = {
    pending: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20", label: "Pending", icon: Timer },
    confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20", label: "Confirmed", icon: CheckCircle },
    in_progress: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20", label: "In Progress", icon: Clock },
    completed: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20", label: "Completed", icon: ShieldCheck },
    cancelled: { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/20", label: "Cancelled", icon: XCircle },
};



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
    customer: { id: string; fullName: string; email: string; phone: string; avatar?: string };
    service: { id: string; name: string; description: string; basePrice: number };
    assignedStaff: { id: string; fullName: string; role: string } | null;
}

export default function CompanyBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);

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

    const statusInfo = statusConfig[booking.status] ?? { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", label: booking.status, icon: Timer };
    const StatusIcon = statusInfo.icon;

    return (
        <div className="h-full overflow-y-auto p-6 space-y-8 bg-muted/10">
            {/* Breadcrumb & Header */}
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Link href="/company/bookings" className="hover:text-primary transition-colors">Bookings</Link>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground">#{booking.id.slice(-6)}</span>
               </div>
               
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                       <Link href="/company/bookings">
                           <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 border-border shadow-sm hover:bg-muted transition-colors">
                               <ArrowLeft className="w-5 h-5 text-foreground" />
                           </Button>
                       </Link>
                       <div>
                           <div className="flex items-center gap-3">
                              <h1 className="text-3xl font-black text-foreground tracking-tight">
                                  Booking Details
                              </h1>
                              <span className={`px-3 py-1 rounded-full border flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                  <StatusIcon className="w-4 h-4" />
                                  {statusInfo.label}
                              </span>
                           </div>
                       </div>
                   </div>
             </div>
            </div>

            {/* Main Table Container */}
            <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-border/50">
                        {/* Service Group */}
                        <tr className="bg-muted/30">
                            <th colSpan={2} className="px-6 py-4 font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-primary" /> Service Information
                            </th>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4 align-top">Service Type</td>
                            <td className="px-6 py-5 align-top">
                                <div className="font-bold text-base text-foreground">{booking.service.name}</div>
                                <div className="text-muted-foreground text-sm mt-1">{booking.service.description || "No description provided."}</div>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Schedule</td>
                            <td className="px-6 py-5 font-bold text-foreground">
                                {formatDate(booking.bookingDate)} at {formatTime(booking.startTime, booking.endTime)}
                            </td>
                        </tr>

                        {/* Customer Group */}
                        <tr className="bg-muted/30">
                            <th colSpan={2} className="px-6 py-4 font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-500" /> Customer Information
                            </th>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Customer Name</td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8 rounded-lg border border-border/50 shadow-sm">
                                        <AvatarFallback className="rounded-lg font-black bg-emerald-500/10 text-emerald-600">{booking.customer.fullName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-bold text-foreground">{booking.customer.fullName}</span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Contact</td>
                            <td className="px-6 py-5 font-bold text-foreground">
                                <div>{booking.customer.email}</div>
                                {booking.customer.phone && <div className="mt-1 text-muted-foreground">{booking.customer.phone}</div>}
                            </td>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Service Location</td>
                            <td className="px-6 py-5 font-bold text-foreground">
                                {booking.serviceAddress}
                            </td>
                        </tr>

                        {/* Financial Group */}
                        <tr className="bg-muted/30">
                            <th colSpan={2} className="px-6 py-4 font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-amber-500" /> Financials
                            </th>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Price Breakdown</td>
                            <td className="px-6 py-5">
                                <div className="flex items-center justify-between w-full max-w-sm mb-2">
                                    <span className="font-bold text-muted-foreground">Gross Price:</span>
                                    <span className="font-bold text-foreground">${Number(booking.totalPrice ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between w-full max-w-sm mb-4">
                                    <span className="font-bold text-muted-foreground">Platform Fee:</span>
                                    <span className="font-bold text-rose-500">-${Number(booking.platformFee ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between w-full max-w-sm pt-4 border-t border-border/50">
                                    <span className="font-black text-emerald-500 uppercase tracking-widest text-xs">Net Earnings:</span>
                                    <span className="font-black text-foreground text-xl">${Number(booking.companyEarnings ?? 0).toFixed(2)}</span>
                                </div>
                            </td>
                        </tr>

                        {/* Assignment Group */}
                        <tr className="bg-muted/30">
                            <th colSpan={2} className="px-6 py-4 font-black text-foreground uppercase tracking-widest text-xs flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-500" /> Staff Assignment
                            </th>
                        </tr>
                        <tr>
                            <td className="px-6 py-5 font-bold text-muted-foreground w-1/4">Assigned To</td>
                            <td className="px-6 py-5">
                                {booking.assignedStaff ? (
                                    <div className="flex items-center justify-between max-w-sm">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 rounded-lg border border-border/50 shadow-sm">
                                                <AvatarFallback className="bg-indigo-500/10 text-indigo-600 font-black rounded-lg text-sm">
                                                    {booking.assignedStaff.fullName.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-foreground">{booking.assignedStaff.fullName}</p>
                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{booking.assignedStaff.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="font-bold text-muted-foreground">Unassigned</div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>


            </div>
        </div>
    );
}
