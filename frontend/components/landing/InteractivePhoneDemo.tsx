"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  QrCode,
  CheckCircle2,
  Check,
  Star,
  Wind,
  Droplets,
  Zap,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Navigation,
  RotateCcw,
  Play,
  Smartphone,
  Home,
} from "lucide-react";

interface InteractivePhoneDemoProps {
  lang: "kh" | "en";
  videoUrl?: string; // When user provides video later, this drops right in!
  className?: string;
}

type DemoStep = 0 | 1 | 2 | 3 | 4;

export function InteractivePhoneDemo({
  lang,
  videoUrl,
  className = "",
}: InteractivePhoneDemoProps) {
  const [step, setStep] = useState<DemoStep>(1);
  const [selectedService, setSelectedService] = useState<"ac" | "electric" | "plumbing" | "clean">("ac");
  const [selectedTime, setSelectedTime] = useState<string>("2:30 PM");

  const services = {
    ac: {
      nameEn: "AC Chemical Overhaul",
      nameKh: "លាងសម្អាតម៉ាស៊ីនត្រជាក់គីមី",
      price: "$45.00",
      icon: <Wind className="h-4 w-4 text-blue-600" />,
      bg: "bg-blue-50 border-blue-200 text-blue-700",
    },
    electric: {
      nameEn: "Breaker & Wiring Repair",
      nameKh: "ជួសជុលប្រព័ន្ធភ្លើងមេ",
      price: "$65.00",
      icon: <Zap className="h-4 w-4 text-amber-600" />,
      bg: "bg-amber-50 border-amber-200 text-amber-700",
    },
    plumbing: {
      nameEn: "Booster Pump & Pipe Leak",
      nameKh: "ជួសជុលម៉ូទ័របូមទឹក",
      price: "$38.00",
      icon: <Droplets className="h-4 w-4 text-cyan-600" />,
      bg: "bg-cyan-50 border-cyan-200 text-cyan-700",
    },
    clean: {
      nameEn: "Villa Deep Cleaning",
      nameKh: "បោសសម្អាតវីឡាទាំងមូល",
      price: "$85.00",
      icon: <Sparkle className="h-4 w-4 text-purple-600" />,
      bg: "bg-purple-50 border-purple-200 text-purple-700",
    },
  };

  const stepsMeta = [
    { num: 0, labelEn: "Welcome Hero", labelKh: "ទំព័រដើម" },
    { num: 1, labelEn: "Pick Service", labelKh: "ជ្រើសសេវា" },
    { num: 2, labelEn: "Schedule", labelKh: "កាលវិភាគ" },
    { num: 3, labelEn: "Live Match", labelKh: "ផ្គូផ្គងជាង" },
    { num: 4, labelEn: "Bakong KHQR", labelKh: "ទូទាត់ KHQR" },
  ];

  const getStepBadgeClass = (active: boolean) => {
    return active ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-950";
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Interactive Step Switcher Pills Above Phone */}
      {!videoUrl && (
        <div className="flex items-center gap-1 sm:gap-2 mb-4 bg-slate-100 p-1 rounded-full border border-slate-200/80 shadow-2xs">
          {stepsMeta.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as DemoStep)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                step === s.num
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${getStepBadgeClass(step === s.num)}`}>
                {s.num}
              </span>
              <span>{lang === "kh" ? s.labelKh : s.labelEn}</span>
            </button>
          ))}
        </div>
      )}

      {/* The Realistic Smartphone Chassis */}
      <div className="relative w-[280px] sm:w-[305px] h-[570px] rounded-[44px] bg-slate-950 p-2.5 sm:p-3 shadow-2xl shadow-slate-900/30 border-[3px] border-slate-700/80 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
        {/* Hardware Reflection & Side Volume Accents */}
        <div className="absolute top-24 -left-1.5 w-1 h-8 rounded-l bg-slate-700 pointer-events-none" />
        <div className="absolute top-36 -left-1.5 w-1 h-8 rounded-l bg-slate-700 pointer-events-none" />
        <div className="absolute top-28 -right-1.5 w-1 h-12 rounded-r bg-slate-700 pointer-events-none" />

        {/* Dynamic Island */}
        <div className="relative z-30 mx-auto h-4 w-22 rounded-full bg-black mb-1 flex items-center justify-between px-2.5 shadow-xs">
          <div className="w-2 h-2 rounded-full bg-slate-900/90 border border-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
        </div>

        {/* Screen Bezel / Container */}
        <div className="relative w-full h-[515px] rounded-[34px] bg-white overflow-hidden flex flex-col justify-between text-slate-900">
          {/* If videoUrl is provided, render video player; otherwise render the interactive demo */}
          {videoUrl ? (
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between p-3.5 pt-2">
              <AnimatePresence initial={false}>
                {/* ──────────────── STEP 0: WELCOME HERO (VISUAL ONBOARDING) ──────────────── */}
                {step === 0 && (
                  <motion.div
                    key="step-0"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col justify-between h-full select-none"
                  >
                    {/* Top Header */}
                    <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                          <Home className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-900">ServiceFinder</span>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200/60">
                        {lang === "kh" ? "🇰🇭 ភាសាខ្មែរ" : "🇺🇸 English"}
                      </span>
                    </div>

                    {/* Centerpiece: Warm Home Ecosystem with Living Motion */}
                    <div className="relative w-full h-48 my-auto flex items-center justify-center">
                      {/* Soft warm aura */}
                      <div className="absolute w-40 h-40 rounded-full bg-amber-100/60 blur-xl pointer-events-none" />

                      {/* Orbiting Card 1: Cleaning */}
                      <motion.div
                        animate={{ y: [-4, 4, -4] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1 left-0 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs flex items-center gap-1.5 z-10"
                      >
                        <span className="text-xs">🧹</span>
                        <span className="text-[10px] font-bold text-slate-900">{lang === "kh" ? "សម្អាត" : "Cleaning"}</span>
                      </motion.div>

                      {/* Orbiting Card 2: AC Repair */}
                      <motion.div
                        animate={{ y: [4, -4, 4] }}
                        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-2 right-0 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs flex items-center gap-1.5 z-10"
                      >
                        <span className="text-xs">❄️</span>
                        <span className="text-[10px] font-bold text-slate-900">{lang === "kh" ? "ម៉ាស៊ីនត្រជាក់" : "AC Repair"}</span>
                      </motion.div>

                      {/* Home Badge in Center */}
                      <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-24 h-24 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col items-center justify-center z-0"
                      >
                        {/* Floating Pin */}
                        <div className="absolute -top-3 bg-white border border-slate-200 rounded-full px-2 py-0.5 shadow-2xs flex items-center gap-1 text-[9px] font-bold text-slate-800">
                          <MapPin className="h-2.5 w-2.5 text-rose-500" />
                          <span>Phnom Penh</span>
                        </div>

                        <Home className="h-10 w-10 text-slate-900 stroke-[1.5]" />
                        <div className="w-8 h-1 rounded-full bg-slate-200 mt-1" />
                      </motion.div>

                      {/* Orbiting Card 3: Electrical */}
                      <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-2 left-1 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs flex items-center gap-1.5 z-10"
                      >
                        <span className="text-xs">⚡</span>
                        <span className="text-[10px] font-bold text-slate-900">{lang === "kh" ? "ភ្លើង" : "Electrical"}</span>
                      </motion.div>

                      {/* Pro Glides In */}
                      <motion.div
                        animate={{ x: [20, 0, 20], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-0 right-0 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 shadow-xs flex items-center gap-1.5 z-10"
                      >
                        <span className="text-xs">👨‍🔧</span>
                        <div>
                          <span className="text-[10px] font-bold text-slate-900 block leading-none">Dara C.</span>
                          <span className="text-[8.5px] text-emerald-600 font-semibold">{lang === "kh" ? "កំពុងមកដល់" : "12m ETA"}</span>
                        </div>
                      </motion.div>

                      {/* Emerging Resolved Checkmark */}
                      <motion.div
                        animate={{ scale: [0.9, 1, 0.9], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-12 right-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shadow-2xs flex items-center gap-1 text-[9px] font-extrabold text-emerald-800 z-20"
                      >
                        <Check className="h-2.5 w-2.5 text-emerald-600 stroke-[3]" />
                        <span>{lang === "kh" ? "សម្រេច ✓" : "Resolved 5.0 ★"}</span>
                      </motion.div>
                    </div>

                    {/* Human Minimalist Copy */}
                    <div className="text-center px-1 space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {lang === "kh" ? "ជំនួយនៅក្បែរអ្នកជាងអ្វីដែលអ្នកគិត" : "Help is closer than you think."}
                      </h3>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        {lang === "kh" ? "ជាងជំនាញដែលអ្នកទុកចិត្ត សម្រាប់គ្រប់តម្រូវការគេហដ្ឋាន" : "Trusted people for the things you need."}
                      </p>

                      {/* 3 Story Dots */}
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <span className="w-3.5 h-1.5 rounded-full bg-slate-900" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
                    </div>

                    {/* Strong CTA */}
                    <div className="pt-2 pb-0.5">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                      >
                        <span>{lang === "kh" ? "ចាប់ផ្តើមស្វែងរក" : "Get Started"}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                      <div className="text-center mt-1">
                        <span className="text-[9.5px] text-slate-400">
                          {lang === "kh" ? "មានគណនីរួចហើយ? " : "Already have an account? "}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-700 underline cursor-pointer">
                          {lang === "kh" ? "ចូលគណនី" : "Log In"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ──────────────── STEP 1: SERVICE PICKER ──────────────── */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* App Header */}
                      <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">
                            SF
                          </div>
                          <span className="text-[11px] font-bold text-slate-900">ServiceFinder</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded-full">
                          📍 Phnom Penh
                        </span>
                      </div>

                      {/* Welcome & Prompt */}
                      <div className="mt-3 space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-900">
                          {lang === "kh" ? "ត្រូវការជាងថ្ងៃនេះ?" : "Need Help Today?"}
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          {lang === "kh" ? "ជ្រើសរើសសេវាកម្មខាងក្រោម" : "Select a verified trade below"}
                        </p>
                      </div>

                      {/* Service Grid Selection */}
                      <div className="mt-3 space-y-2">
                        {(Object.keys(services) as (keyof typeof services)[]).map((key) => {
                          const s = services[key];
                          const isSelected = selectedService === key;

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelectedService(key)}
                              className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${s.bg}`}>
                                  {s.icon}
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                                    {lang === "kh" ? s.nameKh : s.nameEn}
                                  </span>
                                  <span className="text-[9px] text-slate-400">Verified Pro</span>
                                </div>
                              </div>
                              <span className="font-mono text-xs font-bold text-slate-900">{s.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <span>{lang === "kh" ? "បន្តទៅកាលវិភាគ" : "Continue to Schedule"}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </motion.div>
                )}

                {/* ──────────────── STEP 2: SCHEDULE & ADDRESS ──────────────── */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-900">
                          {lang === "kh" ? "កាលវិភាគ & អាសយដ្ឋាន" : "Schedule & Address"}
                        </span>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {services[selectedService].price}
                        </span>
                      </div>

                      {/* Location Box */}
                      <div className="mt-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">
                          {lang === "kh" ? "ទីតាំងរបស់អ្នក" : "Your Location"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">Toul Kork, St. 289 (TK Avenue)</span>
                        </div>
                      </div>

                      {/* Time Slot Picker */}
                      <div className="mt-3 space-y-1.5">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400">
                          {lang === "kh" ? "ជ្រើសរើសម៉ោង" : "Select Arrival Time"}
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {["Today, 2:30 PM", "Today, 4:00 PM", "Today, 5:30 PM", "Tomorrow 9 AM"].map((time) => {
                            const isTimeSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setSelectedTime(time)}
                                className={`p-2 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                  isTimeSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Guarantee Pill */}
                      <div className="mt-4 p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-[10px] text-emerald-800">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Fixed price guaranteed. Escrow protected.</span>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-1/3 border border-slate-200 text-slate-600 rounded-xl py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>{lang === "kh" ? "ស្វែងរកជាងឥឡូវ" : "Dispatch Pro"}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ──────────────── STEP 3: LIVE RADAR & PRO MATCHED ──────────────── */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col justify-between h-full text-center"
                  >
                    <div>
                      {/* Radar Animation */}
                      <div className="relative mx-auto my-4 w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                        <div className="absolute inset-2 rounded-full bg-blue-500/30 animate-pulse" />
                        <div className="relative w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Navigation className="h-6 w-6 animate-spin" />
                        </div>
                      </div>

                      <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Pro Matched in 14s
                      </span>

                      <h4 className="text-xs font-bold text-slate-900 mt-2">
                        {lang === "kh" ? "ជាងបានទទួលការងារហើយ!" : "Certified Pro Assigned!"}
                      </h4>

                      {/* Pro Details Card */}
                      <div className="mt-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-left space-y-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=120&q=80"
                            alt="Pro"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-900">Vireak Sokha</span>
                              <span className="text-[10px] text-amber-500 font-bold">★ 4.95</span>
                            </div>
                            <span className="text-[9.5px] text-slate-500">142 verified jobs completed</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">Arrival ETA:</span>
                          <span className="font-bold text-blue-600">12 mins away (Toul Kork)</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>{lang === "kh" ? "ទូទាត់តាម Bakong KHQR" : "Pay via Bakong KHQR"}</span>
                    </button>
                  </motion.div>
                )}

                {/* ──────────────── STEP 4: BAKONG KHQR SCAN & SUCCESS ──────────────── */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col justify-between h-full text-center"
                  >
                    <div>
                      {/* Checkmark Tick */}
                      <div className="mx-auto mt-2 w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="h-5 w-5" />
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <span className="rounded-full bg-red-50 text-red-600 border border-red-200 px-2 py-0.2 text-[8px] font-black uppercase tracking-wider">
                          Bakong KHQR
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">
                          {lang === "kh" ? "ទូទាត់ជោគជ័យភ្លាមៗ" : "Instant Escrow Lock"}
                        </h4>
                        <p className="text-[9px] text-slate-400">
                          Ref: NBC-SF-8421 • Any Cambodian Bank
                        </p>
                      </div>

                      {/* Stylized QR Code */}
                      <div className="mx-auto my-2.5 w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shadow-inner">
                        <QrCode className="w-18 h-18 text-slate-900" />
                      </div>

                      <div className="text-sm font-black text-slate-900 font-mono">
                        {services[selectedService].price} USD
                      </div>

                      <span className="text-[9.5px] text-slate-500 block mt-1">
                        Funds held in escrow until job completed.
                      </span>
                    </div>

                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>{lang === "kh" ? "សាកល្បងកក់ម្តងទៀត" : "Try Another Booking"}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="mx-auto h-1 w-24 rounded-full bg-slate-500 mt-1.5" />
      </div>

      {/* Helpful Subtitle */}
      {!videoUrl && (
        <span className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1">
          <span>👆 Click directly on the phone or steps above to test</span>
        </span>
      )}
    </div>
  );
}
