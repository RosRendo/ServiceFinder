"use client";
import { useState, useEffect, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/client";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [staff, setStaff] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const [staffRes, bookingsRes] = await Promise.all([
        api.get('/companies/my-company/staff'),
        api.get('/bookings?limit=200&status=pending,confirmed,in_progress') // Fetch active bookings to map
      ]);
      const sData = staffRes.data.data || staffRes.data;
      setStaff(Array.isArray(sData) ? sData : sData.staff || []);
      
      const bData = bookingsRes.data.data || bookingsRes.data;
      setBookings(bData.bookings || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load schedule data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, []);

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

  // Render a row of bookings
  const renderBookingsRow = (rowBookings: any[]) => {
    return rowBookings.map(b => {
      const date = getBookingDate(b);
      if (!date) return null;
      const hoursOffset = date.getHours() + (date.getMinutes() / 60) - START_HOUR;
      
      // If outside the visible timeline, don't render it or clip it
      if (hoursOffset < -2 || hoursOffset > TOTAL_HOURS) return null;
      
      // Default duration is 1.5 hours if not specified
      const durationHours = 1.5; 
      
      const leftPercent = Math.max(0, (hoursOffset / TOTAL_HOURS) * 100);
      const widthPercent = (durationHours / TOTAL_HOURS) * 100;

      let colorClass = "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20";
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
          <div className="font-medium text-xs truncate leading-tight group-hover:underline">
            {b.customer?.fullName || "Customer"}
          </div>
          <div className="text-[10px] truncate opacity-80 mt-0.5">
            {b.service?.title || "Service"}
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-violet-500" />
            Schedule Center
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Visually route and manage your staff assignments for the day.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg p-1">
          <Button variant="ghost" size="sm" onClick={() => changeDate(-1)} className="hover:bg-muted/60 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-40 text-center font-medium text-sm text-foreground">
            {currentDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Button variant="ghost" size="sm" onClick={() => changeDate(1)} className="hover:bg-muted/60 text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-background relative">
        {loading && (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        )}
        
        {/* Timeline Container */}
        <div className="flex flex-1 overflow-auto relative">
          
          {/* Left Column (Resource List) */}
          <div className="w-56 border-r border-border bg-background sticky left-0 z-20 shrink-0 flex flex-col">
            <div className="h-12 border-b border-border bg-muted/30 flex items-center px-4 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resources</span>
            </div>
            
            <div className="h-24 border-b border-border bg-amber-500/5 flex items-center px-4 shrink-0">
              <div>
                <span className="font-semibold text-sm text-foreground block">Unassigned Jobs</span>
                <span className="text-xs text-amber-500 font-medium">{unassignedBookings.length} pending</span>
              </div>
            </div>
            
            {staff.map(s => (
              <div key={s.id} className="h-24 border-b border-border flex items-center px-4 shrink-0 hover:bg-muted/30 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 font-bold shrink-0 border border-violet-500/20">
                  {s.user?.fullName?.[0] || "?"}
                </div>
                <div className="ml-3 overflow-hidden">
                  <span className="font-semibold text-sm text-foreground truncate block group-hover:text-violet-500 transition-colors">
                    {s.user?.fullName}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-2 w-2 rounded-full ${s.user?.status === 'online' ? 'bg-emerald-500' : s.user?.status === 'on_job' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
                    <span className="text-xs text-muted-foreground capitalize">{(s.user?.status || s.status || 'offline').replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right Column (Time Grid) */}
          <div className="flex-1 relative min-w-[1000px] flex flex-col">
            {/* Time Headers */}
            <div className="h-12 border-b border-border bg-muted/30 flex shrink-0 sticky top-0 z-10">
              {hours.map((h, i) => {
                if (i === hours.length - 1) return null; // Skip last header for perfect grid
                return (
                  <div key={h} className="flex-1 border-r border-border relative">
                    <span className="absolute -left-3 top-3 text-xs font-medium text-muted-foreground">
                      {h > 12 ? `${h-12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 relative">
              
              {/* Unassigned Row background lines */}
              <div className="h-24 border-b border-border flex relative bg-amber-500/5">
                {hours.slice(0,-1).map(h => <div key={h} className="flex-1 border-r border-border/40"></div>)}
                {renderBookingsRow(unassignedBookings)}
              </div>

              {/* Staff Rows */}
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

      {activeBookingId && (
        <BookingDrawer
          bookingId={activeBookingId}
          open={drawerOpen}
          onOpenChange={(o) => {
             setDrawerOpen(o);
             if (!o) fetchScheduleData();
          }}
        />
      )}
    </div>
  );
}
