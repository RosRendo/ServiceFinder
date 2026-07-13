'use client'
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    User,
    DollarSign,
    FileText,
    CheckCircle,
    XCircle,
    Timer,
    Loader2,
    UserPlus,
    Phone,
    MapIcon,
    Briefcase,
    Building2,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import api from "@/lib/api/client";

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    pending: { color: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending", icon: Timer },
    confirmed: { color: "bg-blue-50 text-blue-700 border-blue-200", label: "Confirmed", icon: CheckCircle },
    in_progress: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "In Progress", icon: Clock },
    completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Completed", icon: ShieldCheck },
    cancelled: { color: "bg-rose-50 text-rose-700 border-rose-200", label: "Cancelled", icon: XCircle },
};

interface StaffMember {
    id: string;
    fullName: string;
    role: string;
    status: string;
    activeRequests: number;
    activeBookings: number;
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
    customer: { id: string; fullName: string; email: string; phone: string };
    service: { id: string; name: string; description: string; basePrice: number };
    assignedStaff: { id: string; fullName: string; role: string } | null;
}

export default function CompanyBookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;

    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [showAssign, setShowAssign] = useState(false);
    const [loadingStaff, setLoadingStaff] = useState(false);

    const fetchBooking = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get(`/bookings/${id}`);
            const payload = res.data.data || res.data;
            setBooking(payload.booking || payload);
        } catch {
            toast.error("Failed to load booking");
            setTimeout(() => router.push("/company/bookings"), 1500);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
            const res = await api.get(`/companies/my-company/staff`);
            const payload = res.data.data || res.data;
            setStaff(Array.isArray(payload) ? payload : (payload.staff || []));
        } catch {
            toast.error("Failed to load staff");
        } finally {
            setLoadingStaff(false);
        }
    };

    const handleAssign = async () => {
        if (!booking || !selectedStaffId) return;
        setAssigning(true);
        try {
            await api.patch(`/bookings/${booking.id}/assign-staff`, { staffId: selectedStaffId });
            toast.success("Staff assigned successfully!");
            setShowAssign(false);
            fetchBooking();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to assign staff");
        } finally {
            setAssigning(false);
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

    const openInMaps = () => {
        if (booking?.latitude && booking?.longitude) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`, "_blank");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    if (!booking) return null;

    const statusInfo = statusConfig[booking.status] ?? { color: "bg-gray-100 text-gray-600 border-gray-200", label: booking.status, icon: Timer };
    const StatusIcon = statusInfo.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/company/bookings">
                        <Button variant="outline" size="icon" className="rounded-lg h-10 w-10 border-gray-200">
                            <ArrowLeft className="w-4 h-4 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            Booking #{booking.id.slice(0, 8)}
                            <span className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-wider ${statusInfo.color}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {statusInfo.label}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm font-medium">{booking.service.name}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Left, 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Service & Schedule */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" /> Service Details
                        </h3>
                        
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-6">
                            <h4 className="font-bold text-gray-900">{booking.service.name}</h4>
                            <p className="text-gray-600 text-sm mt-1">{booking.service.description || "No description provided."}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Date</p>
                                    <p className="text-sm font-bold text-gray-900">{formatDate(booking.bookingDate)}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-0.5">Time</p>
                                    <p className="text-sm font-bold text-gray-900">{formatTime(booking.startTime, booking.endTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-rose-500" /> Location
                            </h3>
                            {booking.latitude && booking.longitude && (
                                <Button variant="outline" size="sm" className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50" onClick={openInMaps}>
                                    <MapIcon className="w-3.5 h-3.5 mr-1.5" /> Navigate
                                </Button>
                            )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-sm font-medium text-gray-800">{booking.serviceAddress}</p>
                            {!booking.latitude && (
                                <p className="text-xs font-medium text-amber-600 mt-2 flex items-center gap-1">
                                    <XCircle className="w-3.5 h-3.5" /> No exact GPS coordinates provided
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Staff Assignment */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-500" /> Assignment
                            </h3>
                            {!booking.assignedStaff && booking.status !== "completed" && booking.status !== "cancelled" && (
                                <Button size="sm" className="rounded-lg h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign Staff
                                </Button>
                            )}
                        </div>

                        {booking.assignedStaff ? (
                            <div className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4">
                                <Avatar className="w-12 h-12 rounded-lg">
                                    <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold rounded-lg">
                                        {booking.assignedStaff.fullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="font-bold text-gray-900">{booking.assignedStaff.fullName}</p>
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500">{booking.assignedStaff.role}</p>
                                </div>
                                <Button variant="outline" size="sm" className="rounded-lg h-8 text-gray-600" onClick={() => { setShowAssign(!showAssign); fetchStaff(); }}>
                                    Reassign
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 border-dashed text-center">
                                <p className="text-sm font-bold text-gray-700 mb-1">No staff assigned yet</p>
                                <p className="text-xs text-gray-500">Assign a staff member to proceed with the booking.</p>
                            </div>
                        )}

                        {/* Inline assign panel */}
                        {showAssign && (
                            <div className="mt-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-sm text-gray-900 mb-3">Select Staff Member</h4>
                                {loadingStaff ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    </div>
                                ) : staff.length === 0 ? (
                                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500">No active staff found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {staff.filter(s => s.status !== 'inactive').map((s) => (
                                            <label
                                                key={s.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedStaffId === s.id
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-gray-200 bg-white hover:border-blue-200"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="staff"
                                                    value={s.id}
                                                    checked={selectedStaffId === s.id}
                                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Avatar className="w-10 h-10 rounded-md">
                                                    <AvatarFallback className="rounded-md font-bold bg-gray-100 text-gray-700">{s.fullName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-gray-900">{s.fullName}</p>
                                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                                        <span className="text-blue-600 font-semibold">{s.role}</span> · {s.activeRequests} pending · {s.activeBookings} active
                                                    </p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedStaffId === s.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                                                    {selectedStaffId === s.id && <CheckCircle className="w-3 h-3 text-white" />}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" className="flex-1 rounded-lg h-9 text-sm" onClick={() => setShowAssign(false)}>Cancel</Button>
                                    <Button
                                        className="flex-1 rounded-lg h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                        disabled={!selectedStaffId || assigning}
                                        onClick={handleAssign}
                                    >
                                        {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                        {assigning ? "Assigning..." : "Confirm"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar (Right, 1 column) */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-emerald-600" /> Customer
                        </h3>
                        
                        <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-gray-100">
                            <Avatar className="w-16 h-16 border-2 border-gray-100 mb-3">
                                <AvatarFallback className="bg-emerald-50 text-emerald-700 text-lg font-bold">
                                    {booking.customer.fullName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-bold text-gray-900">{booking.customer.fullName}</h3>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{booking.customer.email}</p>
                        </div>

                        {booking.customer.phone && (
                            <Button variant="outline" className="w-full rounded-lg h-9 text-sm text-gray-700 border-gray-200" asChild>
                                <a href={`tel:${booking.customer.phone}`}>
                                    <Phone className="w-3.5 h-3.5 mr-2" /> Call {booking.customer.phone}
                                </a>
                            </Button>
                        )}
                    </div>

                    {/* Financials (Now Light Mode) */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-500" /> Financials
                        </h3>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Total Price</p>
                                <p className="text-sm font-bold text-gray-900">${Number(booking.totalPrice ?? 0).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <p className="text-sm font-medium text-gray-500">Platform Fee</p>
                                <p className="text-sm font-bold text-rose-600">-${Number(booking.platformFee ?? 0).toFixed(2)}</p>
                            </div>
                            <div className="pt-2">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Company Earnings</p>
                                <p className="text-3xl font-black text-gray-900 tracking-tight">${Number(booking.companyEarnings ?? 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
