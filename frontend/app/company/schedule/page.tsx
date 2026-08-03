"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api/client";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function getBookingDate(b: any): Date | null {
  if (b.bookingDate && b.startTime) {
    const d = new Date(b.bookingDate);
    const [h, m] = b.startTime.split(':');
    d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    return d;
  }
  if (b.scheduledAt) return new Date(b.scheduledAt);
  return null;
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
  
  // Single availability slot states
  const [singleDate, setSingleDate] = useState("");
  const [singleStart, setSingleStart] = useState("09:00");
  const [singleEnd, setSingleEnd] = useState("17:00");
  
  // Generate availabilities states
  const [genStart, setGenStart] = useState("");
  const [genEnd, setGenEnd] = useState("");
  const [genStartTime, setGenStartTime] = useState("09:00");
  const [genEndTime, setGenEndTime] = useState("17:00");
  const [genDays, setGenDays] = useState<number[]>([]); // 0=Sun, 6=Sat

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
      toast({ title: "Error", description: "Failed to load availability slots", variant: "destructive" });
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

  const unassignedBookings = todaysBookings.filter(b => !b.assignedStaffId);
  const getStaffBookings = (staffId: string) => todaysBookings.filter(b => b.assignedStaffId?.toString() === staffId.toString());

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

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
      toast({ title: "Success", description: "Shift slot added" });
      fetchStaffAvailability(selectedStaffId);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to add slot", variant: "destructive" });
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
      toast({ title: "Success", description: "Slots generated successfully" });
      fetchStaffAvailability(selectedStaffId);
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to generate slots", variant: "destructive" });
    } finally {
      setSlotsLoading(false);
    }
  };

  // Slot Deletion
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Delete this shift slot?")) return;
    setSlotsLoading(true);
    try {
      await api.delete(`/companies/my-company/availability/${slotId}`);
      toast({ title: "Success", description: "Shift slot deleted" });
      fetchStaffAvailability(selectedStaffId);
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

  // Render a row of bookings
  const renderBookingsRow = (rowBookings: any[]) => {
    return rowBookings.map(b => {
      const date = getBookingDate(b);
      if (!date) return null;
      const hoursOffset = date.getHours() + (date.getMinutes() / 60) - START_HOUR;
      
      if (hoursOffset < -2 || hoursOffset > TOTAL_HOURS) return null;
      
      const durationHours = 1.5; 
      const leftPercent = Math.max(0, (hoursOffset / TOTAL_HOURS) * 100);
      const widthPercent = (durationHours / TOTAL_HOURS) * 100;

      let colorClass = "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20";
      if (b.status === "in_progress") colorClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20";
      if (b.status === "pending" || !b.assignedStaffId) colorClass = "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20";

      return (
        <div
          key={b.id}
          onClick={() => {
            setActiveBookingId(b.id.toString());
            setDrawerOpen(true);
          }}
          className={`absolute top-2 bottom-2 rounded-md border ${colorClass} shadow-sm overflow-hidden p-1.5 cursor-pointer transition-colors group`}
          style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, minWidth: '80px' }}
        >
          <div className="font-semibold text-xs truncate leading-tight group-hover:underline">
            {b.customer?.fullName || "Customer"}
          </div>
          <div className="text-[10px] truncate opacity-80 mt-0.5">
            {b.service?.name || "Service"}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5 flex items-center">
            <Clock className="w-3 h-3 mr-1 inline-block shrink-0" />
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-border bg-background">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Schedule & Availability</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Plan staff shifts and view dispatched bookings.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-xl p-1 shrink-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentTab("dispatch")}
            className={cn("h-8 px-3 rounded-lg text-xs font-semibold", currentTab === "dispatch" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Dispatch Timeline
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCurrentTab("availability")}
            className={cn("h-8 px-3 rounded-lg text-xs font-semibold", currentTab === "availability" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          >
            Shifts & Availability
          </Button>
        </div>
      </div>

      {currentTab === "dispatch" ? (
        <div className="flex-1 overflow-hidden flex flex-col bg-background relative">
          {loading && (
            <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          
          <div className="shrink-0 flex justify-end p-4 border-b border-border bg-muted/10">
            <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-1">
              <Button variant="ghost" size="sm" onClick={() => changeDate(-1)} className="hover:bg-muted/60 text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="w-40 text-center font-medium text-xs text-foreground">
                {currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => changeDate(1)} className="hover:bg-muted/60 text-muted-foreground hover:text-foreground h-8 w-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Timeline Grid */}
          <div className="flex flex-1 overflow-auto relative">
            <div className="w-56 border-r border-border bg-background sticky left-0 z-20 shrink-0 flex flex-col">
              <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</span>
              </div>
              <div className="h-24 border-b border-border bg-muted/30 flex items-center px-4 shrink-0">
                <div>
                  <span className="font-semibold text-sm text-foreground block">Unassigned Jobs</span>
                  <span className="text-xs text-amber-500 font-medium">{unassignedBookings.length} pending</span>
                </div>
              </div>
              {staff.map(s => (
                <div key={s.id} className="h-24 border-b border-border flex items-center px-4 shrink-0 hover:bg-muted/30 transition-colors group">
                  <div className="h-10 w-10 rounded-full bg-primary/100/10 flex items-center justify-center text-primary font-bold shrink-0 border border-violet-500/20">
                    {s.user?.fullName?.[0] || "?"}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <span className="font-semibold text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                      {s.user?.fullName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`h-2 w-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-muted/500'}`}></span>
                      <span className="text-xs text-muted-foreground capitalize">{s.status || 'offline'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex-1 relative min-w-[1000px] flex flex-col">
              <div className="h-12 border-b border-border bg-muted/30 flex shrink-0 top-0 z-10">
                {hours.map((h, i) => {
                  if (i === hours.length - 1) return null;
                  return (
                    <div key={h} className="flex-1 border-r border-border relative">
                      <span className="absolute -left-3 top-3 text-[10px] font-semibold text-muted-foreground">
                        {h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 relative">
                <div className="h-24 border-b border-border flex relative bg-muted/30">
                  {hours.slice(0,-1).map(h => <div key={h} className="flex-1 border-r border-border/40"></div>)}
                  {renderBookingsRow(unassignedBookings)}
                </div>
                {staff.map(s => (
                  <div key={s.id} className="h-24 border-b border-border flex relative">
                    {hours.slice(0,-1).map(h => <div key={h} className="flex-1 border-r border-border/40"></div>)}
                    {renderBookingsRow(getStaffBookings(s.id))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Availability Planner View
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-background relative p-6 gap-6">
          {slotsLoading && (
            <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Left panel: select staff & list slots */}
          <div className="flex-1 border border-border bg-card rounded-xl p-5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
              <div className="w-64">
                <Label className="text-xs">Select Worker</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.user?.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="text-xs text-muted-foreground font-semibold">{availabilitySlots.length} active shifts</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {availabilitySlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl">
                  <Clock className="w-8 h-8 text-muted/50 mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground">No shift slots planned</p>
                  <p className="text-xs text-muted-foreground/75 mt-0.5">Use the scheduler to assign shift times</p>
                </div>
              ) : (
                availabilitySlots.map((slot) => {
                  const sTime = slot.startTime?.split('T')[1]?.slice(0, 5) || slot.startTime?.slice(0, 5);
                  const eTime = slot.endTime?.split('T')[1]?.slice(0, 5) || slot.endTime?.slice(0, 5);
                  return (
                    <div key={slot.id} className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {new Date(slot.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sTime} – {eTime}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Add shift panels */}
          <div className="w-full md:w-[360px] flex flex-col gap-5 shrink-0">
            {/* Single shift */}
            <div className="border border-border bg-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-primary" />
                Add Single Shift
              </h3>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="sDate" className="text-xs">Date</Label>
                  <Input id="sDate" type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="sStart" className="text-xs">Start Time</Label>
                    <Input id="sStart" type="time" value={singleStart} onChange={e => setSingleStart(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="sEnd" className="text-xs">End Time</Label>
                    <Input id="sEnd" type="time" value={singleEnd} onChange={e => setSingleEnd(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleAddSingleSlot} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-9">
                  Add Shift
                </Button>
              </div>
            </div>

            {/* Recurring shifts generator */}
            <div className="border border-border bg-card rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-primary" />
                Generate Recurring Shifts
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="gStart" className="text-xs">From Date</Label>
                    <Input id="gStart" type="date" value={genStart} onChange={e => setGenStart(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gEnd" className="text-xs">To Date</Label>
                    <Input id="gEnd" type="date" value={genEnd} onChange={e => setGenEnd(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Working Weekdays</Label>
                  <div className="flex gap-1 justify-between">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        className={cn("h-7 w-7 rounded-md text-xs font-bold border transition-colors", 
                          genDays.includes(idx) 
                            ? "bg-primary border-violet-600 text-white" 
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="gStartTime" className="text-xs">Start Time</Label>
                    <Input id="gStartTime" type="time" value={genStartTime} onChange={e => setGenStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="gEndTime" className="text-xs">End Time</Label>
                    <Input id="gEndTime" type="time" value={genEndTime} onChange={e => setGenEndTime(e.target.value)} />
                  </div>
                </div>

                <Button onClick={handleGenerateSlots} variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10 font-bold h-9">
                  Generate Shifts
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

