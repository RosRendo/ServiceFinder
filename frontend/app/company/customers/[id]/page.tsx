"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, Calendar, CheckCircle2,
  Clock, ChevronRight, Plus, Loader2,
  TrendingUp, FileText, MessageCircle,
  ShieldCheck, AlertCircle, DollarSign,
  UserCheck, ExternalLink, ShieldAlert,
  Copy, Check, Wrench, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { useToast } from "@/lib/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";

interface CustomerBooking {
  id: string;
  serviceName?: string | null;
  serviceCategory?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  amount: number | string;
  staffName?: string | null;
  dispute?: {
    id: string;
    status: string;
    reason?: string;
  } | null;
  hasMessages?: boolean;
}

interface CustomerDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  profilePictureUrl?: string | null;
  status: string;
  memberSince?: string;
  stats: {
    totalBookings: number;
    ltv: number;
    activeDisputes: number;
    lastActivity?: string | null;
  };
  bookings: CustomerBooking[];
}

export default function CompanyCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/companies/my-company/customers/${customerId}`);
      const data = res.data?.data || res.data;
      setCustomer(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // Load saved notes from localStorage
  useEffect(() => {
    if (!customerId) return;
    try {
      const saved = localStorage.getItem(`company_customer_notes_${customerId}`);
      if (saved) {
        setNotes(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [customerId]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const updated = [newNote.trim(), ...notes];
    setNotes(updated);
    try {
      localStorage.setItem(`company_customer_notes_${customerId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewNote("");
    toast({
      title: "Note Saved",
      description: "Internal customer note recorded.",
    });
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied",
      description: `${field} copied to clipboard`,
    });
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 p-8 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Loading Customer 360° Profile...
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-background">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-foreground">Customer Not Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          {error || "We couldn't retrieve the requested client record."}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/company/customers")} className="text-xs">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Customers
          </Button>
          <Button size="sm" onClick={fetchCustomer} className="text-xs font-semibold">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const initials = customer.fullName
    ? customer.fullName
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CU";

  const filteredBookings = customer.bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const activeDisputesCount = customer.stats?.activeDisputes || 0;

  return (
    <div className="min-h-full flex flex-col bg-background font-sans p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/company/customers"
            className="flex items-center gap-1 hover:text-foreground font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customers</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-foreground font-bold truncate max-w-[200px]">{customer.fullName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold rounded-xl"
            onClick={() => router.push(`/company/messages?recipientId=${customer.id}`)}
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-primary" />
            Send Message
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs font-bold rounded-xl"
            onClick={() => router.push(`/company/dispatch?customerId=${customer.id}`)}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Dispatch
          </Button>
        </div>
      </div>

      {/* Customer Header Identity Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 rounded-2xl border border-border shrink-0">
              <AvatarImage src={customer.profilePictureUrl || ""} alt={customer.fullName} />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-black text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black text-foreground tracking-tight">{customer.fullName}</h1>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider",
                    customer.status === "active"
                      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                      : "text-muted-foreground bg-muted border-border"
                  )}
                >
                  {customer.status || "Active"}
                </span>
                {activeDisputesCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    {activeDisputesCount} Dispute Active
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                {customer.email && (
                  <button
                    onClick={() => handleCopy(customer.email, "Email")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                  >
                    <Mail className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>{customer.email}</span>
                    {copiedField === "Email" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}

                {customer.phone && (
                  <button
                    onClick={() => handleCopy(customer.phone!, "Phone")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
                  >
                    <Phone className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span>{customer.phone}</span>
                    {copiedField === "Phone" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}

                {customer.memberSince && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Member since {format(new Date(customer.memberSince), "MMM yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Customer ID
            </span>
            <span className="font-mono text-xs text-foreground font-semibold">#{customer.id}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lifetime Value (LTV)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            ${Number(customer.stats?.ltv || 0).toFixed(2)}
          </div>
          <p className="text-[11px] text-muted-foreground">Gross revenue from completed jobs</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Bookings</span>
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {customer.stats?.totalBookings || 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Service orders recorded</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Dispute Health</span>
            <ShieldCheck className={cn("w-4 h-4", activeDisputesCount > 0 ? "text-rose-500" : "text-emerald-500")} />
          </div>
          <div className={cn("text-2xl font-black", activeDisputesCount > 0 ? "text-rose-600" : "text-emerald-600")}>
            {activeDisputesCount === 0 ? "Clean (0)" : `${activeDisputesCount} Active`}
          </div>
          <p className="text-[11px] text-muted-foreground">Arbitration records</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Activity</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-base font-bold text-foreground truncate pt-1">
            {customer.stats?.lastActivity
              ? format(new Date(customer.stats.lastActivity), "MMM d, yyyy")
              : "No recent activity"}
          </div>
          <p className="text-[11px] text-muted-foreground">Most recent service booking</p>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList className="bg-muted/40 p-1 rounded-xl border border-border">
          <TabsTrigger value="bookings" className="rounded-lg text-xs font-bold gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Service History ({customer.bookings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="rounded-lg text-xs font-bold gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Internal Notes ({notes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="rounded-lg text-xs font-bold gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Client Info</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Bookings History */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All Orders" },
                { id: "completed", label: "Completed" },
                { id: "pending", label: "Pending" },
                { id: "in_progress", label: "In Progress" },
                { id: "cancelled", label: "Cancelled" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                    statusFilter === filter.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground">
              Showing {filteredBookings.length} of {customer.bookings.length} jobs
            </span>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-2">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-foreground">No bookings found</p>
              <p className="text-xs text-muted-foreground">
                {statusFilter === "all"
                  ? "This customer has not placed any bookings with your company yet."
                  : `No bookings found matching filter "${statusFilter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">#{b.id}</span>
                      <h4 className="font-bold text-sm text-foreground">{b.serviceName || "Custom Service"}</h4>
                      {b.serviceCategory && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {b.serviceCategory}
                        </span>
                      )}
                      <StatusBadge status={b.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {b.date ? format(new Date(b.date), "MMM d, yyyy") : "Date TBD"}
                      </span>
                      {b.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.startTime} {b.endTime ? `- ${b.endTime}` : ""}
                        </span>
                      )}
                      {b.staffName && (
                        <span className="flex items-center gap-1 text-foreground font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-primary" />
                          Staff: {b.staffName}
                        </span>
                      )}
                    </div>

                    {b.dispute && (
                      <div className="mt-2 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <span className="font-semibold flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          Dispute ({b.dispute.status}): {b.dispute.reason || "Under review"}
                        </span>
                        <Link
                          href={`/company/disputes/${b.dispute.id}`}
                          className="underline font-bold shrink-0 hover:text-rose-700"
                        >
                          View Dispute ↗
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center md:flex-col md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                    <span className="text-base font-black text-foreground font-mono">
                      ${Number(b.amount || 0).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold rounded-xl"
                      onClick={() => router.push(`/company/bookings/${b.id}`)}
                    >
                      <span>Order Desk</span>
                      <ExternalLink className="w-3 h-3 ml-1 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Internal Notes */}
        <TabsContent value="notes" className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Add Private Internal Note
            </h4>
            <p className="text-xs text-muted-foreground">
              Notes are only visible to your company dispatchers and staff (e.g., gate codes, pet instructions, special client requests).
            </p>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type internal note here (e.g. 'Dog is friendly, gate access code #4491')..."
                className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={!newNote.trim()} className="text-xs font-bold rounded-xl">
                  Save Note
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No internal notes recorded for this customer yet.
              </p>
            ) : (
              notes.map((n, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-3.5 text-xs text-foreground flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="flex-1 leading-relaxed">{n}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Client Identity Details */}
        <TabsContent value="profile" className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50 pb-2">
              Registration & Security Telemetry
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Customer ID</span>
                <span className="font-mono text-foreground font-semibold">{customer.id}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Account Status</span>
                <span className="font-semibold text-foreground capitalize">{customer.status}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Email Address</span>
                <span className="font-semibold text-foreground">{customer.email || "Not specified"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Phone Number</span>
                <span className="font-semibold text-foreground">{customer.phone || "Not specified"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Member Since</span>
                <span className="font-semibold text-foreground">
                  {customer.memberSince ? format(new Date(customer.memberSince), "PPP") : "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
