"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Zap,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";

interface CompanyDispatchSimulatorProps {
  lang: "kh" | "en";
}

interface KanbanJob {
  id: string;
  orderNumber: string;
  service: string;
  location: string;
  amount: string;
  proName?: string;
  status: "incoming" | "in_transit" | "settled";
  eta?: string;
}

const INITIAL_JOBS: KanbanJob[] = [
  {
    id: "job-1",
    orderNumber: "SF-9421",
    service: "AC Chemical Overhaul",
    location: "Toul Kork, St. 289",
    amount: "$45.00",
    status: "incoming",
  },
  {
    id: "job-2",
    orderNumber: "SF-9418",
    service: "3-Phase Breaker Trip",
    location: "BKK 1, St. 310",
    amount: "$65.00",
    proName: "Dara C. (Master Electrician)",
    status: "in_transit",
    eta: "8m ETA",
  },
  {
    id: "job-3",
    orderNumber: "SF-9415",
    service: "Villa Deep Cleaning",
    location: "Chroy Changvar",
    amount: "$85.00",
    proName: "Sreypov C. (5-Star Crew)",
    status: "settled",
  },
];

export function CompanyDispatchSimulator({ lang }: CompanyDispatchSimulatorProps) {
  const [jobs, setJobs] = useState<KanbanJob[]>(INITIAL_JOBS);
  const [activeTechs, setActiveTechs] = useState(8);
  const [todayPayout, setTodayPayout] = useState(2840);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAutoAssign = () => {
    if (isAssigning) return;
    setIsAssigning(true);

    setTimeout(() => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === "job-1"
            ? {
                ...j,
                status: "in_transit",
                proName: "Vireak S. (HVAC Senior)",
                eta: "12m ETA",
              }
            : j
        )
      );
      setActiveTechs(9);
      setTodayPayout((prev) => prev + 45);
      setIsAssigning(false);
    }, 600);
  };

  const handleReset = () => {
    setJobs(INITIAL_JOBS);
    setActiveTechs(8);
    setTodayPayout(2840);
  };

  const incomingJob = jobs.find((j) => j.status === "incoming");
  const inTransitJobs = jobs.filter((j) => j.status === "in_transit");
  const settledJobs = jobs.filter((j) => j.status === "settled");

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl text-slate-900 select-none">
      {/* 1. Window Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 ml-1">
            ServiceFinder OS • Dispatch Kanban
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Phnom Penh Fleet Active</span>
        </div>
      </div>

      {/* 2. Live Top Metrics Ribbon */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
          <span className="text-[10px] text-slate-500 font-medium block">Active Crew</span>
          <span className="text-xs font-bold text-slate-900">{activeTechs} / 10 Pros</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
          <span className="text-[10px] text-slate-500 font-medium block">Avg Match</span>
          <span className="text-xs font-bold text-blue-600">&lt; 18s Auto</span>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center">
          <span className="text-[10px] text-slate-500 font-medium block">Settled Today</span>
          <span className="text-xs font-bold text-emerald-700">${todayPayout}.00</span>
        </div>
      </div>

      {/* 3. Visual 3-Column Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* Column 1: Incoming (Needs Auto-Assign) */}
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-2 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 pb-1 border-b border-amber-200/50">
            <span>INCOMING ({incomingJob ? 1 : 0})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>

          <AnimatePresence mode="popLayout">
            {incomingJob ? (
              <motion.div
                key={incomingJob.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono font-bold text-slate-500">{incomingJob.orderNumber}</span>
                  <span className="font-bold text-slate-900">{incomingJob.amount}</span>
                </div>
                <span className="font-bold text-slate-900 text-[11px] block leading-tight">
                  {incomingJob.service}
                </span>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-slate-400" />
                  {incomingJob.location}
                </span>

                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={isAssigning}
                  className="w-full mt-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md py-1 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <Zap className="h-2.5 w-2.5 text-amber-300" />
                  <span>{isAssigning ? "Matching Pro..." : "Auto-Assign ➔"}</span>
                </button>
              </motion.div>
            ) : (
              <div className="py-6 text-center text-[10px] text-slate-400">
                All jobs assigned!
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Column 2: In Transit / Dispatched */}
        <div className="rounded-xl border border-blue-200/60 bg-blue-50/30 p-2 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-blue-800 pb-1 border-b border-blue-200/50">
            <span>IN TRANSIT ({inTransitJobs.length})</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          </div>

          <div className="space-y-1.5">
            {inTransitJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-blue-200 bg-white p-2 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-900 truncate max-w-[90px]">{job.service}</span>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
                    {job.eta || "En Route"}
                  </span>
                </div>
                <span className="text-[9.5px] text-slate-500 block truncate">
                  Pro: {job.proName}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 3: Settled Today */}
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-2 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 pb-1 border-b border-emerald-200/50">
            <span>SETTLED ({settledJobs.length})</span>
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          </div>

          <div className="space-y-1.5">
            {settledJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-emerald-200 bg-white p-2 shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-900 truncate max-w-[90px]">{job.service}</span>
                  <span className="font-bold text-emerald-700">{job.amount}</span>
                </div>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                  <Check className="h-2.5 w-2.5" />
                  <span>Bakong KHQR</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Reset & Action Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>Click "Auto-Assign" to test 1-click dispatch</span>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Board</span>
        </button>
      </div>
    </div>
  );
}
