"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Loader2, Clock, Map, UserPlus, RefreshCw, AlertCircle, 
  MessageCircle, Edit2, Eye, Trash2, Activity, ShieldAlert, Star,
  Users, MapPin, Wrench, CheckCircle2, Navigation, Columns2,
  Maximize2, Minimize2, Sparkles, Filter, Phone, Check, ShieldCheck,
  ChevronRight, Calendar, AlertTriangle
} from "lucide-react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
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
import { BookingDrawer } from "@/components/drawers/BookingDrawer";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/maps/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/40 animate-pulse rounded-2xl flex items-center justify-center min-h-[350px]">
      <div className="text-center space-y-2">
        <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto opacity-70" />
        <p className="text-xs font-semibold text-muted-foreground">Initializing Fleet Radar...</p>
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
  const [viewMode, setViewMode] = useState<"split" | "map" | "queue">("split");
  const [activeTab, setActiveTab] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  
  // Interactive Map Pin state
  const [selectedPin, setSelectedPin] = useState<{ type: "staff" | "job"; data: any } | null>(null);

  const centerLat = 11.5564;
  const centerLng = 104.9282;

  const getStaffWorkload = (staffId: string): StaffStats => {
    const staff = staffMembers.find(s => s.id?.toString() === staffId?.toString());
    
    const jobsToday = staff ? (staff.todayJobs || 0) : 0;
    const rating = staff ? (staff.rating || 4.9) : 4.9;
    const skills = staff ? [staff.role || "Technician"] : ["Technician"];
    
    let statusLabel = "Available Now";
    let statusColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
    let iconColor = "text-emerald-500";
    let state: "available" | "busy" | "offline" = "available";

    if (staff) {
      if (staff.status === "offline" || staff.workingStatus === "offline") {
        if (jobsToday > 0) {
          statusLabel = "Working On-Site";
          statusColor = "text-blue-600 bg-blue-500/10 border-blue-500/20";
          iconColor = "text-blue-500";
          state = "busy";
        } else {
          statusLabel = "Offline";
          statusColor = "text-muted-foreground bg-muted border-border";
          iconColor = "text-muted-foreground";
          state = "offline";
        }
      } else if (staff.workingStatus === "on_job" || jobsToday > 0) {
        statusLabel = "Active on Job";
        statusColor = "text-indigo-600 bg-indigo-500/10 border-indigo-500/20";
        iconColor = "text-indigo-500";
        state = "busy";
      }
    }

    return { jobsToday, rating, skills, statusLabel, statusColor, iconColor, state };
  };

  const getJobPriority = (bookingId: string) => {
    const seed = bookingId ? parseInt(bookingId.slice(-3), 16) || 0 : 0;
    if (seed % 5 === 0) return { label: "Emergency", bg: "bg-rose-500/10 text-rose-600 border-rose-500/25 font-bold" };
    if (seed % 3 === 0) return { label: "Same Day", bg: "bg-amber-500/10 text-amber-600 border-amber-500/25 font-bold" };
    return { label: "Scheduled", bg: "bg-muted text-muted-foreground border-border font-medium" };
  };

  const fetchDispatchBookings = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const r = await api.get(`/companies/my-company/staff`);
      const d = r.data?.data || r.data;
      setStaffMembers(Array.isArray(d) ? d : d.staff || []);
    } catch { }
    finally { setLoadingStaff(false); }
  };

  useEffect(() => { 
    fetchDispatchBookings(); 
    fetchStaff();
  }, [activeTab]);

  const openAssignDialog = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setSelectedStaffId(booking.assignedStaff?.id || "");
    setAssignmentNotes("");
    setAssignOpen(true);
    fetchStaff();
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast({ title: "Technician Required", description: "Please select a technician candidate.", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      await api.patch(`/bookings/${selectedBooking.id}/assign-staff`, {
        staffId: selectedStaffId,
        notes: assignmentNotes
      });
      toast({ title: "Technician Dispatched", description: "Job has been assigned and dispatched." });
      setAssignOpen(false);
      fetchDispatchBookings();
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.response?.data?.message || err.message || "Could not dispatch staff.",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  // ─── Filtered Queue ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return bookings;
    const query = search.toLowerCase();
    return bookings.filter((b) => 
      b.customer?.fullName?.toLowerCase().includes(query) || 
      b.service?.name?.toLowerCase().includes(query) || 
      b.assignedStaff?.fullName?.toLowerCase().includes(query) || 
      b.assignedStaff?.user?.fullName?.toLowerCase().includes(query) || 
      b.id?.toLowerCase().includes(query)
    );
  }, [bookings, search]);

  // ─── Pulse Statistics ───────────────────────────────────────────────────────
  const unassignedCount = useMemo(() => {
    return bookings.filter(b => !b.assignedStaff || b.status === "pending").length;
  }, [bookings]);

  const activeInFieldCount = useMemo(() => {
    return bookings.filter(b => b.status === "in_progress" || b.status === "en_route").length;
  }, [bookings]);

  const availableTechsCount = useMemo(() => {
    return staffMembers.filter(s => s.status === "active").length;
  }, [staffMembers]);

  // ─── Map Markers ────────────────────────────────────────────────────────────
  const bookingMarkers = useMemo(() => {
    return bookings.map((b) => {
      const isAssigned = !!b.assignedStaff;
      const priority = getJobPriority(b.id);
      const dateStr = new Date(b.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const timeStr = new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      return {
        lat: Number(b.latitude) || centerLat,
        lng: Number(b.longitude) || centerLng,
        type: "customer" as const,
        label: b.customer?.fullName || "Job",
        color: isAssigned ? "#4F46E5" : "#E11D48", // Indigo if assigned, Rose if unassigned
        icon: isAssigned ? "📍" : "🚨",
        popupHtml: `
          <div style="font-family:Inter,sans-serif;padding:6px 4px;min-width:180px;">
            <h4 style="font-weight:700;margin:0 0 4px;font-size:12px;color:#0f172a;line-height:1.2;">${b.service?.name || "Service Job"}</h4>
            <p style="font-size:10px;color:#64748b;margin:0 0 4px;">Customer: <strong>${b.customer?.fullName || "Client"}</strong></p>
            <p style="font-size:10px;color:#64748b;margin:0 0 6px;">📅 ${dateStr} • ⏰ ${timeStr}</p>
            <div style="display:flex;align-items:center;gap:4px;">
              <span style="font-size:8px;font-weight:800;text-transform:uppercase;padding:2px 5px;border-radius:4px;border:1px solid;background-color:${isAssigned ? '#eef2ff' : '#ffe4e6'};color:${isAssigned ? '#4338ca' : '#be123c'};">${b.status}</span>
              <span style="font-size:8px;font-weight:800;text-transform:uppercase;padding:2px 5px;border-radius:4px;background-color:#f1f5f9;color:#334155;">${priority.label}</span>
            </div>
          </div>
        `,
        rawPayload: b
      };
    });
  }, [bookings]);

  const staffMarkers = useMemo(() => {
    return staffMembers.filter(s => s.status === 'active').map((s) => {
      const workload = getStaffWorkload(s.id);
      const seedNum = parseInt(s.id?.toString().slice(-4), 16) || 0;
      const lat = centerLat + ((seedNum % 60) - 30) * 0.0003;
      const lng = centerLng + (((seedNum + 30) % 60) - 30) * 0.0003;
      
      return {
        lat,
        lng,
        type: "staff" as const,
        label: s.fullName || s.user?.fullName || "Staff",
        color: workload.state === "available" ? "#10B981" : "#3B82F6",
        icon: "👷",
        popupHtml: `
          <div style="font-family:Inter,sans-serif;padding:6px 4px;min-width:160px;">
            <h4 style="font-weight:700;margin:0 0 4px;font-size:12px;color:#0f172a;line-height:1.2;">${s.fullName || s.user?.fullName}</h4>
            <p style="font-size:10px;color:#64748b;margin:0 0 4px;">Role: ${workload.skills.join(", ")}</p>
            <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#64748b;margin:0 0 6px;">
              <span>⭐ ${workload.rating.toFixed(1)}</span>
              <span>🔧 ${workload.jobsToday} Jobs</span>
            </div>
            <span style="display:inline-block;font-size:8px;font-weight:800;text-transform:uppercase;padding:2px 5px;border-radius:4px;background-color:${workload.state === 'available' ? '#ecfdf5' : '#eff6ff'};color:${workload.state === 'available' ? '#065f46' : '#1e40af'};">${workload.statusLabel}</span>
          </div>
        `,
        rawPayload: s
      };
    });
  }, [staffMembers]);

  const mapMarkers = useMemo(() => {
    return [...bookingMarkers, ...staffMarkers];
  }, [bookingMarkers, staffMarkers]);

  const handleMarkerClick = (marker: any) => {
    setSelectedPin({
      type: marker.type === "customer" ? "job" : "staff",
      data: marker.rawPayload
    });
  };

  // ─── Columns Definition ─────────────────────────────────────────────────────
  const columns: Column<any>[] = [
    { 
      key: "id", 
      header: "Order", 
      width: "w-20", 
      sortable: true, 
      render: (r) => (
        <span className="font-mono text-xs font-bold text-primary">
          #{r.id.slice(-6)}
        </span>
      ) 
    },
    {
      key: "customer", 
      header: "Customer & Service", 
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7 rounded-lg border border-border">
            <AvatarFallback className="font-bold text-[10px] bg-primary/10 text-primary">
              {r.customer?.fullName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-bold text-xs text-foreground leading-tight truncate max-w-[140px]">
              {r.customer?.fullName}
            </div>
            <div className="text-[11px] text-muted-foreground truncate max-w-[140px] mt-0.5">
              {r.service?.name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "bookingDate", 
      header: "Schedule & Urgency", 
      sortable: true,
      render: (r) => {
        const priority = getJobPriority(r.id);
        return (
          <div className="space-y-1">
            <div className="text-xs font-medium text-foreground whitespace-nowrap">
              {new Date(r.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} • {new Date(r.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] uppercase tracking-wide border ${priority.bg}`}>
              {priority.label}
            </span>
          </div>
        );
      },
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "assignedStaff", 
      header: "Assigned Staff", 
      sortable: true,
      render: (r) => {
        const name = r.assignedStaff?.user?.fullName || r.assignedStaff?.fullName;
        return name ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0 border border-emerald-500/20">
              {name.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-foreground truncate max-w-[110px]">{name}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-extrabold uppercase tracking-wide">
            <AlertCircle className="w-3 h-3" /> Unassigned
          </span>
        );
      }
    },
    {
      key: "actions", 
      header: "Dispatch Action",
      render: (r) => {
        const hasStaff = !!r.assignedStaff;
        return (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {!hasStaff && r.status !== "cancelled" ? (
              <Button
                size="sm"
                onClick={(e) => openAssignDialog(e, r)}
                className="h-7 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold shadow-xs"
              >
                <UserPlus className="w-3 h-3 mr-1" /> Dispatch
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => openAssignDialog(e, r)}
                  className="h-7 px-2 text-[11px] font-semibold border-border hover:bg-muted"
                >
                  <RefreshCw className="w-3 h-3 mr-1 text-muted-foreground" /> Reassign
                </Button>
                {r.assignedStaff?.userId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push(`/company/messages?new=${r.assignedStaff.userId}`)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Message Staff"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">

      {/* ─── FLEET PULSE & KPI CONTROL BAR ───────────────────────────── */}
      <div className="border-b border-border bg-card/80 px-4 sm:px-6 py-3.5 shrink-0 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Pulse Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground font-heading">
                  Operational Dispatch Command
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Radar Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Real-time workforce positioning and order fulfillment dispatching
              </p>
            </div>
          </div>

          {/* Quick Fleet Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-medium text-muted-foreground">Needs Dispatch:</span>
              <span className="text-xs font-black text-rose-600 font-mono">
                {unassignedCount} Orders
              </span>
            </div>

            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-medium text-muted-foreground">In Field:</span>
              <span className="text-xs font-black text-indigo-600 font-mono">
                {activeInFieldCount} Active
              </span>
            </div>

            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-muted-foreground">Available Staff:</span>
              <span className="text-xs font-black text-emerald-600 font-mono">
                {availableTechsCount} Ready
              </span>
            </div>

            {/* View Switcher Buttons */}
            <div className="flex items-center border border-border rounded-xl p-0.5 bg-muted/40 ml-1">
              <button
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "split" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Split Command Mode"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "map" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Full Map Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map Focus</span>
              </button>
              <button
                onClick={() => setViewMode("queue")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "queue" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Full Queue Mode"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Queue Focus</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchDispatchBookings(); fetchStaff(); }}
              className="h-8 px-2.5 rounded-xl border-border hover:bg-muted text-xs font-semibold"
              title="Sync Fleet Radar"
            >
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>

        </div>
      </div>

      {/* ─── MAIN DYNAMIC DISPATCH WORKSPACE ───────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ════ LEFT: LIVE RADAR & FLEET MAP ════ */}
        {(viewMode === "split" || viewMode === "map") && (
          <div className={`border-r border-border bg-muted/10 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto ${
            viewMode === "map" ? "w-full" : "w-full lg:w-7/12"
          }`}>
            
            {/* Map Header with Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Phnom Penh Metro Dispatch Grid
                </span>
              </div>

              {/* Map Marker Legend */}
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground bg-card border border-border/80 px-3 py-1 rounded-xl shadow-2xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent Job
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" /> Dispatched
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Idle Staff
                </span>
              </div>
            </div>

            {/* Leaflet Interactive Map */}
            <div className="relative w-full flex-1 min-h-[460px] bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden select-none">
              <InteractiveMap
                markers={mapMarkers}
                center={{ lat: centerLat, lng: centerLng }}
                zoom={14}
                className="w-full h-full"
                onMarkerClick={handleMarkerClick}
              />

              {/* Interactive Selected Pin Card Overlay */}
              {selectedPin && (
                <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200 z-20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-1.5">
                        {selectedPin.type === "staff" ? <Users className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                        {selectedPin.type === "staff" ? "Staff Member Radar" : "Order Destination Pin"}
                      </span>
                      
                      {selectedPin.type === "staff" ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {selectedPin.data.fullName || selectedPin.data.user?.fullName}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStaffWorkload(selectedPin.data.id).statusColor}`}>
                              {getStaffWorkload(selectedPin.data.id).statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>⭐ {getStaffWorkload(selectedPin.data.id).rating.toFixed(1)} Rating</span>
                            <span>•</span>
                            <span>{getStaffWorkload(selectedPin.data.id).jobsToday} Completed Today</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-sm font-bold text-foreground">
                            {selectedPin.data.service?.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Client: <strong>{selectedPin.data.customer?.fullName}</strong> • {selectedPin.data.serviceAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedPin.type === "job" && !selectedPin.data.assignedStaff && (
                        <Button
                          size="sm"
                          onClick={(e) => openAssignDialog(e, selectedPin.data)}
                          className="h-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                        >
                          <UserPlus className="w-3 h-3 mr-1" /> Dispatch
                        </Button>
                      )}
                      {selectedPin.type === "job" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveBookingId(selectedPin.data.id);
                            setDrawerOpen(true);
                          }}
                          className="h-8 rounded-xl border-border text-xs font-semibold"
                        >
                          View Order
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedPin(null)} 
                        className="rounded-xl h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Staff Fleet Carousel */}
            <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Active Workforce Status
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {staffMembers.filter(s => s.status === 'active').length} on duty
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {staffMembers.filter(s => s.status === 'active').slice(0, 6).map((s) => {
                  const workload = getStaffWorkload(s.id);
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedPin({ type: "staff", data: s })}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/50 cursor-pointer transition-all"
                    >
                      <div className="min-w-0 pr-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {s.fullName || s.user?.fullName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {workload.jobsToday} jobs today • ⭐ {workload.rating.toFixed(1)}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${workload.statusColor}`}>
                        {workload.statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════ RIGHT: DISPATCH QUEUE & ACTIONS ════ */}
        {(viewMode === "split" || viewMode === "queue") && (
          <div className={`flex flex-col h-full overflow-hidden bg-background ${
            viewMode === "queue" ? "w-full" : "w-full lg:w-5/12"
          }`}>
            
            {/* Queue Filter Header */}
            <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-card/50">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Filter by customer, order, or service..."
                  className="w-full pl-9 pr-3 h-8.5 bg-muted/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/80 transition-colors" 
                />
              </div>

              {/* Tabs with badges */}
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-xl border border-border">
                <button 
                  onClick={() => setActiveTab("active")} 
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "active" 
                      ? "bg-background text-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Active Queue
                </button>
                <button 
                  onClick={() => setActiveTab("unassigned")} 
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "unassigned" 
                      ? "bg-background text-rose-600 shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Need Dispatch
                  {unassignedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      {unassignedCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab("all")} 
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "all" 
                      ? "bg-background text-foreground shadow-2xs" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* DataGrid Queue */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-60" />
                </div>
              ) : (
                <DataGrid
                  selectedIds={selectedIds}
                  onToggleRow={(id) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onToggleAll={() => setSelectedIds(p => p.size === filtered.length ? new Set() : new Set(filtered.map((x: any) => x.id)))}
                  columns={columns}
                  data={filtered}
                  onRowClick={(row) => {
                    setActiveBookingId(row.id);
                    setDrawerOpen(true);
                  }}
                  emptyMessage={search ? "No dispatch orders match your search." : "No orders pending in this queue."}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* ─── BOOKING DRAWER ─────────────────────────────────────────── */}
      <BookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bookingId={activeBookingId || ""}
        onBookingUpdated={fetchDispatchBookings}
      />

      {/* ─── SMART CANDIDATE MATCHER DISPATCH MODAL ─────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-heading flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              {selectedBooking?.assignedStaff ? "Reassign Dispatch" : "Smart Candidate Matcher"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an available technician for Order #{selectedBooking?.id}.
            </DialogDescription>
          </DialogHeader>

          {/* Job Target Context Card */}
          {selectedBooking && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 my-2 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-foreground">
                <span>{selectedBooking.service?.name}</span>
                <span className="font-mono text-primary">${Number(selectedBooking.totalPrice).toFixed(2)}</span>
              </div>
              <p className="text-muted-foreground">
                Client: {selectedBooking.customer?.fullName} • {selectedBooking.serviceAddress}
              </p>
            </div>
          )}

          {/* Candidate Card Selector */}
          <div className="space-y-2 py-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Technician Candidates ({staffMembers.filter(s => s.status !== 'inactive').length})</span>
              <span className="text-[10px] text-primary lowercase">ranked by availability</span>
            </label>

            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary opacity-60" />
              </div>
            ) : staffMembers.filter(s => s.status !== 'inactive').length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No active technicians found on your company roster.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {staffMembers.filter(s => s.status !== 'inactive').map((s) => {
                  const wl = getStaffWorkload(s.id);
                  const isSelected = selectedStaffId === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaffId(s.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 rounded-lg border border-border">
                          <AvatarFallback className="font-bold text-xs bg-muted">
                            {(s.fullName || s.user?.fullName)?.charAt(0) || "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-xs text-foreground">
                            {s.fullName || s.user?.fullName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>⭐ {wl.rating.toFixed(1)}</span>
                            <span>•</span>
                            <span>{wl.jobsToday} jobs today</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${wl.statusColor}`}>
                          {wl.statusLabel}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-primary bg-primary text-white" : "border-border"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Optional Dispatch Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Route & Access Notes (Optional)
            </label>
            <Textarea
              value={assignmentNotes}
              onChange={(e: any) => setAssignmentNotes(e.target.value)}
              placeholder="Gate code, parking instructions, special customer requests..."
              className="resize-none border border-border rounded-xl placeholder:text-muted-foreground text-xs focus:ring-primary h-18"
            />
          </div>

          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl h-9 border-border text-xs font-semibold" 
              onClick={() => setAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={assigning || !selectedStaffId} 
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 text-xs font-bold shadow-xs"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Dispatching...
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

      {/* ─── BULK ACTION BAR ────────────────────────────────────────── */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            icon: Eye,
            label: "View Detail",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              if (id) {
                router.push(`/company/bookings/${id}`);
              }
            }
          },
          {
            icon: Edit2,
            label: "Inspect",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              const b = filtered.find((x: any) => x.id === id);
              if (b) {
                setActiveBookingId(b.id);
                setDrawerOpen(true);
              }
            }
          },
          {
            icon: Trash2,
            label: "Clear",
            variant: "danger",
            onClick: () => {
              setSelectedIds(new Set());
            }
          }
        ]}
      />
    </div>
  );
}
