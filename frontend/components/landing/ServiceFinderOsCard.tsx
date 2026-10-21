"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  CheckCircle2,
  Check,
  Star,
  CheckCheck,
  Navigation,
} from "lucide-react";

export interface BookingOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  serviceTitleEn: string;
  serviceTitleKh: string;
  serviceCategory: "hvac" | "electrical" | "plumbing" | "cleaning" | "solar";
  timeEn: string;
  timeKh: string;
  locationEn: string;
  locationKh: string;
  technicianName: string;
  technicianAvatar: string;
  technicianRating: number;
  amountUsd: number;
  etaMinutes: number;
  status: "matching" | "dispatched" | "en_route" | "settled";
}

const ALL_BOOKINGS: BookingOrder[] = [
  {
    id: "bo-8421",
    orderNumber: "SF-8421",
    customerName: "Sokha Chea",
    serviceTitleEn: "AC Chemical Coil Overhaul",
    serviceTitleKh: "សេវាលាងសម្អាតម៉ាស៊ីនត្រជាក់គីមី",
    serviceCategory: "hvac",
    timeEn: "Cleaning • 2:30 PM",
    timeKh: "សម្អាត • ម៉ោង ២:៣០ រសៀល",
    locationEn: "Toul Kork, St. 289",
    locationKh: "ទួលគោក, ផ្លូវ ២៨៩",
    technicianName: "Vireak S.",
    technicianAvatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.95,
    amountUsd: 45.0,
    etaMinutes: 12,
    status: "dispatched",
  },
  {
    id: "bo-8422",
    orderNumber: "SF-8422",
    customerName: "Dara Kong",
    serviceTitleEn: "3-Phase Breaker Box Inspection",
    serviceTitleKh: "ពិនិត្យប្រព័ន្ធប្រអប់ភ្លើងមេ 3-Phase",
    serviceCategory: "electrical",
    timeEn: "Repair • 3:00 PM",
    timeKh: "ជួសជុល • ម៉ោង ៣:០០ រសៀល",
    locationEn: "BKK 1, St. 310",
    locationKh: "បឹងកេងកង ១, ផ្លូវ ៣១០",
    technicianName: "Rithy P.",
    technicianAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.98,
    amountUsd: 65.0,
    etaMinutes: 0,
    status: "settled",
  },
  {
    id: "bo-8423",
    orderNumber: "SF-8423",
    customerName: "Piseth Men",
    serviceTitleEn: "Water Booster Pump Repair",
    serviceTitleKh: "ជួសជុលម៉ូទ័របូមទឹកសម្ពាធខ្ពស់",
    serviceCategory: "plumbing",
    timeEn: "Plumbing • 3:45 PM",
    timeKh: "ប្រព័ន្ធទឹក • ម៉ោង ៣:៤៥ រសៀល",
    locationEn: "Sen Sok, Borey Peng Huoth",
    locationKh: "សែនសុខ, បុរី ប៉េង ហួត",
    technicianName: "Bunnath K.",
    technicianAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.89,
    amountUsd: 38.0,
    etaMinutes: 18,
    status: "en_route",
  },
  {
    id: "bo-8424",
    orderNumber: "SF-8424",
    customerName: "Monika Seng",
    serviceTitleEn: "Emergency Inverter AC Leakage Fix",
    serviceTitleKh: "ជួសជុលបន្ទាន់ម៉ាស៊ីនត្រជាក់លេចទឹក",
    serviceCategory: "hvac",
    timeEn: "AC Repair • 4:15 PM",
    timeKh: "ជួសជុល • ម៉ោង ៤:១៥ រសៀល",
    locationEn: "Daun Penh, St. 13",
    locationKh: "ដូនពេញ, ផ្លូវ ១៣",
    technicianName: "Chhany V.",
    technicianAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.96,
    amountUsd: 40.0,
    etaMinutes: 9,
    status: "dispatched",
  },
  {
    id: "bo-8425",
    orderNumber: "SF-8425",
    customerName: "Vannak Long",
    serviceTitleEn: "Complete Villa Move-in Deep Cleaning",
    serviceTitleKh: "សេវាបោសសម្អាតវីឡាទាំងមូលមុនចូលនៅ",
    serviceCategory: "cleaning",
    timeEn: "Cleaning • 4:45 PM",
    timeKh: "សម្អាត • ម៉ោង ៤:៤៥ រសៀល",
    locationEn: "Chroy Changvar, The Flora",
    locationKh: "ជ្រោយចង្វារ, បុរី ដឹផ្លូរ៉ា",
    technicianName: "Sreypov C.",
    technicianAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.93,
    amountUsd: 85.0,
    etaMinutes: 0,
    status: "settled",
  },
  {
    id: "bo-8426",
    orderNumber: "SF-8426",
    customerName: "Sophea Yin",
    serviceTitleEn: "Kitchen Pipe Hydro-Jet Cleaning",
    serviceTitleKh: "លាងសម្អាតបំពង់ទឹកស្ទះផ្ទះបាយ",
    serviceCategory: "plumbing",
    timeEn: "Plumbing • 5:15 PM",
    timeKh: "ប្រព័ន្ធទឹក • ម៉ោង ៥:១៥ រសៀល",
    locationEn: "Chamkarmon, Russian Market",
    locationKh: "ចំការមន, តំបន់ផ្សារទួលទំពូង",
    technicianName: "Dara S.",
    technicianAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80",
    technicianRating: 4.91,
    amountUsd: 55.0,
    etaMinutes: 15,
    status: "en_route",
  },
];

interface ServiceFinderOsCardProps {
  lang: "kh" | "en";
}

export function ServiceFinderOsCard({ lang }: ServiceFinderOsCardProps) {
  const [startIndex, setStartIndex] = useState(0);

  // Auto-advance loop: shifts upward one booking every 2.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % ALL_BOOKINGS.length);
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  // 3 visible cards in the vertical cascade:
  // Slot 0 (Top): faded slightly (opacity: 0.45, scale: 0.96)
  // Slot 1 (Middle): 100% CLEAR spotlight card (opacity: 1, scale: 1, elevated shadow)
  // Slot 2 (Bottom): faded slightly (opacity: 0.45, scale: 0.96)
  const visibleBookings = [
    { ...ALL_BOOKINGS[(startIndex) % ALL_BOOKINGS.length], slot: 0 },
    { ...ALL_BOOKINGS[(startIndex + 1) % ALL_BOOKINGS.length], slot: 1 },
    { ...ALL_BOOKINGS[(startIndex + 2) % ALL_BOOKINGS.length], slot: 2 },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto py-2 select-none">
      {/* Subtle Vertical Overflow Gradient Mask */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleBookings.map((booking) => {
            const isCenterSpotlight = booking.slot === 1;

            return (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{
                  opacity: isCenterSpotlight ? 1 : 0.45,
                  y: 0,
                  scale: isCenterSpotlight ? 1 : 0.96,
                }}
                exit={{ opacity: 0, y: -16, scale: 0.92 }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`rounded-2xl border p-4 transition-shadow ${
                  isCenterSpotlight
                    ? "border-blue-500/80 bg-white shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20 z-10"
                    : "border-slate-200/80 bg-white/70 shadow-2xs z-0"
                }`}
              >
                {/* Row 1: Booking Number, Time & Status Pill */}
                <div className="flex items-center justify-between gap-2 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Booking #<span>{booking.orderNumber}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">
                      {lang === "kh" ? booking.timeKh : booking.timeEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      ${booking.amountUsd.toFixed(2)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        booking.status === "settled"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {booking.status === "settled" ? "KHQR Settled" : "Dispatched"}
                    </span>
                  </div>
                </div>

                {/* Row 2: Service Title & Location */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 truncate">
                    {lang === "kh" ? booking.serviceTitleKh : booking.serviceTitleEn}
                  </span>
                  <span className="flex items-center gap-0.5 text-slate-400 shrink-0 text-[11px]">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{lang === "kh" ? booking.locationKh : booking.locationEn}</span>
                  </span>
                </div>

                {/* Row 3: Assigned Pro & Real-Time Arrival / Settlement Status */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={booking.technicianAvatar}
                      alt={booking.technicianName}
                      className="w-4.5 h-4.5 rounded-full object-cover border border-slate-200"
                    />
                    <span className="font-semibold text-slate-700">
                      {booking.technicianName}
                    </span>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center">
                      ★ {booking.technicianRating}
                    </span>
                  </div>

                  <div className="text-[10.5px]">
                    {booking.status === "settled" ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Bakong KHQR Settled</span>
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium">
                        Arriving in {booking.etaMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
