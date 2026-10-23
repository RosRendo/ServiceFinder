"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  QrCode,
  Star,
  Gauge
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { ServiceFinderOsCard } from "@/components/landing/ServiceFinderOsCard";

interface HeroSectionProps {
  lang: "kh" | "en";
  onOpenAppDownload: () => void;
}

export function HeroSection({ lang, onOpenAppDownload }: HeroSectionProps) {
  const dict = landingDictionary[lang].hero;

  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-zinc-200/80">
      {/* Subtle Architectural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Clean Enterprise Messaging */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* National Verification Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-xs font-mono text-zinc-700 shadow-2xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{dict.badge}</span>
            </motion.div>

            {/* Main Headline: Consumer-First */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-950 tracking-tight leading-[1.08]"
            >
              <span className="block">{dict.homeTitleLine1}</span>
              <span className="block text-zinc-600 mt-1">{dict.homeTitleLine2}</span>
            </motion.h1>

            {/* Subtitle / Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-600 font-normal leading-relaxed max-w-xl"
            >
              {dict.description}
            </motion.p>

            {/* Secondary B2B Value Prop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/80 px-3.5 py-1.5 text-xs text-zinc-600"
            >
              <Building2 className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span>{dict.forCompaniesLead}</span>
              <Link
                href="/auth/register?role=company_admin&ref=hero_secondary"
                className="text-zinc-950 hover:text-zinc-700 font-semibold transition-colors flex items-center gap-1"
              >
                <span>{dict.titleLine1}</span>
                <ArrowUpRight className="h-3 w-3 text-zinc-400" />
              </Link>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
            >
              <a
                href="#services"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs px-6 py-3.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>{dict.ctaBookService}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
              </a>
              <Link
                href="/auth/register?role=company_admin&ref=hero_secondary"
                className="w-full sm:w-auto inline-flex items-center justify-center border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 font-medium text-xs px-5 py-3.5 rounded-full transition-all cursor-pointer"
              >
                <span>{dict.ctaPartner}</span>
              </Link>
            </motion.div>

            {/* Clean Monochrome Gauges Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 grid grid-cols-3 gap-3 border-t border-zinc-100"
            >
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-zinc-950 mb-0.5">
                  <Gauge className="h-3.5 w-3.5 text-zinc-700" />
                  <span className="text-sm font-bold text-zinc-950 font-mono">28m</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium block leading-[1.35]">
                  {lang === "kh" ? "ល្បឿនជាងទៅដល់" : "Avg Arrival Time"}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-zinc-950 mb-0.5">
                  <QrCode className="h-3.5 w-3.5 text-zinc-700" />
                  <span className="text-sm font-bold text-zinc-950 font-mono">100%</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium block leading-[1.35]">
                  {lang === "kh" ? "Bakong KHQR" : "Instant Settle"}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 text-center hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-center gap-1 text-zinc-950 mb-0.5">
                  <Star className="h-3.5 w-3.5 fill-zinc-950 text-zinc-950" />
                  <span className="text-sm font-bold text-zinc-950 font-mono">4.9/5</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium block leading-[1.35]">
                  {lang === "kh" ? "ការវាយតម្លៃអតិថិជន" : "Customer Score"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Premium Interactive ServiceFinder OS Live Cockpit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="lg:col-span-6"
          >
            <ServiceFinderOsCard lang={lang} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
