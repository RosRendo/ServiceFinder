
"use client";

import { use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, Star, 
  ChevronRight, TrendingUp, FileText, UserCheck, Activity,
  Building2, MapPin, Globe, User, ShieldAlert,
  Ban, Clock, Calendar, Briefcase, Users, Edit2, DollarSign, Receipt,
  RotateCcw, Mail, Phone, ExternalLink, Percent, ArrowUpRight
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
import { StatusPill } from "@/components/admin/StatusPill";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function getFullLogoUrl(src?: string, name?: string) {
  if (!src) {
    return name ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}` : undefined;
  }
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  const slash = src.startsWith("/") ? "" : "/";
  return `${backendUrl}${slash}${src}`;
}

export default function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [isActioning, setIsActioning] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const { data: company, loading, error, refetch } = useAPI<any>(`/api/admin/companies/${resolvedParams.id}`);

  const handleVerify = () => setVerifyDialogOpen(true);
  const confirmVerify = async () => {
    setIsActioning(true);
    try {
      await api.post(`/admin/companies/${resolvedParams.id}/verify`);
      toast({ title: "Company Approved", description: "The merchant account has been verified." });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to verify company.", variant: "destructive" });
    } finally {
      setIsActioning(false);
      setVerifyDialogOpen(false);
    }
  };

  const handleSuspend = () => setSuspendDialogOpen(true);
  const confirmSuspend = async () => {
    setIsActioning(true);
    try {
      await api.patch(`/admin/companies/${resolvedParams.id}/status`, { status: "suspended" });
      toast({ title: "Company Suspended", description: "Company operations frozen.", variant: "destructive" });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to suspend company.", variant: "destructive" });
    } finally {
      setIsActioning(false);
      setSuspendDialogOpen(false);
    }
  };

  const realBookings = useMemo(() => company?.bookings || [], [company]);
  const totalRevenue = useMemo(() => {
    return realBookings.reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);
  }, [realBookings]);

  const platformRate = Number(company?.platformFeePercent || 15);
  const totalPlatformFees = totalRevenue * (platformRate / 100);

  const metricsData = useMemo(() => ({
    bookings: realBookings.length,
    revenue: totalRevenue,
    platformFees: totalPlatformFees,
    staff: company?.staff?.length || 0,
    rating: Number(company?.rating || 5.0).toFixed(1),
    completionRate: company?.completionRate ? Number(company.completionRate) : 100,
  }), [realBookings, totalRevenue, totalPlatformFees, company]);

  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthLabel = format(d, "MMM");
      const monthBookings = realBookings.filter((b: any) => {
        if (!b.createdAt) return false;
        const bDate = new Date(b.createdAt);
        return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
      });
      const revenue = monthBookings.reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);
      return { month: monthLabel, revenue };
    });
  }, [realBookings]);

  if (loading && !company) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Loading Merchant Dossier...
        </p>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="h-full flex items-center justify-center px-4 bg-background">
        <div className="bg-card border border-border p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-2xl text-center shadow-xs">
          <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-1 border border-destructive/20">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="text-base font-bold text-foreground">Failed to Load Company</h2>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" className="h-9 px-5 rounded-xl text-xs" onClick={() => router.push("/admin/companies")}>
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Return to Companies
          </Button>
        </div>
      </div>
    );
  }

  if (!company) return null;

  const isVerified = company.verificationStatus === "verified" || company.verificationStatus === "active";
  const isSuspended = company.verificationStatus === "suspended";

  return (
    <div className="h-full overflow-y-auto bg-background font-sans pb-24 custom-scrollbar">
      {/* ─── 1. Header Bar ────────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-5 pb-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
            <Link href="/admin/companies" className="hover:text-foreground transition-colors">
              Companies
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground">Merchant 360° Management</span>
          </div>

          {/* Profile Identity & Action Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5">
            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/admin/companies")}
                className="rounded-xl h-10 w-10 border-border shrink-0 mt-0.5 hover:bg-muted"
                title="Back to Companies"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl shadow-xs border border-border bg-primary/10 text-primary shrink-0">
                  <AvatarImage src={getFullLogoUrl(company.logoUrl, company.name)} className="object-cover" />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {company.name?.[0] || <Building2 className="w-6 h-6" />}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                      {company.name}
                    </h1>
                    <StatusPill status={isSuspended ? "suspended" : (company.verificationStatus || "active")} />
                    {isVerified && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Star className="w-3 h-3 fill-current" /> {metricsData.rating}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                      <Percent className="w-3 h-3" /> {platformRate}% Split
                    </span>
                  </div>

                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{company.city || "Phnom Penh, Cambodia"}</span>
                    <span>•</span>
                    <span>Member since {company.createdAt ? format(new Date(company.createdAt), "yyyy") : "2025"}</span>
                    {company.owner && (
                      <>
                        <span>•</span>
                        <span>Owner: <strong className="text-foreground">{company.owner.fullName}</strong></span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: High-intent, non-duplicated */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                onClick={() => setEditModalOpen(true)}
                variant="outline"
                className="rounded-xl h-9 text-xs font-semibold border-border gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Profile
              </Button>

              {!isVerified && !isSuspended && (
                <Button
                  onClick={handleVerify}
                  disabled={isActioning}
                  className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Merchant
                </Button>
              )}

              {!isSuspended ? (
                <Button
                  onClick={handleSuspend}
                  variant="outline"
                  disabled={isActioning}
                  className="rounded-xl h-9 text-xs font-semibold border-rose-500/30 text-rose-600 hover:bg-rose-500/10 gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" /> Suspend
                </Button>
              ) : (
                <Button
                  onClick={handleVerify}
                  variant="outline"
                  disabled={isActioning}
                  className="rounded-xl h-9 text-xs font-semibold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                </Button>
              )}

              {company.ownerId && (
                <Button
                  onClick={() => router.push(`/admin/users/${company.ownerId}`)}
                  variant="ghost"
                  className="rounded-xl h-9 text-xs font-semibold text-primary hover:bg-primary/10 gap-1.5"
                >
                  Owner Account <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* ─── 2. Top 4-Metric Instant KPI Strip ───────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-4 border-t border-border/60">
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Lifetime GMV
              </p>
              <p className="text-xl font-bold font-mono text-foreground">
                ${metricsData.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                From {metricsData.bookings} completed bookings
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Platform Revenue
              </p>
              <p className="text-xl font-bold font-mono text-emerald-600">
                ${metricsData.platformFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                {platformRate}% commission rate
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Active Roster
              </p>
              <p className="text-xl font-bold font-mono text-foreground">
                {metricsData.staff}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                Field technicians & staff
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl p-3.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> Quality & Fulfillment
              </p>
              <p className="text-xl font-bold font-mono text-foreground flex items-center gap-1.5">
                {metricsData.rating} <Star className="w-4 h-4 fill-amber-400 text-amber-400 inline" />
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                {metricsData.completionRate}% completion rate
              </p>
            </div>
          </div>

          {/* ─── 3. Unified Tab Bar ─────────────────────────────────────────── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-11 bg-transparent border-t border-border w-full justify-start rounded-none p-0 gap-6">
              {[
                { id: "overview", label: "Overview & Dossier" },
                { id: "staff", label: `Staff Roster (${metricsData.staff})` },
                { id: "services", label: `Services (${company.services?.length || 0})` },
                { id: "finance", label: "Financials & Ledger" },
                { id: "verification", label: "KYC & Verification" },
              ].map(tab => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground font-bold tracking-wider uppercase text-[11px] rounded-none px-0 h-11 transition-colors"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="py-6">
              {/* ─── TAB 1: OVERVIEW ───────────────────────────────────────── */}
              <TabsContent value="overview" className="m-0 space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Business Dossier */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                      <div className="px-5 py-4 bg-muted/20 border-b border-border flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" /> Business Profile & Dossier
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditModalOpen(true)}
                          className="h-7 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </div>

                      <div className="p-6">
                        <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8 text-xs">
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Trade Name</p>
                            <p className="font-semibold text-foreground text-sm">{company.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Registration / Tax ID</p>
                            <p className="font-mono font-semibold text-foreground text-sm">{company.registrationNumber || "KH-TAX-PENDING"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Business Email</p>
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {company.email || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Direct Phone</p>
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {company.phone || "Not specified"}
                            </p>
                          </div>
                          <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Physical Address</p>
                            <p className="font-medium text-foreground flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              {company.address ? `${company.address}, ${company.city || ""}` : "No physical address registered"}
                            </p>
                          </div>
                          {company.description && (
                            <div className="sm:col-span-2 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">About Company</p>
                              <p className="text-muted-foreground text-xs leading-relaxed">{company.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Revenue Trend (6-Month Area Chart) */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> Gross Booking Volume Trend
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Monthly billing volume over the last 6 months</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                          Total: ${metricsData.revenue.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCompanyRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: "hsl(var(--card))", 
                                borderRadius: "12px", 
                                border: "1px solid hsl(var(--border))",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                              }}
                              itemStyle={{ color: "hsl(var(--primary))", fontWeight: "bold" }}
                              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Gross Revenue"]}
                              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompanyRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Business Location Map */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                      <div className="px-5 py-4 bg-muted/20 border-b border-border flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> Operating Headquarters
                        </span>
                        {(company.address || company.googleMapUrl) && (
                          <a 
                            href={
                              company.googleMapUrl
                                ? company.googleMapUrl
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((company.address || "") + ", " + (company.city || ""))}`
                            }
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Open in Google Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div>
                        {company.address || company.googleMapUrl ? (
                          <iframe 
                            width="100%" 
                            height="240" 
                            style={{ border: 0 }} 
                            loading="lazy" 
                            allowFullScreen
                            src={(() => {
                              const url = (company.googleMapUrl || "").trim();
                              if (url.includes('<iframe')) {
                                const match = url.match(/src="([^"]+)"/);
                                if (match) return match[1];
                              }
                              if (url.includes('/embed')) return url;
                              const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                              if (coordsMatch) {
                                return `https://www.google.com/maps?q=${coordsMatch[1]},${coordsMatch[2]}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                              }
                              const addressQuery = company.address ? `${company.address}, ${company.city || ""}` : (company.city || "Phnom Penh");
                              return `https://www.google.com/maps?q=${encodeURIComponent(addressQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
                            })()}
                          />
                        ) : (
                          <div className="p-8 text-center text-xs text-muted-foreground bg-muted/5">
                            No physical coordinates or Google Maps link set for this company.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Col (Sidebar) */}
                  <div className="space-y-6">
                    {/* Operational Health Card */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-4">
                      <div className="border-b border-border pb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Operational Health</span>
                        <StatusPill status={isSuspended ? "suspended" : (company.verificationStatus || "active")} />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Marketplace Visibility</span>
                          <span className={cn("font-semibold", !isSuspended ? "text-emerald-600" : "text-rose-600")}>
                            {!isSuspended ? "Publicly Listed" : "Hidden (Suspended)"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">KYC Verification</span>
                          <span className={cn("font-semibold", isVerified ? "text-emerald-600" : "text-amber-600")}>
                            {isVerified ? "Approved" : "Pending Review"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Platform Commission</span>
                          <span className="font-mono font-bold text-foreground">{platformRate}% Split</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Onboarding Date</span>
                          <span className="font-medium text-foreground">
                            {company.createdAt ? format(new Date(company.createdAt), "MMM d, yyyy") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Account Owner Card */}
                    <div className="bg-card rounded-2xl border border-border shadow-xs p-5 space-y-4">
                      <div className="border-b border-border pb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-primary" /> Account Owner
                        </span>
                        {company.ownerId && (
                          <Link
                            href={`/admin/users/${company.ownerId}`}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                          >
                            Profile ↗
                          </Link>
                        )}
                      </div>

                      {company.owner ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                              {company.owner.fullName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-foreground text-xs truncate">{company.owner.fullName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{company.owner.email}</p>
                            {company.owner.phone && (
                              <p className="text-[10px] font-mono text-muted-foreground">{company.owner.phone}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No claimed user account linked as owner.</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── TAB 2: STAFF ROSTER ───────────────────────────────────── */}
              <TabsContent value="staff" className="m-0 space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Technician & Staff Roster</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Personnel authorized to perform jobs under this merchant.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                      {company.staff?.length || 0} Staff Members
                    </span>
                  </div>

                  <div>
                    {company.staff && company.staff.length > 0 ? (
                      <div className="divide-y divide-border">
                        {company.staff.map((staffItem: any, i: number) => (
                          <div key={i} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                  {staffItem.user?.fullName?.[0] || "S"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground text-xs">{staffItem.user?.fullName || "Staff Member"}</p>
                                <p className="text-[11px] text-muted-foreground">{staffItem.user?.email || "No email"}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                                {staffItem.role || "Technician"}
                              </span>
                              <span className="text-xs text-muted-foreground hidden sm:inline">
                                Joined {staffItem.createdAt ? format(new Date(staffItem.createdAt), "MMM yyyy") : "—"}
                              </span>
                              {staffItem.userId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => router.push(`/admin/users/${staffItem.userId}`)}
                                  className="h-8 text-xs font-semibold text-primary hover:bg-primary/10"
                                >
                                  View ↗
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-foreground">No staff members assigned</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This company has not added any technicians to their roster yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ─── TAB 3: SERVICES ───────────────────────────────────────── */}
              <TabsContent value="services" className="m-0 space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Service Catalog</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Active catalog of services listed on the marketplace.</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                      {company.services?.length || 0} Offerings
                    </span>
                  </div>

                  <div className="p-6">
                    {company.services && company.services.length > 0 ? (
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {company.services.map((svc: any, i: number) => (
                          <div key={i} className="border border-border rounded-xl p-4 bg-card hover:border-primary/40 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <Briefcase className="w-4 h-4" />
                              </div>
                              <span className="text-base font-bold font-mono text-foreground">${Number(svc.basePrice || 0).toFixed(2)}</span>
                            </div>
                            <p className="text-xs font-bold text-foreground line-clamp-1">{svc.name}</p>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px]">
                              <span className="text-muted-foreground">{svc.serviceType?.name || "General"}</span>
                              <span className={cn("font-bold uppercase tracking-wider", svc.isActive ? "text-emerald-600" : "text-muted-foreground")}>
                                {svc.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-foreground">No services listed</p>
                        <p className="text-xs text-muted-foreground mt-0.5">This company has not created any service catalog items yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ─── TAB 4: FINANCIALS & LEDGER ────────────────────────────── */}
              <TabsContent value="finance" className="m-0 space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Merchant Ledger & Bookings Breakdown</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Historical booking volume, platform fee deduction, and net earnings.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        Commission: {platformRate}%
                      </span>
                    </div>
                  </div>

                  {realBookings.length > 0 ? (
                    <div className="divide-y divide-border">
                      {realBookings.map((b: any, idx: number) => {
                        const price = Number(b.totalPrice || 0);
                        const fee = Number(b.platformFee || price * (platformRate / 100));
                        const net = price - fee;
                        return (
                          <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs font-bold text-primary hover:underline">
                                  #{b.id}
                                </Link>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs font-medium text-foreground">{b.service?.name || "Service Job"}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Customer: <strong className="text-foreground">{b.customer?.fullName || "Guest Customer"}</strong> • {b.bookingDate ? format(new Date(b.bookingDate), "MMM d, yyyy") : "N/A"}
                              </p>
                            </div>

                            <div className="flex items-center gap-6 font-mono text-xs">
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground block">Gross</span>
                                <span className="font-bold text-foreground">${price.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground block">Platform ({platformRate}%)</span>
                                <span className="font-bold text-emerald-600">-${fee.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase text-muted-foreground block">Merchant Net</span>
                                <span className="font-bold text-foreground">${net.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-foreground">No booking transactions recorded</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Completed jobs and commission statements will appear here.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ─── TAB 5: KYC VERIFICATION ───────────────────────────────── */}
              <TabsContent value="verification" className="m-0 space-y-6">
                <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
                  <div className="px-6 py-4 bg-muted/20 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Compliance & Legal Documentation</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Business licenses and government-issued merchant verification files.</p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                      isVerified
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}>
                      {isVerified ? "KYC Approved" : "Pending Adjudication"}
                    </span>
                  </div>

                  <div className="p-6">
                    {company.verificationDocumentUrl ? (
                      <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground">Merchant Operating License / Certificate</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Official registration file submitted for platform approval</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(company.verificationDocumentUrl, "_blank")}
                            className="rounded-xl h-8 text-xs font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View File
                          </Button>
                          {!isVerified && (
                            <Button
                              size="sm"
                              onClick={handleVerify}
                              className="rounded-xl h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Approve KYC
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-foreground">No verification documents uploaded</p>
                        <p className="text-xs text-muted-foreground mt-0.5">The merchant has not submitted business licenses or identity verification files yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Edit Company Modal */}
      <EditCompanyModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        company={company} 
        onSuccess={refetch} 
      />

      {/* Verification Confirmation */}
      <ConfirmationDialog
        isOpen={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        title="Approve & Verify Merchant"
        description={`Are you sure you want to approve "${company?.name || 'this company'}"? They will be granted full marketplace listing status and public visibility.`}
        actionType="warning"
        confirmLabel="Approve Merchant"
        onConfirm={confirmVerify}
      />

      {/* Suspend Confirmation */}
      <ConfirmationDialog
        isOpen={suspendDialogOpen}
        onClose={() => setSuspendDialogOpen(false)}
        title="Suspend Merchant Account"
        description={`Are you sure you want to suspend "${company?.name || 'this company'}"? This will immediately hide their listings and freeze technician dispatch operations.`}
        actionType="danger"
        confirmLabel="Suspend Merchant"
        onConfirm={confirmSuspend}
      />
    </div>
  );
}
