"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  ShieldCheck,
  Navigation,
  RotateCcw,
  Phone,
  Camera,
  Zap,
  MousePointerClick,
} from "lucide-react";
import { PhoneFrame } from "@/components/landing/PhoneFrame";

interface StaffTechSimulatorProps {
  lang: "kh" | "en";
  activeStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

type TechStep = 1 | 2 | 3;

export function StaffTechSimulator({
  lang,
  activeStep,
  onStepChange,
  className = "",
}: StaffTechSimulatorProps) {
  const [internalStep, setInternalStep] = useState<TechStep>(1);
  const step = (activeStep ?? internalStep) as TechStep;
  const setStep = (target: TechStep) => {
    setInternalStep(target);
    onStepChange?.(target);
  };
  const [checklist, setChecklist] = useState({
    inspection: true,
    cleaning: true,
    photo: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <PhoneFrame accentClass="bg-emerald-900/60">
        <div className="flex flex-col h-full justify-between p-3.5 pt-2">
            <AnimatePresence initial={false}>
              {/* ──────────────── STEP 1: WORK ORDER ALERT ──────────────── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Notification Badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[11px] font-bold text-slate-900">
                          {lang === "kh" ? "ការងារថ្មីដែលនៅជិត" : "New Work Order Alert"}
                        </span>
                      </div>
                      <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                        {lang === "kh" ? "នៅសល់ ៤៥ វិនាទី" : "45s to accept"}
                      </span>
                    </div>

                    {/* Job Order Card */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                            SF-9421 • HVAC
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {lang === "kh" ? "លាងសម្អាតម៉ាស៊ីនត្រជាក់គីមី" : "AC Chemical Overhaul"}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">
                            {lang === "kh" ? "ប្រាក់សុទ្ធ" : "Net Payout"}
                          </span>
                          <span className="font-extrabold text-base text-emerald-700">$35.00</span>
                        </div>
                      </div>

                      {/* Location & Navigation info */}
                      <div className="rounded-xl bg-white border border-slate-200/80 p-2 space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="font-semibold truncate">Toul Kork, St. 289</span>
                          <span className="ml-auto text-[10px] text-slate-400">1.4 km</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{lang === "kh" ? "ប៉ាន់ស្មាន ៤៥ នាទី" : "Est. 45 mins work"}</span>
                        </div>
                      </div>

                      {/* Customer Note */}
                      <div className="text-[10.5px] text-amber-900 bg-amber-50/60 border border-amber-200/60 rounded-lg p-2 leading-relaxed">
                        <span className="font-bold text-amber-900 block mb-0.5">
                          {lang === "kh" ? "ចំណាំពីអតិថិជន:" : "Customer Note:"}
                        </span>
                        {lang === "kh"
                          ? "ម៉ាស៊ីនបន្ទប់គេងជាន់ទី២ មិនសូវត្រជាក់ និងមានទឹកហៀរ។"
                          : "2nd floor bedroom unit is leaking water and blowing warm air."}
                      </div>
                    </div>
                  </div>

                  {/* Accept Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300" />
                      <span>{lang === "kh" ? "ទទួលយកការងារឥឡូវនេះ" : "Tap to Accept Work Order"}</span>
                    </button>
                    <span className="text-[9.5px] text-slate-400 text-center block mt-1.5">
                      {lang === "kh" ? "ធានាប្រាក់កក់ដោយ ServiceFinder Escrow" : "Guaranteed payout held in escrow"}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ──────────────── STEP 2: ON-SITE DIGITAL CHECKLIST ──────────────── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Status */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[11px] font-bold text-slate-900">
                          {lang === "kh" ? "កំពុងបំពេញការងារនៅនឹងកន្លែង" : "On-Site Work in Progress"}
                        </span>
                      </div>
                      <span className="rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                        SF-9421
                      </span>
                    </div>

                    {/* Client Quick Contact */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">Sokha Vireak</span>
                        <span className="text-[10px] text-slate-500">Toul Kork • 012 888 ***</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          aria-label="Call client"
                        >
                          <Phone className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          aria-label="Directions"
                        >
                          <Navigation className="h-3.5 w-3.5 text-emerald-600" />
                        </button>
                      </div>
                    </div>

                    {/* Interactive Standard Operating Checklist */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        {lang === "kh" ? "បញ្ជីត្រួតពិនិត្យបច្ចេកទេស" : "Quality Standard Checklist"}
                      </span>

                      {/* Checklist item 1 */}
                      <button
                        type="button"
                        onClick={() => toggleCheck("inspection")}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          checklist.inspection
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-[11px] font-medium">
                          {lang === "kh" ? "ត្រួតពិនិត្យសម្ពាធហ្គាស & អគ្គិសនី" : "1. Gas pressure & circuit test"}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            checklist.inspection
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {checklist.inspection && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>

                      {/* Checklist item 2 */}
                      <button
                        type="button"
                        onClick={() => toggleCheck("cleaning")}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          checklist.cleaning
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-[11px] font-medium">
                          {lang === "kh" ? "លាងសម្អាតកង្ហារ និង Coil គីមី" : "2. Chemical blower & coil wash"}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            checklist.cleaning
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {checklist.cleaning && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>

                      {/* Checklist item 3 */}
                      <button
                        type="button"
                        onClick={() => toggleCheck("photo")}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          checklist.photo
                            ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <span className="text-[11px] font-medium flex items-center gap-1.5">
                          <Camera className={`h-3 w-3 ${checklist.photo ? "text-emerald-800" : "text-slate-400"}`} />
                          <span>{lang === "kh" ? "ថតរូបបញ្ជាក់មុន និងក្រោយ" : "3. Upload photo proof"}</span>
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            checklist.photo
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {checklist.photo && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Complete Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-white" />
                      <span>{lang === "kh" ? "បញ្ចប់ការងារ & ទូទាត់ $35.00" : "Complete & Collect $35.00"}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ──────────────── STEP 3: INSTANT SETTLEMENT ──────────────── */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col h-full justify-between text-center"
                >
                  <div className="my-auto space-y-3">
                    {/* Success Shield */}
                    <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        {lang === "kh" ? "ការងារបានបញ្ចប់ជោគជ័យ" : "Job Completed & Settled"}
                      </span>
                      <h4 className="font-extrabold text-2xl text-slate-900 mt-0.5">
                        +$35.00
                      </h4>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        {lang === "kh" ? "ផ្ទេរចូល Bakong Wallet ភ្លាមៗ" : "Instant Bakong Wallet Payout"}
                      </span>
                    </div>

                    {/* Receipt Card */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left text-[10.5px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Service:</span>
                        <span className="font-semibold text-slate-800">AC Chemical Wash</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Txn Hash:</span>
                        <span className="font-mono text-slate-700">#BK-994208</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/80 pt-1.5 font-bold">
                        <span className="text-slate-700">Today Payout:</span>
                        <span className="text-emerald-700">$105.00 (3 Jobs)</span>
                      </div>
                    </div>
                  </div>

                  {/* Reset Demo Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{lang === "kh" ? "សាកល្បងការងារថ្មីម្តងទៀត" : "Simulate Next Job Alert"}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </PhoneFrame>

      <span className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1">
        <MousePointerClick className="h-3 w-3" />
        <span>Tap buttons directly on the phone to test</span>
      </span>
    </div>
  );
}
