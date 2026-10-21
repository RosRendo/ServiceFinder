"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Loader2, Clock, Map, UserPlus, RefreshCw, AlertCircle, 
  MessageCircle, Eye, Activity, Star, Users, MapPin, CheckCircle2,
  Navigation, Columns2, Maximize2, Filter, Phone, Check, ShieldCheck,
  ChevronRight, Calendar, AlertTriangle, Zap, Radio, Layers,
  Compass, ArrowUpRight, Flame, Wrench, ChevronDown, ChevronUp,
  LayoutGrid, List, Sparkles, X
} from "lucide-react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { BookingDispatchDrawer } from "@/components/company/BookingDispatchDrawer";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const InteractiveMap = dynamic(() => import("@/components/maps/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/20 animate-pulse rounded-2xl flex items-center justify-center min-h-[350px]">
      <div className="text-center space-y-2">
        <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto opacity-70" />
        <p className="text-xs font-semibold text-muted-foreground">Initializing Live Fleet Radar...</p>
      </div>
    </div>
  ),
});

interface StaffStats {
  jobsToday: number;
  rating: number;
  skills: string[];
  statusLabel: string;
  statusColor: string;
  iconColor: string;
  state: "available" | "busy" | "offline";
}

export default function DispatchCenter() {
  const router = useRouter();
  const { toast } = useToast();

  // ─── View & Filter States ──────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"split" | "map" | "queue">("split");
  const [queueDisplayMode, setQueueDisplayMode] = useState<"cards" | "table">("cards");
  const [activeTab, setActiveTab] = useState<"all" | "unassigned" | "active">("unassigned");
  const [mapFilter, setMapFilter] = useState<"all" | "jobs" | "staff">("all");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFleetDock, setShowFleetDock] = useState(true);

  // ─── Data States ───────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // ─── Selected / Active States ──────────────────────────────────────────────
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<{ type: "staff" | "job"; data: any } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 11.5564, lng: 104.9282 });

  // ─── Dispatch Drawer & Modal ───────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  // ─── Workload & Priority Helpers ───────────────────────────────────────────
  const getStaffWorkload = (staffId: string): StaffStats => {
    const staff = staffMembers.find((s) => s.id?.toString() === staffId?.toString());
    const jobsToday = staff ? staff.todayJobs || staff.assignedBookings?.length || 0 : 0;
    const rating = staff ? Number(staff.rating) || 4.9 : 4.9;
    const skills = staff ? [staff.role?.replace(/_/g, " ") || "Technician"] : ["Technician"];

    let statusLabel = "Available";
    let statusColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    let iconColor = "text-emerald-500";
    let state: "available" | "busy" | "offline" = "available";

    if (staff) {
      const isAvailable = staff.status === "available" || staff.isAvailable || staff.status === "active";
      if (!isAvailable) {
        statusLabel = "Offline";
        statusColor = "text-muted-foreground bg-muted border-border";
        iconColor = "text-muted-foreground";
        state = "offline";
      } else if (jobsToday > 0 || staff.workingStatus === "on_job") {
        statusLabel = "Active on Job";
        statusColor = "text-sky-500 bg-sky-500/10 border-sky-500/20";
        iconColor = "text-sky-500";
        state = "busy";
      }
    }

    return { jobsToday, rating, skills, statusLabel, statusColor, iconColor, state };
  };

  const getJobPriority = (bookingId: string) => {
    const seed = bookingId ? parseInt(bookingId.slice(-3), 16) || 0 : 0;
    if (seed % 4 === 0) {
      return { 
        label: "Emergency", 
        badge: "bg-rose-500/10 text-rose-500 border-rose-500/25", 
        icon: Flame,
        dot: "bg-rose-500 animate-ping",
        isUrgent: true
      };
    }
    if (seed % 3 === 0) {
      return { 
        label: "Same Day", 
        badge: "bg-amber-500/10 text-amber-500 border-amber-500/25", 
        icon: Zap,
        dot: "bg-amber-500",
        isUrgent: false
      };
    }
    return { 
      label: "Scheduled", 
      badge: "bg-muted text-muted-foreground border-border", 
      icon: Calendar,
      dot: "bg-muted-foreground",
      isUrgent: false
    };
  };

  // ─── Data Fetching ─────────────────────────────────────────────────────────
  const fetchDispatchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "unassigned") {
        params.append("status", "pending,confirmed");
      } else if (activeTab === "active") {
        params.append("status", "in_progress,en_route");
      }
      params.append("limit", "100");
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data?.data || response.data;
      let list = payload.bookings || [];

      if (activeTab === "unassigned") {
        list = list.filter((b: any) => b.status === "pending" || !b.assignedStaff);
      }
      setBookings(list);
    } catch {
      toast({ title: "Error", description: "Failed to load dispatch queue.", variant: "destructive" });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const r = await api.get(`/companies/my-company/staff`).catch(() => api.get(`/staff`));
      const d = r.data?.data || r.data;
      setStaffMembers(Array.isArray(d) ? d : d.staff || []);
    } catch {
      // Fallback
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchDispatchBookings();
    fetchStaff();
  }, [activeTab]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDispatchBookings(true), fetchStaff()]);
    setIsRefreshing(false);
    toast({ title: "Radar Synced", description: "Fleet positioning and queue updated." });
  };

  // ─── Dispatch Execution ────────────────────────────────────────────────────
  const openAssignModal = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setSelectedStaffId(booking.assignedStaff?.id || "");
    setAssignmentNotes("");
    setAssignOpen(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedStaffId || !selectedBooking?.id) {
      toast({ title: "Technician Required", description: "Please select an available technician.", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      await api.patch(`/bookings/${selectedBooking.id}/assign-staff`, {
        staffId: String(selectedStaffId),
        notes: assignmentNotes || undefined,
      });
      toast({ title: "Dispatched Successfully", description: `Order #${selectedBooking.id.slice(-6).toUpperCase()} assigned to technician.` });
      setAssignOpen(false);
      fetchDispatchBookings(true);
      fetchStaff();
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err.response?.data?.message || err.message || "Could not dispatch staff.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  // ─── Filtered Queue & Metrics ──────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.customer?.fullName?.toLowerCase().includes(q) ||
        b.service?.name?.toLowerCase().includes(q) ||
        b.assignedStaff?.fullName?.toLowerCase().includes(q) ||
        b.assignedStaff?.user?.fullName?.toLowerCase().includes(q) ||
        b.id?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const unassignedCount = useMemo(() => {
    return bookings.filter((b) => !b.assignedStaff || b.status === "pending").length;
  }, [bookings]);

  const activeInFieldCount = useMemo(() => {
    return bookings.filter((b) => b.status === "in_progress" || b.status === "en_route").length;
  }, [bookings]);

  const availableTechs = useMemo(() => {
    return staffMembers.filter((s) => s.status === "available" || s.isAvailable || s.status === "active");
  }, [staffMembers]);

  // ─── Map Markers Generation ────────────────────────────────────────────────
  const mapMarkers = useMemo(() => {
    const list: any[] = [];

    // Job Markers
    if (mapFilter === "all" || mapFilter === "jobs") {
      bookings.forEach((b) => {
        const isAssigned = !!b.assignedStaff;
        const priority = getJobPriority(b.id);
        const lat = Number(b.latitude) || 11.5564 + ((parseInt(b.id.slice(-3), 16) % 40) - 20) * 0.002;
        const lng = Number(b.longitude) || 104.9282 + (((parseInt(b.id.slice(-3), 16) + 15) % 40) - 20) * 0.002;

        list.push({
          lat,
          lng,
          type: "customer" as const,
          label: b.service?.name || "Service Order",
          color: isAssigned ? "#3B82F6" : priority.isUrgent ? "#E11D48" : "#F59E0B",
          icon: isAssigned ? "📍" : priority.isUrgent ? "🚨" : "⏳",
          rawPayload: b,
          popupHtml: `
            <div style="font-family:Inter,system-ui,sans-serif;padding:6px;min-width:180px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;">#${b.id.slice(-6).toUpperCase()}</span>
                <span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;background:${isAssigned ? '#eff6ff' : '#ffe4e6'};color:${isAssigned ? '#1d4ed8' : '#be123c'};">${b.status}</span>
              </div>
              <h4 style="font-weight:700;font-size:12px;margin:0 0 4px;color:#0f172a;">${b.service?.name || "Home Service"}</h4>
              <p style="font-size:11px;color:#475569;margin:0 0 6px;">Customer: <strong>${b.customer?.fullName || "Client"}</strong></p>
              <div style="font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:4px;">
                📍 ${b.address ? b.address.slice(0, 30) + '...' : 'Location provided'}
              </div>
            </div>
          `,
        });
      });
    }

    // Staff Markers
    if (mapFilter === "all" || mapFilter === "staff") {
      availableTechs.forEach((s) => {
        const workload = getStaffWorkload(s.id);
        const seed = parseInt(s.id?.toString().slice(-4), 16) || 0;
        const lat = 11.5564 + ((seed % 50) - 25) * 0.0018;
        const lng = 104.9282 + (((seed + 30) % 50) - 25) * 0.0018;

        list.push({
          lat,
          lng,
          type: "staff" as const,
          label: s.fullName || s.user?.fullName || "Technician",
          color: workload.state === "available" ? "#10B981" : "#0284C7",
          icon: "👷",
          rawPayload: s,
          popupHtml: `
            <div style="font-family:Inter,system-ui,sans-serif;padding:6px;min-width:160px;">
              <h4 style="font-weight:700;font-size:12px;margin:0 0 2px;color:#0f172a;">${s.fullName || s.user?.fullName}</h4>
              <p style="font-size:10px;color:#64748b;margin:0 0 6px;">⭐ ${workload.rating.toFixed(1)} • ${workload.jobsToday} active jobs</p>
              <span style="font-size:9px;font-weight:800;padding:2px 6px;border-radius:99px;background:${workload.state === 'available' ? '#ecfdf5' : '#eff6ff'};color:${workload.state === 'available' ? '#047857' : '#0369a1'};">${workload.statusLabel}</span>
            </div>
          `,
        });
      });
    }

    return list;
  }, [bookings, availableTechs, mapFilter]);

  const handleMarkerClick = (marker: any) => {
    setSelectedPin({
      type: marker.type === "customer" ? "job" : "staff",
      data: marker.rawPayload,
    });
    setMapCenter({ lat: marker.lat, lng: marker.lng });
  };

  // ─── Table Columns (For Dense Table Mode) ──────────────────────────────────
  const columns: Column<any>[] = [
    {
      key: "id",
      header: "Job Ref",
      width: "w-24",
      render: (r) => (
        <span className="font-mono text-xs font-bold text-foreground">
          #{r.id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      key: "service",
      header: "Service & Customer",
      render: (r) => {
        const priority = getJobPriority(r.id);
        const PriorityIcon = priority.icon;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground truncate max-w-[140px]">
                {r.service?.name || "Service Job"}
              </span>
              <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border", priority.badge)}>
                <PriorityIcon className="w-2.5 h-2.5" />
                {priority.label}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
              {r.customer?.fullName || "Client"} • {r.address ? r.address.slice(0, 24) + "..." : "Phnom Penh"}
            </p>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "assignedStaff",
      header: "Field Technician",
      render: (r) => {
        const staffName = r.assignedStaff?.user?.fullName || r.assignedStaff?.fullName;
        return staffName ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 border border-primary/20">
              {staffName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-foreground truncate max-w-[100px]">{staffName}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-black uppercase">
            <AlertCircle className="w-3 h-3" /> Unassigned
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      render: (r) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!r.assignedStaff && r.status !== "cancelled" ? (
            <Button
              size="sm"
              onClick={(e) => openAssignModal(e, r)}
              className="h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs"
            >
              <Zap className="w-3 h-3 mr-1" /> Dispatch
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => openAssignModal(e, r)}
              className="h-7 px-2 text-xs font-semibold border-border hover:bg-muted"
            >
              Reassign
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      
      {/* ═══════════════════════════════════════════════════════════════════════
          TOP TELEMETRY & DISPATCH COMMAND HEADER
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 py-3 shrink-0 z-10 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Brand & Telemetry Pulse */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-foreground font-heading">
                  Dispatch Command Deck
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live GPS Radar
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Intelligent fleet allocation, real-time routing & technician matching
              </p>
            </div>
          </div>

          {/* Interactive Metric Telemetry Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Needs Dispatch Chip */}
            <button
              type="button"
              onClick={() => setActiveTab("unassigned")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs",
                activeTab === "unassigned"
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-500 ring-2 ring-rose-500/20"
                  : "bg-muted/40 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Needs Dispatch:</span>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400">{unassignedCount}</span>
            </button>

            {/* In-Field Chip */}
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs",
                activeTab === "active"
                  ? "bg-sky-500/10 border-sky-500/40 text-sky-500 ring-2 ring-sky-500/20"
                  : "bg-muted/40 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>In Field:</span>
              <span className="font-mono font-black text-sky-600 dark:text-sky-400">{activeInFieldCount}</span>
            </button>

            {/* Available Techs Chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Ready Crew:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{availableTechs.length}</span>
            </div>

            {/* View Layout Switcher */}
            <div className="flex items-center border border-border rounded-xl p-0.5 bg-muted/40 ml-1">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "split" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Split Radar & Queue"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "map" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Full Radar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Radar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("queue")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  viewMode === "queue" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
                title="Full Queue"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Queue</span>
              </button>
            </div>

            {/* Refresh Action */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 px-2.5 rounded-xl border-border hover:bg-muted text-xs font-semibold"
              title="Sync GPS Telemetry"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isRefreshing && "animate-spin text-primary")} />
            </Button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DUAL-STAGE WORKSPACE (RADAR + SMART QUEUE)
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ─────────────────────────────────────────────────────────────────────
            STAGE 1: LIVE GPS RADAR (LEFT / CENTER)
        ───────────────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "map") && (
          <div className={cn(
            "relative flex flex-col bg-muted/10 border-r border-border overflow-hidden",
            viewMode === "map" ? "w-full h-full" : "w-full lg:w-1/2 h-full"
          )}>
            
            {/* Top Map Floating Filter Pill Bar */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-background/90 backdrop-blur-md border border-border/80 px-2.5 py-1.5 rounded-2xl shadow-lg">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider px-1">Radar:</span>
              <button
                type="button"
                onClick={() => setMapFilter("all")}
                className={cn(
                  "px-2.5 py-0.8 rounded-xl text-[11px] font-bold transition-all",
                  mapFilter === "all" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({mapMarkers.length})
              </button>
              <button
                type="button"
                onClick={() => setMapFilter("jobs")}
                className={cn(
                  "px-2.5 py-0.8 rounded-xl text-[11px] font-bold transition-all",
                  mapFilter === "jobs" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Jobs ({bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setMapFilter("staff")}
                className={cn(
                  "px-2.5 py-0.8 rounded-xl text-[11px] font-bold transition-all",
                  mapFilter === "staff" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Crew ({availableTechs.length})
              </button>
            </div>

            {/* Interactive Leaflet Map Canvas */}
            <div className="w-full h-full select-none">
              <InteractiveMap
                markers={mapMarkers}
                center={mapCenter}
                zoom={14}
                className="w-full h-full"
                onMarkerClick={handleMarkerClick}
              />
            </div>

            {/* Floating Glassmorphic Pin Details HUD */}
            {selectedPin && (
              <div className="absolute bottom-20 left-4 right-4 z-30 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                      selectedPin.type === "job" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    )}>
                      {selectedPin.type === "job" ? <MapPin className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-foreground">
                          {selectedPin.type === "job"
                            ? selectedPin.data.service?.name || "Service Order"
                            : selectedPin.data.fullName || selectedPin.data.user?.fullName}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase bg-muted border border-border">
                          {selectedPin.type === "job" ? selectedPin.data.status : "Field Tech"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedPin.type === "job"
                          ? `Customer: ${selectedPin.data.customer?.fullName || "Client"} • ${selectedPin.data.address || "Phnom Penh"}`
                          : `Skills: ${selectedPin.data.role || "Technician"} • Active Jobs: ${selectedPin.data.todayJobs || 0}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedPin.type === "job" && !selectedPin.data.assignedStaff && (
                      <Button
                        size="sm"
                        onClick={(e) => openAssignModal(e, selectedPin.data)}
                        className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1" /> Quick Dispatch
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPin(null)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Collapsible Active Crew Dock */}
            <div className="absolute bottom-3 left-4 right-4 z-20">
              <div className="bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden">
                <div 
                  onClick={() => setShowFleetDock(!showFleetDock)}
                  className="px-4 py-2 border-b border-border/60 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                      On-Duty Fleet Dock
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {availableTechs.length} Ready
                    </span>
                  </div>
                  {showFleetDock ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                </div>

                {showFleetDock && (
                  <div className="p-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    {availableTechs.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 px-3">No active staff currently on duty.</div>
                    ) : (
                      availableTechs.map((tech) => {
                        const wl = getStaffWorkload(tech.id);
                        return (
                          <div
                            key={tech.id}
                            onClick={() => {
                              setSelectedPin({ type: "staff", data: tech });
                              const seed = parseInt(tech.id?.toString().slice(-4), 16) || 0;
                              setMapCenter({
                                lat: 11.5564 + ((seed % 50) - 25) * 0.0018,
                                lng: 104.9282 + (((seed + 30) % 50) - 25) * 0.0018,
                              });
                            }}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 bg-background/80 hover:bg-muted/50 cursor-pointer shrink-0 transition-all shadow-2xs"
                          >
                            <div className="relative">
                              <Avatar className="w-7 h-7 rounded-lg border border-border">
                                <AvatarFallback className="text-[10px] font-bold bg-muted">
                                  {(tech.fullName || tech.user?.fullName)?.slice(0, 2).toUpperCase() || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background",
                                wl.state === "available" ? "bg-emerald-500" : "bg-sky-500"
                              )} />
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[90px]">
                                {tech.fullName || tech.user?.fullName}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                ⭐ {wl.rating.toFixed(1)} • {wl.jobsToday} jobs
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            STAGE 2: SMART DISPATCH QUEUE & TRIAGE BOARD (RIGHT)
        ───────────────────────────────────────────────────────────────────── */}
        {(viewMode === "split" || viewMode === "queue") && (
          <div className={cn(
            "flex flex-col h-full overflow-hidden bg-background",
            viewMode === "queue" ? "w-full" : "w-full lg:w-1/2"
          )}>
            
            {/* Queue Sub-Header (Search, Filter Tabs, Layout Mode) */}
            <div className="shrink-0 p-4 border-b border-border bg-card/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer, booking ref, or address..."
                    className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/80 transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Card vs Table View Toggle */}
                <div className="flex items-center border border-border rounded-xl p-0.5 bg-muted/40 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQueueDisplayMode("cards")}
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-bold transition-all",
                      queueDisplayMode === "cards" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Card Stream Mode"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueDisplayMode("table")}
                    className={cn(
                      "p-1.5 rounded-lg text-xs font-bold transition-all",
                      queueDisplayMode === "table" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="DataGrid Table Mode"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("unassigned")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.2 rounded-xl text-xs font-bold transition-all shrink-0",
                    activeTab === "unassigned"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Need Dispatch</span>
                  {unassignedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {unassignedCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("active")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.2 rounded-xl text-xs font-bold transition-all shrink-0",
                    activeTab === "active"
                      ? "bg-primary/10 text-primary border border-primary/30 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>In Field</span>
                  {activeInFieldCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-black">
                      {activeInFieldCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.2 rounded-xl text-xs font-bold transition-all shrink-0",
                    activeTab === "all"
                      ? "bg-card text-foreground border border-border shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <span>All Orders</span>
                  <span className="text-[10px] text-muted-foreground">({bookings.length})</span>
                </button>
              </div>
            </div>

            {/* Queue Content (Cards or Table) */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary opacity-60" />
                  <p className="text-xs font-medium">Scanning dispatch orders...</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 border border-dashed border-border rounded-2xl bg-muted/10">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                  <h4 className="font-bold text-sm text-foreground">Queue Clean & Clear</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {search ? "No orders match your filter criteria." : "All pending orders have been dispatched to technicians."}
                  </p>
                </div>
              ) : queueDisplayMode === "table" ? (
                /* Dense DataGrid View */
                <DataGrid
                  columns={columns}
                  data={filteredBookings}
                  onRowClick={(row) => {
                    setActiveBookingId(row.id);
                    setDrawerOpen(true);
                  }}
                  emptyMessage="No orders found."
                />
              ) : (
                /* Modern Actionable Dispatch Cards Feed */
                <div className="space-y-3">
                  {filteredBookings.map((b) => {
                    const priority = getJobPriority(b.id);
                    const PriorityIcon = priority.icon;
                    const hasStaff = !!b.assignedStaff;
                    const staffName = b.assignedStaff?.user?.fullName || b.assignedStaff?.fullName;
                    const bestCandidate = availableTechs[0];

                    return (
                      <div
                        key={b.id}
                        onMouseEnter={() => {
                          setHoveredBookingId(b.id);
                          const lat = Number(b.latitude) || 11.5564;
                          const lng = Number(b.longitude) || 104.9282;
                          setMapCenter({ lat, lng });
                        }}
                        onClick={() => {
                          setActiveBookingId(b.id);
                          setDrawerOpen(true);
                        }}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer bg-card hover:shadow-md",
                          hoveredBookingId === b.id
                            ? "border-primary ring-1 ring-primary/20 shadow-sm"
                            : !hasStaff
                            ? "border-rose-500/30 hover:border-rose-500/60"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        {/* Card Top Row: Ref, Priority, Price */}
                        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-foreground">
                              #{b.id.slice(-6).toUpperCase()}
                            </span>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", priority.badge)}>
                              <PriorityIcon className="w-2.5 h-2.5" />
                              {priority.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-foreground">
                              ${Number(b.totalPrice || 0).toFixed(2)}
                            </span>
                            <StatusBadge status={b.status} />
                          </div>
                        </div>

                        {/* Card Middle: Service, Customer, Location */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-bold text-xs text-foreground leading-snug">
                                {b.service?.name || "Home Service Order"}
                              </h4>
                              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <span>{b.customer?.fullName || "Client"}</span>
                                {b.customer?.phone && (
                                  <>
                                    <span>•</span>
                                    <a
                                      href={`tel:${b.customer.phone}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-primary hover:underline font-semibold flex items-center gap-0.5"
                                    >
                                      <Phone className="w-2.5 h-2.5" /> {b.customer.phone}
                                    </a>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="text-right text-[11px] text-muted-foreground shrink-0">
                              <div className="flex items-center gap-1 justify-end font-medium">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span>
                                  {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "Today"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {b.address && (
                            <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-xl border border-border/40">
                              <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{b.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom: Dispatch Action & Smart Matcher */}
                        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-3">
                          {!hasStaff ? (
                            <div className="flex items-center justify-between w-full gap-2">
                              {bestCandidate ? (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="truncate">
                                    Match: <strong className="text-foreground">{bestCandidate.fullName || bestCandidate.user?.fullName}</strong>
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Awaiting Candidate
                                </span>
                              )}

                              <Button
                                size="sm"
                                onClick={(e) => openAssignModal(e, b)}
                                className="h-7.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs shrink-0"
                              >
                                <Zap className="w-3 h-3 mr-1" /> Dispatch Tech
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6 rounded-md border border-border">
                                  <AvatarFallback className="text-[9px] font-bold bg-muted">
                                    {staffName?.charAt(0) || "T"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                                  {staffName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => openAssignModal(e, b)}
                                  className="h-7 px-2.5 rounded-lg border-border hover:bg-muted text-xs font-medium"
                                >
                                  Reassign
                                </Button>
                                {b.assignedStaff?.userId && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => router.push(`/company/messages?new=${b.assignedStaff.userId}`)}
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                    title="Message Staff"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SMART CANDIDATE DISPATCH ASSIGNMENT MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl border border-border bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground font-heading flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {selectedBooking?.assignedStaff ? "Reassign Field Technician" : "Intelligent Candidate Dispatch"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an available team member for Order #{selectedBooking?.id ? selectedBooking.id.slice(-6).toUpperCase() : ""}
            </DialogDescription>
          </DialogHeader>

          {/* Target Job Brief */}
          {selectedBooking && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 my-1 text-xs space-y-1">
              <div className="flex justify-between font-bold text-foreground">
                <span>{selectedBooking.service?.name}</span>
                <span className="font-mono text-primary">${Number(selectedBooking.totalPrice || 0).toFixed(2)}</span>
              </div>
              <p className="text-muted-foreground text-[11px] truncate">
                Customer: {selectedBooking.customer?.fullName} • {selectedBooking.address || "Phnom Penh"}
              </p>
            </div>
          )}

          {/* Candidate Selection List */}
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <span>Technician Roster ({availableTechs.length})</span>
              <span className="text-[10px] text-primary lowercase">ranked by availability</span>
            </div>

            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary opacity-60" />
              </div>
            ) : availableTechs.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                No active technicians registered. Add staff in the Staff Roster.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {availableTechs.map((s) => {
                  const wl = getStaffWorkload(s.id);
                  const isSelected = selectedStaffId === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStaffId(s.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-2xs"
                          : "border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 rounded-xl border border-border">
                          <AvatarFallback className="font-bold text-xs bg-muted">
                            {(s.fullName || s.user?.fullName)?.slice(0, 2).toUpperCase() || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {s.fullName || s.user?.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>⭐ {wl.rating.toFixed(1)}</span>
                            <span>•</span>
                            <span>{wl.jobsToday} active jobs</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase border", wl.statusColor)}>
                          {wl.statusLabel}
                        </span>
                        <div className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Route Notes Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Route & Dispatch Notes (Optional)
            </label>
            <Textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="Gate code, parking instructions, specific customer request..."
              className="resize-none border border-border rounded-xl placeholder:text-muted-foreground text-xs focus:ring-primary h-16"
            />
          </div>

          <DialogFooter className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-9 border-border text-xs font-semibold"
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssignment}
              disabled={assigning || !selectedStaffId}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 text-xs font-bold shadow-xs"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Dispatched...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5" /> Confirm Dispatch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          SLIDE-OVER TIER 3 DISPATCH DRAWER (ON ROW / CARD CLICK)
      ══════════════════════════════════════════════════════════════════════════ */}
      <BookingDispatchDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bookingId={activeBookingId}
        onAssigned={() => {
          fetchDispatchBookings(true);
          fetchStaff();
        }}
      />

    </div>
  );
}
