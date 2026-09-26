"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  XCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";

// --- Types ---
type BookingStatus = "confirmed" | "pending" | "in_progress" | "completed" | "cancelled";

interface CalendarBooking {
  id: string;
  day: number;
  startTime: string;
  customer: string;
  customerAvatar?: string;
  service: string;
  staff: string;
  status: BookingStatus;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  pending:     "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled:   "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const STATUS_DOT: Record<BookingStatus, string> = {
  confirmed:   "bg-blue-500",
  pending:     "bg-amber-500",
  in_progress: "bg-primary",
  completed:   "bg-emerald-500",
  cancelled:   "bg-rose-500",
};

// --- Helpers ---
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// --- Components ---
function BookingPill({ booking, onOpen }: { booking: CalendarBooking; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(booking.id)}
      className={cn(
        "block w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded-lg border truncate hover:scale-[1.02] transition-transform shadow-sm",
        STATUS_STYLES[booking.status]
      )}
      title={`${booking.startTime} · ${booking.customer || 'Customer'} · ${booking.service}`}
    >
      {booking.startTime} · {(booking.customer || "Customer").split(" ")[0]}
    </button>
  );
}

function DayDetailPanel({ bookings, onOpen }: { bookings: CalendarBooking[]; onOpen: (id: string) => void }) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="w-12 h-12 bg-muted/50 border border-border rounded-lg flex items-center justify-center mb-4">
          <CalendarIcon className="w-6 h-6 opacity-40 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No bookings scheduled</p>
      </div>
    );
  }
  return (
    <div className="space-y-4 pr-2">
      <AnimatePresence>
        {bookings.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              onClick={() => onOpen(b.id)}
              className="block w-full text-left p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-background group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-primary transition-colors" />
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-semibold text-foreground text-sm">{b.service}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", STATUS_STYLES[b.status])}>
                  {b.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 rounded-full border border-border">
                  <AvatarImage src={b.customerAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">{b.customer.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> {b.customer}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {b.startTime}
                  </div>
                </div>
              </div>
              {b.staff && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground font-medium">Assigned To</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{b.staff}</span>
                </div>
              )}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Main Page ---
export default function DispatchCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [panelSearch, setPanelSearch] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/bookings');
        const payload = res.data.data || res.data;
        const allBookings = payload.bookings || [];
        
        const formatted: CalendarBooking[] = allBookings.map((b: any) => ({
          id: b.id,
          day: new Date(b.bookingDate).getDate(),
          startTime: new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customer: b.customer?.fullName || "Unknown",
          customerAvatar: b.customer?.avatar,
          service: b.service?.name || "Service",
          staff: b.assignedStaff?.fullName || null,
          status: b.status as BookingStatus,
        }));

        setBookings(formatted);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError("Failed to load calendar data.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [month, year]);

  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);
  const allCells = Array.from({ length: startOffset + totalDays }, (_, i) =>
    i < startOffset ? null : i - startOffset + 1
  );

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const handleOpenDrawer = (id: string) => {
    setActiveBookingId(id);
    setDrawerOpen(true);
  };

  const bookingsForDay = (day: number) => bookings.filter((b) => b.day === day);
  const selectedDayBookingsRaw = selectedDay ? bookingsForDay(selectedDay) : [];
  
  const selectedDayBookings = selectedDayBookingsRaw.filter(b => {
    if (!panelSearch) return true;
    const q = panelSearch.toLowerCase();
    return b.customer.toLowerCase().includes(q) || 
           b.service.toLowerCase().includes(q) || 
           (b.staff && b.staff.toLowerCase().includes(q));
  });

  const totalBookings = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto space-y-6 flex flex-col">
        {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Dispatch Calendar</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Visual overview of scheduled jobs and assignments</p>
        </div>
        <Link href="/company/bookings">
          <Button variant="outline" className="flex items-center gap-2 h-9 px-4">
            <List className="w-4 h-4" /> 
            <span className="hidden sm:inline">List View</span>
          </Button>
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {[
          { label: "Total Bookings", value: totalBookings, icon: CalendarIcon, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
          { label: "Confirmed", value: confirmed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Pending", value: pending, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map((s, i) => (
          <motion.div 
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-background border border-border rounded-xl p-4 flex flex-col shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 bg-background rounded-2xl border border-border shadow-sm flex items-center justify-center min-h-[400px]">
           <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
        </div>
      ) : error ? (
         <div className="flex-1 bg-background rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center gap-4 min-h-[400px]">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-2 border border-rose-500/20">
              <XCircle className="w-8 h-8" />
            </div>
            <p className="text-foreground font-semibold text-lg">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="rounded-lg h-10 px-6 mt-2">Try Again</Button>
         </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 bg-background border border-border rounded-2xl shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
              <h2 className="text-lg font-bold text-foreground">
                {MONTHS[month]} <span className="text-muted-foreground font-medium">{year}</span>
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goPrev} className="h-8 w-8 rounded-lg border-border bg-background hover:bg-muted/60 text-foreground transition-colors shadow-none">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goNext} className="h-8 w-8 rounded-lg border-border bg-background hover:bg-muted/60 text-foreground transition-colors shadow-none">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/30">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest py-2.5">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 bg-border gap-px p-px">
              {allCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="bg-background min-h-[100px]" />;
                }
                const dayBks = bookingsForDay(day);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={cn(
                      "bg-background min-h-[100px] p-2 flex flex-col text-left transition-all relative group",
                      "hover:bg-muted/30",
                      isSelected && "ring-2 ring-violet-500 ring-inset z-10",
                      isToday && !isSelected && "bg-primary/5"
                    )}
                  >
                    {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
                    <span className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-2 transition-colors",
                      isToday ? "bg-primary text-white mt-1" : 
                      isSelected ? "bg-foreground text-background" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      {day}
                    </span>
                    <div className="space-y-1 w-full mt-auto">
                      {dayBks.slice(0, 3).map((b) => (
                        <BookingPill key={b.id} booking={b} onOpen={handleOpenDrawer} />
                      ))}
                      {dayBks.length > 3 && (
                        <div className="text-[10px] font-bold text-muted-foreground text-center bg-muted/50 rounded-md py-0.5 border border-border">
                          +{dayBks.length - 3} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 p-4 border-t border-border bg-muted/20 shrink-0">
              {(Object.entries(STATUS_DOT) as [BookingStatus, string][]).map(([status, dot]) => (
                <div key={status} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  {status.replace("_", " ")}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Day panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 bg-background border border-border rounded-2xl shadow-sm flex flex-col max-h-[700px]"
          >
            <div className="p-5 border-b border-border bg-muted/20 shrink-0">
              <h3 className="text-lg font-bold text-foreground">
                {selectedDay ? `${MONTHS[month]} ${selectedDay}` : "Daily Schedule"}
              </h3>
              <p className="text-xs font-medium text-muted-foreground mt-1">
                {selectedDay
                  ? `${selectedDayBookingsRaw.length} booking${selectedDayBookingsRaw.length !== 1 ? "s" : ""} scheduled`
                  : "Select a day to view bookings"}
              </p>
              
              {selectedDay && selectedDayBookingsRaw.length > 0 && (
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={panelSearch}
                    onChange={(e) => setPanelSearch(e.target.value)}
                    placeholder="Search bookings..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-md outline-none focus:border-primary/60 placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {selectedDay ? (
                <DayDetailPanel bookings={selectedDayBookings} onOpen={handleOpenDrawer} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                  <div className="w-16 h-16 bg-muted/50 border border-border rounded-2xl flex items-center justify-center mb-4">
                    <CalendarIcon className="w-8 h-8 opacity-40" />
                  </div>
                  <p className="text-sm font-bold text-foreground">No date selected</p>
                  <p className="text-xs font-medium mt-1 text-center max-w-[200px]">Click any date on the calendar to see its scheduled jobs.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} bookingId={activeBookingId} />
      </div>
    </div>
  );
}


