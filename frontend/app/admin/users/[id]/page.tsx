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
  _count?: { bookings: number };
}

interface ActivityData {
  id: string;
  action: string;
  date: string;
  status?: string;
}

const FALLBACK_USER: UserData & { activities: ActivityData[] } = {
  id: "1", fullName: "Sarah Johnson", email: "sarah@example.com",
  phone: "+1 234 567 8901", address: "123 Main St, New York, NY 10001",
  role: "customer", status: "active", createdAt: "2025-12-15",
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
      setLoading(true); setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`);
        if (!response.ok) throw new Error("User not found");
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) setUser({ ...user, status: newStatus });
    } catch (err) { console.error(err); }
  };

  const displayUser = user || FALLBACK_USER;

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
    </div>
  );

  if (error && !user) return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="bg-rose-500/10 border border-rose-500/20 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-rose-500 font-bold text-lg">{error}</p>
        <Button variant="outline" className="rounded-lg" onClick={() => router.push("/admin/users")}>Back to Users</Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.push("/admin/users")} className="rounded-lg h-9 w-9 border-border shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">User Profile</h1>
            <p className="text-sm font-medium text-muted-foreground">Manage account & activity</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pl-12 sm:pl-0">
          <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => router.push(`/admin/messages?new=${displayUser.id}`)}>
            <MessageSquare className="w-4 h-4 mr-2" /> Message
          </Button>
          <Button variant="outline" size="sm"
            className={`rounded-lg ${displayUser.status === "active" ? "border-rose-500/30 text-rose-600 hover:bg-rose-500/10" : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"}`}
            onClick={() => handleStatusChange(displayUser.status === "active" ? "suspended" : "active")}
          >
            {displayUser.status === "active"
              ? <><XCircle className="w-4 h-4 mr-2" /> Suspend</>
              : <><CheckCircle className="w-4 h-4 mr-2" /> Activate</>
            }
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Profile Card */}
        <div className="lg:col-span-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-background border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            <div className="relative pt-0 pb-6 px-6 flex flex-col items-center text-center mt-[-3rem]">
              <Avatar className="h-24 w-24 rounded-2xl shadow-lg border-4 border-background shrink-0 mb-4">
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-3xl font-black">
                  {displayUser.fullName?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">{displayUser.fullName}</h3>
              <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2.5 py-1 rounded-lg mb-4">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wider">{displayUser.role.replace("_", " ")}</span>
              </div>
              <StatusBadge status={(displayUser.status === "active" ? "active" : "suspended") as any} />
            </div>

            <div className="p-6 pt-0 space-y-2">
              <div className="h-px w-full bg-border mb-4" />
              {[
                { icon: Mail, value: displayUser.email },
                { icon: Phone, value: displayUser.phone },
                { icon: MapPin, value: displayUser.address },
                { icon: Calendar, value: `Joined ${new Date(displayUser.createdAt).toLocaleDateString()}` },
              ].filter(i => i.value).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3 border border-border/50">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground text-sm truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Stats & Activity */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="bg-background border border-border rounded-xl p-6 shadow-sm"
            >
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Total Bookings
              </p>
              <p className="text-4xl font-bold text-foreground tracking-tight leading-none">{displayUser._count?.bookings || 0}</p>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-background border border-border rounded-xl p-6 shadow-sm"
          >
            <div className="mb-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Recent Activity
              </h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">Latest actions performed by this user</p>
            </div>
            <div className="space-y-3">
              {activities.length > 0 ? activities.map((activity) => (
                <div key={activity.id} className="bg-muted/30 rounded-lg p-4 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground text-sm">{activity.action}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{activity.date}</p>
                  </div>
                  {activity.status && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                      activity.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                      activity.status === "Pending" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                      "bg-muted text-muted-foreground border border-border"
                    }`}>
                      {activity.status}
                    </span>
                  )}
                </div>
              )) : (
                <div className="flex items-center justify-center py-10 text-center bg-muted/20 rounded-lg border border-dashed border-border">
                  <p className="text-muted-foreground font-medium text-sm">No recent activity found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
