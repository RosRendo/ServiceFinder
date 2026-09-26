"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CalendarDays, ChevronLeft, ChevronRight, Clock, Trash2, Plus, 
  Loader2, Calendar, Users, CheckCircle2, AlertCircle, Sparkles, 
  Layers, Zap, BarChart3, Timer, UserCheck, Compass, Check, ArrowRight
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api/client";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─── 7 AM to 9 PM Timeline Range ──────────────────────────────────────────────
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function getBookingDate(b: any): Date | null {
  if (b.bookingDate && b.startTime) {
    const d = new Date(b.bookingDate);
    if (b.startTime.includes('T')) {
      const timePart = new Date(b.startTime);
      d.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
    } else {
      const [h, m] = b.startTime.split(':');
      d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    }
    return d;
  }
  if (b.scheduledAt) return new Date(b.scheduledAt);
  return null;
}

function getBookingDurationHours(b: any): number {
  if (b.service?.durationMin) {
    return Math.max(0.75, b.service.durationMin / 60);
  }
  if (b.startTime && b.endTime) {
    try {
      const s = new Date(b.startTime).getTime();
      const e = new Date(b.endTime).getTime();
      if (!isNaN(s) && !isNaN(e) && e > s) {
        return Math.max(0.75, (e - s) / (1000 * 60 * 60));
      }
    } catch { }
  }
  return 1.5; // default 1.5 hours
}

export default function ScheduleCenter() {
  const [currentTab, setCurrentTab] = useState<"dispatch" | "availability">("dispatch");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staff, setStaff] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  
  // Availability Tab States
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [deleteSlotId, setDeleteSlotId] = useState<string | null>(null);
  
  // Single availability slot states
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [singleStart, setSingleStart] = useState("09:00");
  const [singleEnd, setSingleEnd] = useState("17:00");
  
  // Generate availabilities states
  const [genStart, setGenStart] = useState(new Date().toISOString().split('T')[0]);
  const [genEnd, setGenEnd] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split('T')[0];
  });
  const [genStartTime, setGenStartTime] = useState("09:00");
  const [genEndTime, setGenEndTime] = useState("17:00");
  const [genDays, setGenDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

  const { toast } = useToast();

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const [staffRes, bookingsRes] = await Promise.all([
        api.get('/companies/my-company/staff'),
        api.get('/bookings?limit=200&status=pending,confirmed,in_progress')
      ]);
      const sData = staffRes.data.data || staffRes.data;
      const staffList = Array.isArray(sData) ? sData : sData.staff || [];
      setStaff(staffList);
      
      if (staffList.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffList[0].id.toString());
      }
      
      const bData = bookingsRes.data.data || bookingsRes.data;
      setBookings(bData.bookings || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load schedule data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffAvailability = async (staffId: string) => {
    if (!staffId) return;
    setSlotsLoading(true);
    try {
      const res = await api.get(`/companies/my-company/staff/${staffId}/availability`);
      const payload = res.data.data || res.data;
      setAvailabilitySlots(Array.isArray(payload) ? payload : payload.slots || []);
    } catch {
      toast({ title: "Error", description: "Failed to load shift slots", variant: "destructive" });
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

  useEffect(() => {
    if (currentTab === "availability" && selectedStaffId) {
      fetchStaffAvailability(selectedStaffId);
    }
  }, [currentTab, selectedStaffId]);

  const changeDate = (days: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d);
  };

  const jumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter bookings for the selected date
  const todaysBookings = useMemo(() => {
    return bookings.filter(b => {
      const d = getBookingDate(b);
      if (!d) return false;
      return d.getDate() === currentDate.getDate() &&
             d.getMonth() === currentDate.getMonth() &&
             d.getFullYear() === currentDate.getFullYear();
    });
  }, [bookings, currentDate]);

  const unassignedBookings = useMemo(() => {
    return todaysBookings.filter(b => !b.assignedStaffId && !b.assignedStaff?.id);
  }, [todaysBookings]);

  const getStaffBookings = (staffId: string) => {
    return todaysBookings.filter(b => {
      const sid = b.assignedStaffId || b.assignedStaff?.id;
      return sid?.toString() === staffId.toString();
    });
  };

  // Fleet Capacity & Utilization calculations
  const totalBookedHours = useMemo(() => {
    return todaysBookings.reduce((sum, b) => sum + getBookingDurationHours(b), 0);
  }, [todaysBookings]);

  const activeStaffCount = useMemo(() => {
    return staff.filter(s => s.status === 'active').length;
  }, [staff]);

  const totalCapacityHours = Math.max(8, activeStaffCount * 8);
  const utilizationRate = Math.min(100, Math.round((totalBookedHours / totalCapacityHours) * 100));

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Live "Now" Line calculation
  const isSelectedDateToday = useMemo(() => {
    const today = new Date();
    return today.getDate() === currentDate.getDate() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getFullYear() === currentDate.getFullYear();
  }, [currentDate]);

  const nowLinePercent = useMemo(() => {
    if (!isSelectedDateToday) return null;
    const now = new Date();
    const nowHours = now.getHours() + now.getMinutes() / 60;
    if (nowHours < START_HOUR || nowHours > END_HOUR) return null;
    return ((nowHours - START_HOUR) / TOTAL_HOURS) * 100;
  }, [isSelectedDateToday]);

  // Single Slot Creation
  const handleAddSingleSlot = async () => {
    if (!selectedStaffId || !singleDate) {
      toast({ title: "Error", description: "Please select a date", variant: "destructive" });
      return;
    }
    setSlotsLoading(true);
    try {
      await api.post(`/companies/my-company/staff/${selectedStaffId}/availability`, {
        date: singleDate,
        startTime: `${singleStart}:00`,
        endTime: `${singleEnd}:00`
      });
      toast({ title: "Success", description: "Shift slot registered" });
      fetchStaffAvailability(selectedStaffId);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to add shift", variant: "destructive" });
    } finally {
      setSlotsLoading(false);
    }
  };

  // Bulk Slots Generation
  const handleGenerateSlots = async () => {
    if (!selectedStaffId || !genStart || !genEnd || genDays.length === 0) {
      toast({ title: "Error", description: "Please complete all fields and select weekdays", variant: "destructive" });
      return;
    }
    setSlotsLoading(true);
    try {
      await api.post(`/companies/my-company/staff/${selectedStaffId}/availability/generate`, {
        startDate: genStart,
        endDate: genEnd,
        daysOfWeek: genDays,
        startTime: genStartTime,
        endTime: genEndTime
      });
      toast({ title: "Success", description: "Recurring shifts generated" });
      fetchStaffAvailability(selectedStaffId);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to generate slots", variant: "destructive" });
    } finally {
      setSlotsLoading(false);
    }
  };

  // Slot Deletion
  const handleDeleteSlot = (slotId: string) => {
    setDeleteSlotId(slotId);
  };

  const confirmDeleteSlot = async () => {
    if (!deleteSlotId) return;
    setSlotsLoading(true);
    try {
      await api.delete(`/companies/my-company/availability/${deleteSlotId}`);
      toast({ title: "Deleted", description: "Shift slot removed" });
      fetchStaffAvailability(selectedStaffId);
      setDeleteSlotId(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete slot", variant: "destructive" });
      setSlotsLoading(false);
    }
  };

  const handleDayToggle = (dayNum: number) => {
    setGenDays(prev => 
      prev.includes(dayNum) ? prev.filter(d => d !== dayNum) : [...prev, dayNum]
    );
  };

  const applyShiftPreset = (start: string, end: string) => {
    setSingleStart(start);
    setSingleEnd(end);
    setGenStartTime(start);
    setGenEndTime(end);
    toast({ title: "Preset Applied", description: `${start} – ${end}` });
  };

  // Render a row of bookings with visual cards
  const renderBookingsRow = (rowBookings: any[]) => {
    return rowBookings.map((b) => {
      const date = getBookingDate(b);
      if (!date) return null;
      const hoursOffset = date.getHours() + (date.getMinutes() / 60) - START_HOUR;
      
      if (hoursOffset < -2 || hoursOffset > TOTAL_HOURS) return null;
      
      const durationHours = getBookingDurationHours(b);
      const leftPercent = Math.max(0, (hoursOffset / TOTAL_HOURS) * 100);
      const widthPercent = Math.max(7, (durationHours / TOTAL_HOURS) * 100);

      let cardStyles = "bg-primary/10 border-primary/25 text-primary hover:bg-primary/20 shadow-xs";
      if (b.status === "in_progress") {
        cardStyles = "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 shadow-xs shadow-emerald-500/10";
      } else if (b.status === "pending" || !b.assignedStaffId) {
        cardStyles = "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 shadow-xs";
      }

      return (
        <div
          key={b.id}
          onClick={() => {
            setActiveBookingId(b.id.toString());
            setDrawerOpen(true);
          }}
          className={`absolute top-2 bottom-2 rounded-xl border ${cardStyles} overflow-hidden p-2 cursor-pointer transition-all duration-200 group flex flex-col justify-between hover:scale-[1.01] hover:z-30`}
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '95px' }}
          title={`${b.customer?.fullName || "Client"} • ${b.service?.name} (${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-xs truncate leading-tight group-hover:underline">
              {b.customer?.fullName || "Customer"}
            </span>
            <span className="text-[10px] font-mono font-bold opacity-80 shrink-0">
              ${Number(b.totalPrice ?? 0).toFixed(0)}
            </span>
          </div>

          <div className="text-[11px] font-medium truncate opacity-90">
            {b.service?.name || "Service"}
          </div>

          <div className="text-[10px] font-mono font-medium opacity-80 flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* ─── EXECUTIVE SCHEDULE PULSE & CONTROL HEADER ───────────────── */}
      <div className="border-b border-border bg-card/80 px-4 sm:px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Tab Switcher */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground font-heading flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Fleet Schedule & Availability
              </h1>

              {/* Tab Selector */}
              <div className="flex items-center bg-muted/50 border border-border rounded-xl p-0.5 ml-2">
                <button 
                  onClick={() => setCurrentTab("dispatch")}
                  className={cn(
                    "h-7 px-3 rounded-lg text-xs font-bold transition-all",
                    currentTab === "dispatch" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Dispatch Timeline
                </button>
                <button 
                  onClick={() => setCurrentTab("availability")}
                  className={cn(
                    "h-7 px-3 rounded-lg text-xs font-bold transition-all",
                    currentTab === "availability" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Shifts & Roster
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Workforce capacity tracking, daily Gantt dispatch, and technician availability planning
            </p>
          </div>

          {/* Daily Fleet Capacity Pulse Strip */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Total Bookings */}
            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">Scheduled:</span>
              <span className="text-xs font-black text-foreground font-mono">
                {todaysBookings.length} Orders
              </span>
            </div>

            {/* Capacity Utilization */}
            <div className="flex items-center gap-2 bg-background border border-border/80 rounded-xl px-3 py-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-muted-foreground">Utilization:</span>
              <span className="text-xs font-black text-emerald-600 font-mono">
                {utilizationRate}% ({totalBookedHours.toFixed(1)}h)
              </span>
            </div>

            {/* Unassigned Warning */}
            <div className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 border shadow-2xs transition-all",
              unassignedBookings.length > 0 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400" 
                : "bg-background border-border/80 text-muted-foreground"
            )}>
              <span className={cn("w-2 h-2 rounded-full", unassignedBookings.length > 0 ? "bg-rose-500 animate-pulse" : "bg-muted-foreground")} />
              <span className="text-[11px] font-medium">Unassigned:</span>
              <span className="text-xs font-black font-mono">
                {unassignedBookings.length} Orders
              </span>
            </div>

            {/* Date Navigator Pill */}
            {currentTab === "dispatch" && (
              <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl p-1 shadow-2xs ml-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => changeDate(-1)} 
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <button
                  onClick={jumpToToday}
                  className="px-2.5 py-0.5 text-xs font-bold text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Click to jump to Today"
                >
                  {isSelectedDateToday ? (
                    <span className="text-primary font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Today
                    </span>
                  ) : (
                    currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                  )}
                </button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => changeDate(1)} 
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ─── TAB 1: INTERACTIVE GANTT DISPATCH TIMELINE ─────────────── */}
      {currentTab === "dispatch" ? (
        <div className="flex-1 overflow-hidden flex flex-col bg-background relative">
          {loading && (
            <div className="absolute inset-0 z-50 bg-background/60 backdrop-blur-xs flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-semibold text-muted-foreground">Loading Dispatch Timeline...</p>
              </div>
            </div>
          )}

          {/* Timeline Grid Container */}
          <div className="flex flex-1 overflow-auto relative">
            
            {/* Left Resources Sidebar */}
            <div className="w-64 border-r border-border bg-card sticky left-0 z-20 shrink-0 flex flex-col shadow-sm">
              {/* Top Corner Header */}
              <div className="h-12 border-b border-border bg-muted/40 flex items-center justify-between px-4 shrink-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" /> Field Resources
                </span>
                <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                  {staff.length} Technicians
                </span>
              </div>

              {/* Unassigned Jobs Resource Row */}
              <div className="h-28 border-b border-border bg-rose-500/5 flex items-center px-4 shrink-0 justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold text-xs text-foreground">Unassigned Queue</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Orders needing dispatch
                  </p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-black font-mono border",
                  unassignedBookings.length > 0
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                    : "bg-muted text-muted-foreground border-border"
                )}>
                  {unassignedBookings.length}
                </span>
              </div>

              {/* Staff Resource Rows */}
              {staff.map((s) => {
                const staffJobs = getStaffBookings(s.id);
                const bookedHrs = staffJobs.reduce((sum, b) => sum + getBookingDurationHours(b), 0);
                const isOnline = s.status === 'active';

                return (
                  <div 
                    key={s.id} 
                    className="h-28 border-b border-border flex items-center px-4 shrink-0 hover:bg-muted/30 transition-colors group"
                  >
                    <Avatar className="h-10 w-10 rounded-xl border border-border shadow-xs shrink-0">
                      <AvatarFallback className="font-bold text-xs bg-primary/10 text-primary">
                        {(s.user?.fullName || s.fullName)?.[0] || "T"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="ml-3 overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground truncate block group-hover:text-primary transition-colors">
                          {s.user?.fullName || s.fullName}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {bookedHrs.toFixed(1)}h
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground capitalize truncate mt-0.5">
                        {s.role || "Technician"}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn("h-2 w-2 rounded-full", isOnline ? 'bg-emerald-500' : 'bg-slate-400')} />
                        <span className="text-[10px] font-semibold text-muted-foreground capitalize">
                          {isOnline ? 'Online & Available' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Right Timeline Grid Area (7 AM - 9 PM) */}
            <div className="flex-1 relative min-w-[1200px] flex flex-col">
              
              {/* Hours Header Row */}
              <div className="h-12 border-b border-border bg-muted/40 flex shrink-0 sticky top-0 z-10">
                {hours.map((h, i) => {
                  if (i === hours.length - 1) return null;
                  return (
                    <div key={h} className="flex-1 border-r border-border/80 relative">
                      <span className="absolute -left-3.5 top-3.5 text-[11px] font-mono font-semibold text-muted-foreground select-none">
                        {h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Rows */}
              <div className="flex-1 relative">
                
                {/* Live Red "Now" Line Indicator */}
                {nowLinePercent !== null && (
                  <div 
                    className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
                    style={{ left: `${nowLinePercent}%` }}
                  >
                    <span className="px-1.5 py-0.5 bg-rose-600 text-white font-mono text-[9px] font-black rounded-full shadow-md tracking-wider -translate-y-1">
                      NOW
                    </span>
                    <div className="w-0.5 flex-1 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  </div>
                )}

                {/* Unassigned Jobs Timeline Row */}
                <div className="h-28 border-b border-border flex relative bg-rose-500/5">
                  {hours.slice(0, -1).map(h => (
                    <div key={h} className="flex-1 border-r border-border/40" />
                  ))}
                  {renderBookingsRow(unassignedBookings)}
                </div>

                {/* Staff Member Timeline Rows */}
                {staff.map((s) => (
                  <div key={s.id} className="h-28 border-b border-border flex relative bg-background hover:bg-muted/10 transition-colors">
                    {hours.slice(0, -1).map(h => (
                      <div key={h} className="flex-1 border-r border-border/40" />
                    ))}
                    {renderBookingsRow(getStaffBookings(s.id))}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB 2: SHIFTS & AVAILABILITY ROSTER ───────────────────── */
        <div className="flex-1 overflow-auto bg-background p-6">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
            
            {/* Left: Worker Shift Roster Matrix */}
            <div className="flex-1 border border-border bg-card rounded-2xl p-6 shadow-sm flex flex-col">
              
              {/* Header: Select Worker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5 mb-6">
                <div>
                  <h2 className="text-base font-bold text-foreground font-heading flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Registered Working Shifts
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    View and manage planned work shifts for each company technician
                  </p>
                </div>

                <div className="w-64">
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger className="h-9 rounded-xl border-border">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.user?.fullName || s.fullName} ({s.role || "Tech"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Shift Slots Feed */}
              <div className="flex-1 space-y-3">
                {slotsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-primary opacity-60" />
                    <p className="text-xs text-muted-foreground">Loading shifts...</p>
                  </div>
                ) : availabilitySlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/10 p-8">
                    <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm font-bold text-foreground">No shifts registered</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      This technician has no scheduled availability. Use the quick presets on the right to register upcoming shifts.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availabilitySlots.map((slot) => {
                      const sTime = slot.startTime?.split('T')[1]?.slice(0, 5) || slot.startTime?.slice(0, 5);
                      const eTime = slot.endTime?.split('T')[1]?.slice(0, 5) || slot.endTime?.slice(0, 5);
                      const dateDisplay = new Date(slot.date).toLocaleDateString([], {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      });

                      return (
                        <div 
                          key={slot.id} 
                          className="flex items-center justify-between p-4 bg-muted/20 border border-border/80 rounded-xl hover:border-primary/30 transition-all shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-bold text-foreground">
                                {dateDisplay}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{sTime} – {eTime}</span>
                            </div>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteSlot(slot.id)} 
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                            title="Remove Shift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right: Shift Creators & Presets */}
            <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
              
              {/* Quick Shift Presets */}
              <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Quick Shift Presets
                </span>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyShiftPreset("08:00", "13:00")}
                    className="p-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 text-left transition-all text-xs"
                  >
                    <p className="font-bold text-foreground">Morning</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">08:00 – 13:00 (5h)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyShiftPreset("09:00", "17:00")}
                    className="p-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 text-left transition-all text-xs"
                  >
                    <p className="font-bold text-foreground">Full Day</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">09:00 – 17:00 (8h)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyShiftPreset("13:00", "18:00")}
                    className="p-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 text-left transition-all text-xs"
                  >
                    <p className="font-bold text-foreground">Afternoon</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">13:00 – 18:00 (5h)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyShiftPreset("17:00", "21:00")}
                    className="p-2.5 rounded-xl border border-border hover:border-primary/40 bg-muted/20 text-left transition-all text-xs"
                  >
                    <p className="font-bold text-foreground">Evening</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">17:00 – 21:00 (4h)</p>
                  </button>
                </div>
              </div>

              {/* Single shift form */}
              <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-primary" />
                  Add Single Shift
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="sDate" className="text-xs font-semibold">Date</Label>
                    <Input 
                      id="sDate" 
                      type="date" 
                      value={singleDate} 
                      onChange={e => setSingleDate(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="sStart" className="text-xs font-semibold">Start Time</Label>
                      <Input 
                        id="sStart" 
                        type="time" 
                        value={singleStart} 
                        onChange={e => setSingleStart(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sEnd" className="text-xs font-semibold">End Time</Label>
                      <Input 
                        id="sEnd" 
                        type="time" 
                        value={singleEnd} 
                        onChange={e => setSingleEnd(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddSingleSlot} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-9 rounded-xl text-xs shadow-xs"
                  >
                    Register Shift
                  </Button>
                </div>
              </div>

              {/* Recurring shifts generator */}
              <div className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Generate Recurring Shifts
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="gStart" className="text-xs font-semibold">From Date</Label>
                      <Input 
                        id="gStart" 
                        type="date" 
                        value={genStart} 
                        onChange={e => setGenStart(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gEnd" className="text-xs font-semibold">To Date</Label>
                      <Input 
                        id="gEnd" 
                        type="date" 
                        value={genEnd} 
                        onChange={e => setGenEnd(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Weekdays Toggle */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Working Days</Label>
                    <div className="flex gap-1 justify-between">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDayToggle(idx)}
                          className={cn(
                            "h-8 flex-1 rounded-lg text-xs font-bold border transition-all", 
                            genDays.includes(idx) 
                              ? "bg-primary border-primary text-primary-foreground shadow-2xs" 
                              : "border-border text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {day.charAt(0)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="gStartTime" className="text-xs font-semibold">Start</Label>
                      <Input 
                        id="gStartTime" 
                        type="time" 
                        value={genStartTime} 
                        onChange={e => setGenStartTime(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="gEndTime" className="text-xs font-semibold">End</Label>
                      <Input 
                        id="gEndTime" 
                        type="time" 
                        value={genEndTime} 
                        onChange={e => setGenEndTime(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateSlots} 
                    variant="outline" 
                    className="w-full border-border hover:bg-muted font-bold h-9 rounded-xl text-xs"
                  >
                    Generate Recurring Schedule
                  </Button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ─── BOOKING DRAWER ─────────────────────────────────────────── */}
      {activeBookingId && (
        <BookingDrawer
          bookingId={activeBookingId}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            fetchScheduleData();
          }}
        />
      )}

      {/* Delete Slot Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteSlotId}
        onClose={() => setDeleteSlotId(null)}
        title="Delete Shift Slot"
        description="Are you sure you want to delete this shift slot from the staff schedule? Technicians will no longer be available for dispatch during this window."
        actionType="danger"
        confirmLabel="Delete Shift"
        onConfirm={confirmDeleteSlot}
      />
    </div>
  );
}
