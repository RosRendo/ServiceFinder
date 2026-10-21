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
import { ServiceFinderOsCard } from "@/components/landing/ServiceFinderOsCard";

interface HeroSectionProps {
  lang: "kh" | "en";
  onOpenAppDownload: () => void;
}

export function HeroSection({ lang, onOpenAppDownload }: HeroSectionProps) {
  const dict = landingDictionary[lang].hero;

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

          {/* Right Column: Premium Interactive ServiceFinder OS Live Cockpit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6"
          >
            <ServiceFinderOsCard lang={lang} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
