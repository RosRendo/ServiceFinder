"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  QrCode,
  Star,
  MapPin,
  Sparkles,
  Gauge,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingDictionary } from "@/lib/landing-dictionary";

interface HeroSectionProps {
  lang: "kh" | "en";
  onOpenAppDownload: () => void;
}

export function HeroSection({ lang, onOpenAppDownload }: HeroSectionProps) {
  const dict = landingDictionary[lang].hero;

  const partners = [
    "PP Cleaners",
    "Angkor HVAC",
    "Sabaicode",
    "PP Logistics",
    "SmartFix",
    "Sokha Plumbing",
    "Vattanac Group",
    "Chip Mong",
    "Canadia Bank",
    "ABA Bank",
    "Zando",
    "Brown Coffee",
  ];

  const workOrders = [
    {
      id: "WO-8421",
      name: "Sokha Vireak (HVAC Senior)",
      location: "Toul Kork, St. 289 • AC Chemical Clean",
      amount: "$45.00",
      status: "Dispatched (8m)",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    },
    {
      id: "WO-8422",
      name: "Dara Chem (Licensed Electrician)",
      location: "BKK 1, St. 310 • Main Breaker Box",
      amount: "$65.00",
      status: "Settled (KHQR)",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    },
    {
      id: "WO-8423",
      name: "Piseth Mao (Master Plumber)",
      location: "Sen Sok Borey • Water Pressure Valve",
      amount: "$38.00",
      status: "In Progress",
      badgeColor: "bg-slate-700 text-slate-300 border-slate-600",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-slate-200">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-hero {
          animation: marquee 30s linear infinite;
        }
        .marquee-mask {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>

      {/* Subtle Ambient Background Radial Light */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-slate-100/80 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Clean Enterprise Messaging with Staggered Entrance */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* National Verification Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-xs"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900" />
              </span>
              <span>{dict.badge}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]"
            >
              <span className="block">{dict.titleLine1}</span>
              <span className="block text-slate-700 mt-1">{dict.titleLine2}</span>
            </motion.h1>

            {/* Subtitle / Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-500 font-semibold leading-relaxed max-w-xl"
            >
              {dict.description}
            </motion.p>

            {/* Action Buttons with Micro-interactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <Link href="/auth/register?role=company_admin&ref=hero_primary">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm uppercase tracking-wider px-8 py-3.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{dict.ctaPartner}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <a href="#services">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-lg transition-all cursor-pointer"
                  >
                    <span>{dict.ctaBookService}</span>
                  </Button>
                </motion.div>
              </a>
            </motion.div>

            {/* Clean Monochrome Gauges Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-100"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-slate-900 mb-0.5">
                  <Gauge className="h-4 w-4 text-slate-700" />
                  <span className="text-sm font-black text-slate-900">28m</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  {lang === "kh" ? "ល្បឿនជាងទៅដល់" : "Avg Arrival Time"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-slate-900 mb-0.5">
                  <QrCode className="h-4 w-4 text-slate-700" />
                  <span className="text-sm font-black text-slate-900">100%</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  {lang === "kh" ? "Bakong KHQR" : "Instant Settle"}
                </span>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-center hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-slate-900 mb-0.5">
                  <Star className="h-4 w-4 fill-slate-900 text-slate-900" />
                  <span className="text-sm font-black text-slate-900">4.9/5</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold block leading-tight">
                  {lang === "kh" ? "ការវាយតម្លៃអតិថិជន" : "Customer Score"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Premium Enterprise Cockpit with Smooth Entrance & Lift */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6"
          >
            <div
              className="relative rounded-2xl bg-slate-950 text-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-hidden border border-slate-800 transition-all hover:border-slate-700"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.98)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold tracking-wider uppercase text-white block">
                      ServiceFinder OS
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      app.servicefinder.kh/dispatch
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  <span>{lang === "kh" ? "ប្រព័ន្ធដំណើរការផ្ទាល់" : "Live Dispatch"}</span>
                </div>
              </div>

              {/* Work Orders Queue with Micro-Hover Motion */}
              <div className="space-y-2.5 text-xs">
                {workOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.35 + idx * 0.1 }}
                    whileHover={{ x: 4 }}
                    className="rounded-xl border border-white/10 bg-slate-900/80 p-3.5 backdrop-blur-sm flex items-center justify-between transition-all hover:bg-slate-900 hover:border-white/20 cursor-default"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {order.id}
                        </span>
                        <span className="font-bold text-white">{order.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>{order.location}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-white text-xs block">
                        {order.amount}
                      </span>
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${order.badgeColor}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Instant Bakong KHQR Settlement Guarantee Banner */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between text-xs backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-red-600 flex items-center justify-center text-[9px] font-black text-white shadow-xs">
                    KHQR
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">
                    National Bank of Cambodia Rails • Instant Settlement
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>Verified</span>
                </div>
              </div>

              {/* Infinite Smooth Partner Marquee Ticker with Edge Gradient Mask */}
              <div className="mt-5 w-full overflow-hidden border-y border-white/10 py-2.5 bg-black/20 marquee-mask">
                <div className="flex gap-8 w-[200%] animate-marquee-hero">
                  <div className="flex gap-8 shrink-0">
                    {partners.map((partner, idx) => (
                      <span
                        key={`h1-${idx}`}
                        className="text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap uppercase"
                      >
                        ● {partner}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-8 shrink-0">
                    {partners.map((partner, idx) => (
                      <span
                        key={`h2-${idx}`}
                        className="text-[11px] font-bold text-slate-400 tracking-wider whitespace-nowrap uppercase"
                      >
                        ● {partner}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
