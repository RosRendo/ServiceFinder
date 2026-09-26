"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, PhoneCall } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

export interface ComparativeRevenueChartProps {
  teamSize: number;
  averageTicketUsd?: number;
  lang: "kh" | "en";
}

export function ComparativeRevenueChart({
  teamSize,
  averageTicketUsd = 45.0,
  lang,
}: ComparativeRevenueChartProps) {
  const dict = landingDictionary[lang].visual;

  // Traditional manual operations: 2.2 jobs/day/tech, 24 workdays
  const traditionalRevenue = useMemo(() => {
    return Math.round(teamSize * 2.2 * 24 * averageTicketUsd);
  }, [teamSize, averageTicketUsd]);

  // ServiceFinder Automated OS: 3.5 jobs/day/tech, 26 workdays
  const serviceFinderRevenue = useMemo(() => {
    return Math.round(teamSize * 3.5 * 26 * averageTicketUsd);
  }, [teamSize, averageTicketUsd]);

  const differenceRevenue = serviceFinderRevenue - traditionalRevenue;
  const upliftPercentage = Math.round(
    ((serviceFinderRevenue - traditionalRevenue) / Math.max(traditionalRevenue, 1)) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "kh" ? "ការវិភាគប្រៀបធៀបចំណូលប្រចាំខែ" : "Monthly Revenue Visual Contrast"}
          </span>
          <span className="font-heading text-base font-bold text-slate-900 mt-0.5 block">
            {teamSize} {lang === "kh" ? "ជាងបច្ចេកទេសក្នុងក្រុមហ៊ុន" : "Field Technicians"}
          </span>
        </div>
        <motion.span
          key={upliftPercentage}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white shadow-xs"
        >
          <ArrowUpRight className="h-4 w-4" />
          +{upliftPercentage}% {lang === "kh" ? "កើនឡើង" : "Uplift"}
        </motion.span>
      </div>

      {/* Visual Comparative Bars Display */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end h-56 pt-4 pb-2 px-2">
        {/* Bar 1: Traditional Operations */}
        <div className="flex flex-col items-center h-full justify-end group">
          <motion.div
            key={traditionalRevenue}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-slate-700 mb-1 tabular-nums"
          >
            ${traditionalRevenue.toLocaleString()}
          </motion.div>
          <motion.div
            initial={{ height: "0%" }}
            whileInView={{ height: "60%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="w-full max-w-[90px] rounded-t-xl bg-slate-200 border-x border-t border-slate-300 transition-colors group-hover:bg-slate-300"
          />
          <div className="text-center mt-3 space-y-0.5">
            <span className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1">
              <PhoneCall className="h-3 w-3 text-slate-400" />
              {dict.chartTraditional}
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">2.2 jobs / tech / day</span>
          </div>
        </div>

        {/* Bar 2: ServiceFinder Automated OS */}
        <div className="flex flex-col items-center h-full justify-end group">
          <motion.div
            key={serviceFinderRevenue}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-black text-slate-900 mb-1 tabular-nums flex items-center gap-1"
          >
            <span>${serviceFinderRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-bold">/ mo</span>
          </motion.div>
          <motion.div
            initial={{ height: "0%" }}
            whileInView={{ height: "95%" }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.1 }}
            className="w-full max-w-[90px] rounded-t-xl bg-slate-900 border-x border-t border-slate-900 shadow-sm"
          />
          <div className="text-center mt-3 space-y-0.5">
            <span className="text-[11px] font-black text-slate-900 flex items-center justify-center gap-1">
              <Zap className="h-3 w-3 text-slate-900" />
              {dict.chartServiceFinder}
            </span>
            <span className="text-[9px] text-slate-600 font-semibold block">3.5 jobs / tech / day</span>
          </div>
        </div>
      </div>

      {/* Difference Callout Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs transition-colors"
      >
        <span className="text-slate-700 font-medium">
          {lang === "kh"
            ? "ចំណូលបន្ថែមដែលទទួលបានតាមប្រព័ន្ធស្វ័យប្រវត្តិ"
            : "Additional monthly revenue unlocked via automated dispatch"}
        </span>
        <span className="font-black text-slate-900 text-sm tabular-nums">
          +${differenceRevenue.toLocaleString()} / mo
        </span>
      </motion.div>
    </motion.div>
  );
}
