"use client"
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Activity, Loader2, AlertCircle, CheckCircle, Shield, XCircle, MessageSquare } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  status: string;
  createdAt: string;
  avatar?: string;
  _count?: {
    bookings: number;
  };
}

interface ActivityData {
  id: string;
  action: string;
  date: string;
  status?: string;
}

const FALLBACK_USER: UserData & { activities: ActivityData[] } = {
  id: "1",
  fullName: "Sarah Johnson",
  email: "sarah@example.com",
  phone: "+1 234 567 8901",
  address: "123 Main St, New York, NY 10001",
  role: "customer",
  status: "active",
  createdAt: "2025-12-15",
  activities: [
    { id: "1", action: "Booked Deep Cleaning", date: "Dec 28, 2025", status: "Completed" },
    { id: "2", action: "Updated profile", date: "Dec 25, 2025" },
    { id: "3", action: "Booked Regular Cleaning", date: "Dec 20, 2025", status: "Completed" },
    { id: "4", action: "Left a review (5 stars)", date: "Dec 18, 2025" },
  ]
};

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
        
        if (!response.ok) {
          throw new Error("User not found");
        }
        
        const data = await response.json();
        
        const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/user/${id}?limit=5`);
        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : { data: [] };
        
        const activitiesData = (bookingsData.data || []).map((booking: any) => ({
          id: booking.id,
          action: `Booked ${booking.service?.name || "a service"}`,
          date: new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: booking.status
        }));
        
        setUser(data.data?.user || data.data || data);
        setActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user details");
        setUser(FALLBACK_USER as any);
        setActivities(FALLBACK_USER.activities);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setUser({ ...user, status: newStatus });
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const displayUser = user || FALLBACK_USER;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error && !user) return (
    <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="bg-white/60 backdrop-blur-xl border border-rose-200/50 bg-rose-50/50 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-3xl text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-bold text-lg">{error}</p>
            <Button variant="outline" className="border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl px-8 h-11 font-semibold" onClick={() => router.push("/admin/users")}>Back to Users</Button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push("/admin/users")} className="rounded-xl h-10 w-10 hover:bg-slate-50 shrink-0 border-gray-200">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight line-clamp-1">User Profile</h1>
                    <p className="text-sm font-medium text-gray-500">Manage account & activity</p>
                </div>
            </div>
            <div className="flex items-center gap-3 pl-14 sm:pl-0">
                <Button
                  variant="outline"
                  className="rounded-xl h-10 shadow-sm w-full sm:w-auto border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => router.push(`/admin/messages?new=${displayUser.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" /> Message
                </Button>
                <Button
                  variant="outline"
                  className={`rounded-xl h-10 shadow-sm w-full sm:w-auto ${
                    displayUser.status === "active" 
                      ? "border-rose-200 text-rose-600 hover:bg-rose-50" 
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleStatusChange(displayUser.status === "active" ? "suspended" : "active")}
                >
                  {displayUser.status === "active" ? (
                    <><XCircle className="w-4 h-4 mr-2" /> Suspend User</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Activate User</>
                  )}
                </Button>
            </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl overflow-hidden shadow-sm relative">
                {/* Cover Image / Gradient Header */}
                <div className="h-28 bg-gradient-to-br from-indigo-500/30 via-indigo-500/10 to-indigo-500/5 w-full relative">
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center mt-[-4rem]">
                  <Avatar className="h-28 w-28 rounded-3xl shadow-lg border-4 border-white shrink-0 mb-4 bg-white">
                      <AvatarFallback className="rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-700 text-4xl font-black">
                         {displayUser.fullName?.split(" ").map((n) => n[0]).join("") || "U"}
                      </AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1">
                      {displayUser.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg mb-4">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">{displayUser.role.replace("_", " ")}</span>
                  </div>

                  <div className="flex gap-2 w-full justify-center">
                      <StatusBadge status={(displayUser.status === "active" ? "active" : "suspended") as any} />
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-3">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-5" />
                  
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                          <Mail className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-slate-700 text-sm truncate">{displayUser.email}</span>
                  </div>
                  
                  {displayUser.phone && (
                      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="font-medium text-slate-700 text-sm">{displayUser.phone}</span>
                      </div>
                  )}
                  
                  {displayUser.address && (
                      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                              <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="font-medium text-slate-700 text-sm">{displayUser.address}</span>
                      </div>
                  )}
                  
                  <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">Joined {new Date(displayUser.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
            </motion.div>
          </div>

          {/* Right Column: Stats & Activity */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-slate-900 rounded-3xl p-6 shadow-lg relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/20 blur-[30px] rounded-full" />
                  <div className="relative z-10">
                      <p className="text-[10px] font-black text-gray-500 font-medium mb-2 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Total Bookings
                      </p>
                      <p className="text-4xl font-black text-white leading-none">{displayUser._count?.bookings || 0}</p>
                  </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> Recent Activity
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mt-1">Latest actions performed by this user</p>
                </div>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{activity.action}</p>
                          <p className="text-[10px] font-bold text-gray-500 font-medium mt-1">{activity.date}</p>
                        </div>
                        {activity.status && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                            activity.status === "Completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            activity.status === "Pending" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {activity.status}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center w-full bg-gray-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-gray-500 font-medium text-sm">No recent activity found</p>
                    </div>
                  )}
                </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
