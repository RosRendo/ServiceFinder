"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Plus,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar as CalendarIcon,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  in_progress: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  completed:   "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled:   "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

const STATUS_DOT: Record<BookingStatus, string> = {
  confirmed:   "bg-blue-500",
  pending:     "bg-amber-500",
  in_progress: "bg-indigo-500",
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
function BookingPill({ booking }: { booking: CalendarBooking }) {
  return (
    <Link
      href={`/company/bookings/${booking.id}`}
      className={cn(
        "block text-[10px] font-bold px-1.5 py-0.5 rounded-lg border truncate hover:scale-[1.02] transition-transform shadow-sm",
        STATUS_STYLES[booking.status]
      )}
      title={`${booking.startTime} · ${booking.customer} · ${booking.service}`}
    >
      {booking.startTime} · {booking.customer.split(" ")[0]}
    </Link>
  );
}

function DayDetailPanel({ day, month, year, bookings }: {
  day: number; month: number; year: number; bookings: CalendarBooking[];
}) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center mb-4">
          <CalendarIcon className="w-6 h-6 opacity-40 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">No bookings scheduled</p>
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
            <Link
              href={`/company/bookings/${b.id}`}
              className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gray-100 group-hover:bg-blue-500 transition-colors" />
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-semibold text-gray-900 text-sm">{b.service}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", STATUS_STYLES[b.status])}>
                  {b.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 rounded-lg border border-slate-200">
                  <AvatarImage src={b.customerAvatar} />
                  <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">{b.customer.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {b.customer}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> {b.startTime}
                  </div>
                </div>
              </div>
              {b.staff && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 font-medium">Assigned To</span>
                  <span className="text-xs font-semibold text-primary bg-primary/5 px-2 py-0.5 rounded-md">{b.staff}</span>
                </div>
              )}
            </Link>
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

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/bookings');
        const payload = res.data.data || res.data;
        const allBookings = payload.bookings || [];
        
        // Transform backend format to CalendarBooking
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
  }, [month, year]); // Could refetch if month/year changes if API supported it

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

  const bookingsForDay = (day: number) => bookings.filter((b) => b.day === day);
  const selectedDayBookings = selectedDay ? bookingsForDay(selectedDay) : [];

  const totalBookings = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dispatch Calendar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visual overview of scheduled jobs and assignments</p>
          </div>
          <Link href="/company/bookings">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">
              <List className="w-4 h-4" /> 
              <span className="hidden sm:inline">List View</span>
            </button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          {[
            { label: "Total Bookings", value: totalBookings, icon: CalendarIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Confirmed", value: confirmed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Pending", value: pending, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s, i) => (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm flex items-center justify-center h-[500px]">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
           <div className="bg-white rounded-md border border-slate-200 p-12 shadow-sm flex flex-col items-center justify-center h-[500px] gap-4">
              <div className="w-16 h-16 bg-rose-50 rounded-md flex items-center justify-center text-rose-500 mb-2">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="text-rose-600 font-semibold text-lg">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="rounded-md px-8 h-11 bg-white/80">Try Again</Button>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calendar grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">
                  {MONTHS[month]} <span className="text-gray-500 font-medium">{year}</span>
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={goPrev} className="h-8 w-8 rounded-md border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goNext} className="h-8 w-8 rounded-md border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider py-2">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 flex-1 bg-gray-100 gap-px p-px">
                {allCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="bg-white min-h-[120px]" />;
                  }
                  const dayBks = bookingsForDay(day);
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isSelected = day === selectedDay;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                      className={cn(
                        "bg-white min-h-[120px] p-2 text-left transition-all relative group",
                        "hover:bg-gray-50",
                        isSelected && "ring-2 ring-blue-500 ring-inset z-10",
                        isToday && !isSelected && "bg-blue-50/30"
                      )}
                    >
                      {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />}
                      <span className={cn(
                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 transition-colors",
                        isToday ? "bg-blue-500 text-white mt-1" : 
                        isSelected ? "bg-gray-900 text-white" : "text-gray-500"
                      )}>
                        {day}
                      </span>
                      <div className="space-y-1">
                        {dayBks.slice(0, 3).map((b) => (
                          <BookingPill key={b.id} booking={b} />
                        ))}
                        {dayBks.length > 3 && (
                          <div className="text-[10px] font-bold text-slate-400 text-center bg-gray-50 rounded-md py-0.5 border border-gray-200">
                            +{dayBks.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 p-4 border-t border-gray-100 bg-white">
                {(Object.entries(STATUS_DOT) as [BookingStatus, string][]).map(([status, dot]) => (
                  <div key={status} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
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
              className="lg:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col max-h-[800px]"
            >
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedDay ? `${MONTHS[month]} ${selectedDay}` : "Daily Schedule"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedDay
                    ? `${selectedDayBookings.length} booking${selectedDayBookings.length !== 1 ? "s" : ""} scheduled`
                    : "Select a day to view bookings"}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedDay ? (
                  <DayDetailPanel
                    day={selectedDay}
                    month={month}
                    year={year}
                    bookings={selectedDayBookings}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <CalendarIcon className="w-8 h-8 opacity-30 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">No date selected</p>
                    <p className="text-sm mt-1 text-center max-w-[200px]">Click any date on the calendar to see its scheduled jobs.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

