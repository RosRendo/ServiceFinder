"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, TrendingUp, DollarSign, CalendarCheck, Clock, ArrowRight, Sparkles, CheckCircle2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingDictionary } from "@/lib/landing-dictionary";
import { ComparativeRevenueChart } from "@/components/landing/ComparativeRevenueChart";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";

export interface PartnerRoiInput {
  teamSize?: number;
  averageTicketUsd?: number;
  jobsPerDayPerTech?: number;
  workDaysPerMonth?: number;
}

export interface PartnerRoiOutput {
  monthlyJobCapacity: number;
  monthlyGrossRevenue: number;
  estimatedNetGrowth: number;
  annualRevenueUplift: number;
  timeSavedHoursPerMonth: number;
}

export function computePartnerRoi({
  teamSize = 5,
  averageTicketUsd = 45.0,
  jobsPerDayPerTech = 3.5,
  workDaysPerMonth = 26,
}: PartnerRoiInput = {}): PartnerRoiOutput {
  const monthlyJobCapacity = Math.round(teamSize * jobsPerDayPerTech * workDaysPerMonth);
  const monthlyGrossRevenue = Math.round(monthlyJobCapacity * averageTicketUsd);
  const estimatedNetGrowth = Math.round(monthlyGrossRevenue * 0.35);
  const annualRevenueUplift = estimatedNetGrowth * 12;
  const timeSavedHoursPerMonth = Math.round(teamSize * 18);

  return {
    monthlyJobCapacity,
    monthlyGrossRevenue,
    estimatedNetGrowth,
    annualRevenueUplift,
    timeSavedHoursPerMonth,
  };
}

interface PartnerRoiCalculatorProps {
  lang: "kh" | "en";
  initialTeamSize?: number;
}

export function PartnerRoiCalculator({ lang, initialTeamSize = 5 }: PartnerRoiCalculatorProps) {
  const [teamSize, setTeamSize] = useState(initialTeamSize);
  const dict = landingDictionary[lang].calculator;

  const result = computePartnerRoi({ teamSize });

  return (
    <section id="for-business" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <TrendingUp className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </FadeInView>

        {/* Visual ROI Section: Controls & Comparative Bar Chart */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <FadeInView direction="left" className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="team-size-slider" className="text-sm font-semibold text-slate-900">
                    {dict.teamSizeLabel}
                  </label>
                  <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-3 py-1 text-sm font-black text-slate-900">
                    {teamSize} {dict.teamSizeUnit}
                  </span>
                </div>
                <input
                  id="team-size-slider"
                  type="range"
                  min="1"
                  max="50"
                  step="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 focus:outline-none"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>1 {dict.techniciansCount}</span>
                  <span>25</span>
                  <span>50 {dict.techniciansCount}</span>
                </div>
              </div>

              {/* Verified Baseline Market Inputs */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{dict.avgTicketLabel}</span>
                  <span className="font-semibold text-slate-900">{dict.avgTicketValue}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {lang === "kh" ? "អត្រាការងារជាមធ្យម" : "Average Daily Velocity"}
                  </span>
                  <span className="font-semibold text-slate-900">3.5 jobs / tech / day</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {lang === "kh" ? "ថ្ងៃធ្វើការក្នុងមួយខែ" : "Operating Workdays"}
                  </span>
                  <span className="font-semibold text-slate-900">26 days / month</span>
                </div>
              </div>

              {/* Direct Partner Benefits List */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>{lang === "kh" ? "ទូទាត់ប្រាក់ភ្លាមៗតាម Bakong KHQR" : "Instant settlement via Bakong KHQR"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>{lang === "kh" ? "៣ ចុចចាត់ចែងការងារតាមទីតាំង GPS" : "3-click smart dispatch with live GPS"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                  <span>{lang === "kh" ? "គ្មានកិច្ចសន្យាចងភ្ជាប់ ឬថ្លៃសេវាបង់មុន" : "Zero upfront software license fees"}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Link href={`/auth/register?role=company_admin&ref=landing_calculator&teamSize=${teamSize}`}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                    <span>{dict.ctaButton}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                {dict.disclaimer}
              </p>
            </div>
          </FadeInView>

          {/* Results Projection Column with Dynamic Comparative Chart */}
          <FadeInView direction="right" delay={0.15} className="lg:col-span-7 space-y-6">
            {/* Visual Dynamic Bar Chart */}
            <ComparativeRevenueChart teamSize={teamSize} averageTicketUsd={45.0} lang={lang} />

            {/* Micro Metric Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Job Capacity */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {dict.monthlyJobCapacity}
                  </span>
                  <CalendarCheck className="h-4 w-4 text-slate-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {result.monthlyJobCapacity.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500"> jobs</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {lang === "kh"
                    ? `សមត្ថភាពការងាររបស់ជាង ${teamSize} នាក់`
                    : `Monthly booking capacity for ${teamSize} techs`}
                </p>
              </motion.div>

              {/* Annual Net Uplift */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-300 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    {dict.annualRevenueUplift}
                  </span>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-black text-white tracking-tight">
                  +${result.annualRevenueUplift.toLocaleString()}
                  <span className="text-xs font-normal text-slate-400"> / yr</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2">
                  {lang === "kh"
                    ? `សន្សំសំចៃពេលចាត់ចែង ~${result.timeSavedHoursPerMonth} ម៉ោង/ខែ`
                    : `Saves ~${result.timeSavedHoursPerMonth} dispatch hours monthly`}
                </p>
              </motion.div>
            </div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
