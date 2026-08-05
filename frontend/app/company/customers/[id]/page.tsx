"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Phone, Mail, Calendar, MapPin, Search, Plus, TrendingUp, AlertCircle, 
  MessageSquare, Flag, Circle, CheckCircle2, AlertTriangle, User, History, DollarSign
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { useSocket } from "@/lib/hooks/useSocket";
import { formatDistanceToNow } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function CompanyCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;
  const { toast } = useToast();
  const { socket } = useSocket();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState<{ status: string, lastSeen: string | Date | null }>({ status: 'offline', lastSeen: null });

  useEffect(() => {
    if (!customerId) return;
    fetchCustomerDetail();
  }, [customerId]);

  const fetchCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/companies/my-company/customers/${customerId}`);
      const data = res.data.data || res.data;
      setCustomer(data);
      if (data.status === 'online') {
        setOnlineStatus({ status: 'online', lastSeen: new Date() });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to load customer", variant: "destructive" });
      router.push("/company/customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !customerId) return;
    
    // Subscribe to this specific user's status
    socket.emit('subscribe_user_status', { userId: customerId });
    
    const handleStatusChange = (data: { userId: string, status: string, lastSeen: string }) => {
      if (data.userId === customerId) {
        setOnlineStatus({ status: data.status, lastSeen: data.lastSeen });
      }
    };
    
    socket.on('user_status_change', handleStatusChange);
    return () => {
      socket.off('user_status_change', handleStatusChange);
      socket.emit('unsubscribe_user_status', { userId: customerId });
    };
  }, [socket, customerId]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!customer) return null;

  const STATUS_COLORS: Record<string, string> = {
    completed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    pending: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    in_progress: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    cancelled: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  const calculateCompletionRate = () => {
    const total = customer.stats?.totalBookings || 0;
    if (total === 0) return 0;
    const completed = customer.stats?.completedJobs || 0;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* ─── HEADER BAR ────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/company/customers")} className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10 border border-border/50 shadow-sm rounded-xl">
                  {customer.avatar ? <AvatarImage src={customer.avatar} /> : <AvatarFallback className="rounded-xl bg-muted text-foreground font-bold">{customer.fullName?.charAt(0) || "?"}</AvatarFallback>}
                </Avatar>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background",
                  onlineStatus.status === 'online' ? "bg-emerald-500" : "bg-muted-foreground"
                )} />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight flex items-center gap-2">
                  {customer.fullName}
                  {customer.status === 'suspended' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 uppercase tracking-widest border border-rose-500/20">Suspended</span>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="truncate max-w-[200px]">{customer.email}</span>
                  •
                  <span>{customer.phone || 'No phone'}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Simulated", description: "Opening messaging center..." })}>
              <MessageSquare className="w-4 h-4 mr-2" /> Message
            </Button>
            <Button size="sm" onClick={() => toast({ title: "Simulated", description: "Creating new booking for customer..." })}>
              <Plus className="w-4 h-4 mr-2" /> New Booking
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* ─── KPI BANNER ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Lifetime Value (LTV)
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">${Number(customer.stats?.totalSpent || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Total revenue from completed jobs</p>
          </div>
          <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="w-4 h-4" /> Total Bookings
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{customer.stats?.totalBookings || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all statuses</p>
          </div>
          <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Completion Rate
              </span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-foreground">{calculateCompletionRate()}%</p>
              <p className="text-sm font-medium text-muted-foreground mb-1">({customer.stats?.completedJobs} / {customer.stats?.totalBookings})</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ratio of completed vs cancelled jobs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ─── LEFT COLUMN: BOOKING HISTORY ────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Booking History
              </h2>
            </div>
            
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-6 shadow-sm min-h-[400px]">
              {(customer.recentBookings || []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Calendar className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm">No bookings found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(customer.recentBookings || []).map((booking: any) => (
                    <div 
                      key={booking.id} 
                      className="group relative flex gap-4 p-4 rounded-xl border border-border/30 bg-background hover:border-primary/30 transition-colors cursor-pointer shadow-sm"
                      onClick={() => router.push(`/company/bookings/${booking.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-bold text-foreground truncate">
                            {booking.service?.name || 'Custom Service'}
                          </h3>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest",
                            STATUS_COLORS[booking.status] || "text-muted-foreground bg-muted border-border"
                          )}>
                            {booking.status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-muted">
                            {booking.service?.serviceType?.category?.name || 'Category'}
                          </span>
                          • 
                          <Calendar className="w-3.5 h-3.5" /> {new Date(booking.bookingDate).toLocaleDateString()}
                        </p>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 border border-border shadow-sm">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {booking.assignedStaff?.user?.fullName?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-muted-foreground">
                              {booking.assignedStaff?.user?.fullName || 'Unassigned'}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-foreground">${Number(booking.totalPrice).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: INSIGHTS & ACTIONS ────────────────── */}
          <div className="space-y-6">
            
            {/* Disputes Card */}
            {(customer.stats?.activeDisputes || 0) > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4" /> Active Disputes
                </h3>
                <p className="text-xs text-rose-600/80 mb-3">
                  This customer has {customer.stats.activeDisputes} unresolved dispute(s) with your company.
                </p>
                <Button variant="outline" size="sm" className="w-full border-rose-500/20 text-rose-600 hover:bg-rose-500/10">
                  Review Disputes
                </Button>
              </div>
            )}

            {/* Internal Notes */}
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Internal CRM Notes
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-background border border-border/50 rounded-lg shadow-sm">
                  <p className="text-xs text-foreground font-medium mb-1">Prefers weekend mornings</p>
                  <p className="text-[10px] text-muted-foreground">Added by System • 2 months ago</p>
                </div>
                <div className="p-3 bg-background border border-border/50 rounded-lg shadow-sm">
                  <p className="text-xs text-foreground font-medium mb-1">Has a large dog, keep gate closed</p>
                  <p className="text-[10px] text-muted-foreground">Added by Sarah • 3 months ago</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" /> Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-background shadow-sm" onClick={() => toast({ title: "Simulated Action", description: "Sending quote request..." })}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Send Custom Quote
                </Button>
                <Button variant="outline" className="w-full justify-start bg-background shadow-sm" onClick={() => toast({ title: "Simulated Action", description: "Requesting review..." })}>
                  <AlertCircle className="w-4 h-4 mr-2" /> Request Review
                </Button>
                <Button variant="outline" className="w-full justify-start border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 bg-background shadow-sm" onClick={() => toast({ title: "Simulated Action", description: "Reporting customer..." })}>
                  <Flag className="w-4 h-4 mr-2" /> Report Customer
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
