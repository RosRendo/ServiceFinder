"use client";

import { useState } from "react";
import {
  Smartphone,
  Monitor,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ShieldCheck,
  Users,
  CalendarCheck,
  Layers,
  ArrowRight
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { EcosystemPipeline } from "@/components/landing/EcosystemPipeline";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion, AnimatePresence } from "framer-motion";

interface EcosystemTourProps {
  lang: "kh" | "en";
}

type PersonaId = "customer" | "company" | "staff";

export function EcosystemTour({ lang }: EcosystemTourProps) {
  const [activePersona, setActivePersona] = useState<PersonaId>("company");
  const dict = landingDictionary[lang].ecosystem;

  const personas = {
    customer: {
      id: "customer" as PersonaId,
      tabLabel: dict.customerTab,
      badge: lang === "kh" ? "កម្មវិធីទូរស័ព្ទសម្រាប់អតិថិជន" : "Mobile Client Experience",
      title: lang === "kh" ? "កក់សេវាកម្មងាយស្រួល និងតាមដានជាងផ្ទាល់" : "30-Second Booking & Live Staff Tracking",
      description:
        lang === "kh"
          ? "អតិថិជនជ្រើសរើសសេវាកម្ម ឃើញតម្លៃពិតប្រាកដមុនពេលកក់ តាមដានដំណើរជាងតាមរយៈផែនទី GPS និងទូទាត់តាម Bakong KHQR ដោយសុវត្ថិភាព។"
          : "Homeowners book trusted local trade specialists with upfront transparent pricing, monitor technician GPS arrival in real time, and pay via secure Bakong KHQR.",
      features: [
        lang === "kh" ? "តម្លៃច្បាស់លាស់ គ្មានការទារថ្លៃលាក់កំបាំង" : "Upfront fixed pricing with zero hidden surcharges",
        lang === "kh" ? "ផែនទីផ្ទាល់តាមដានពេលជាងធ្វើដំណើរមកដល់" : "Live GPS map tracking technician arrival",
        lang === "kh" ? "ប្រាក់កក់ត្រូវបានការពារដោយប្រព័ន្ធ Escrow" : "Deposit protected in escrow until satisfactory completion",
        lang === "kh" ? "ស្កេន Bakong KHQR ពីគ្រប់ធនាគារក្នុងស្រុក" : "Direct Bakong KHQR scan from any Cambodian bank app",
      ],
      deviceType: "mobile",
    },
    company: {
      id: "company" as PersonaId,
      tabLabel: dict.companyTab,
      badge: lang === "kh" ? "ផ្ទាំងគ្រប់គ្រងអាជីវកម្មកម្រិតខ្ពស់" : "Enterprise Dispatching OS",
      title: lang === "kh" ? "៣ ចុចចាត់ចែងការងារ និងវិភាគប្រាក់ចំណេញ" : "3-Click Smart Dispatch & Profit Analytics",
      description:
        lang === "kh"
          ? "ផ្ទាំងគ្រប់គ្រងសម្រាប់ម្ចាស់ក្រុមហ៊ុនសេវាកម្ម ចាត់ចែងការងារទៅជាងដែលនៅជិតបំផុតតាម GPS គ្រប់គ្រងកាលវិភាគ និងទទួលបានរបាយការណ៍ហិរញ្ញវត្ថុស្វ័យប្រវត្តិ។"
          : "A centralized operational cockpit for service company managers to assign bookings to nearest technicians, coordinate schedules, and track daily settled revenue.",
      features: [
        lang === "kh" ? "ចាត់ចែងការងារក្នុង ៣ ចុចទៅជាងដែលទំនេរ" : "3-click automated dispatch to nearest available tech",
        lang === "kh" ? "តារាងតាមដានស្ថានភាពការងារក្នុងពេលជាក់ស្តែង" : "Real-time dispatch kanban with status indicators",
        lang === "kh" ? "ប្រាក់ចំណូលផ្ទេរចូលគណនីធនាគារភ្លាមៗ" : "Instant settlement disbursements via Bakong KHQR rails",
        lang === "kh" ? "របាយការណ៍ហិរញ្ញវត្ថុ និងប្រាក់ចំណេញស្វ័យប្រវត្តិ" : "Automated daily P&L and technician performance audits",
      ],
      deviceType: "desktop",
    },
    staff: {
      id: "staff" as PersonaId,
      tabLabel: dict.staffTab,
      badge: lang === "kh" ? "កម្មវិធីទូរស័ព្ទសម្រាប់ជាងបច្ចេកទេស" : "Field Staff Companion",
      title: lang === "kh" ? "ទទួលការងារ ផែនទីនាំផ្លូវ និងបញ្ជាក់ការងារ" : "Instant Job Alerts & Turn-by-Turn Navigation",
      description:
        lang === "kh"
          ? "ជាងបច្ចេកទេសទទួលបានការជូនដំណឹងការងារភ្លាមៗ បើកផែនទីនាំផ្លូវទៅដល់ផ្ទះអតិថិជន ពិនិត្យបញ្ជីត្រួតពិនិត្យបច្ចេកទេស និងថតរូបបញ្ជាក់ការងារបញ្ចប់។"
          : "Field technicians receive push notifications for new jobs, navigate directly to customer locations, execute standardized checklists, and upload proof of work.",
      features: [
        lang === "kh" ? "ទទួលការជូនដំណឹងការងារថ្មីភ្លាមៗនៅលើទូរស័ព្ទ" : "Real-time work order push alerts and acceptance",
        lang === "kh" ? "ប្រព័ន្ធផែនទី GPS នាំផ្លូវដល់ទ្វារផ្ទះអតិថិជន" : "Integrated GPS navigation directly to client doorstep",
        lang === "kh" ? "បញ្ជីត្រួតពិនិត្យគុណភាព និងថតរូបបញ្ជាក់ការងារ" : "Digital inspection checklists and photo proof uploads",
        lang === "kh" ? "តាមដានប្រាក់កម្រៃជើងសារ និងចំណូលផ្ទាល់ខ្លួន" : "Live commission ledger and earnings tracking",
      ],
      deviceType: "mobile",
    },
  };

  const current = personas[activePersona];

  return (
    <section id="ecosystem" className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <FadeInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <Layers className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </FadeInView>

        {/* 1. Visual Illuminated Pipeline Workflow */}
        <EcosystemPipeline lang={lang} />

        {/* 2. Interactive Stakeholder Simulator */}
        <div>
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(personas) as PersonaId[]).map((pId) => {
              const isActive = activePersona === pId;
              return (
                <motion.button
                  key={pId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActivePersona(pId)}
                  type="button"
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pId === "company" ? (
                    <Monitor className="h-4 w-4" />
                  ) : (
                    <Smartphone className="h-4 w-4" />
                  )}
                  <span>{personas[pId].tabLabel}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Showcase Container */}
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-10 lg:p-12 shadow-xs">
            <motion.div
              key={activePersona}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center"
            >
              {/* Persona Details */}
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-block rounded-md bg-slate-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {current.badge}
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  {current.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {current.description}
                </p>

                {/* Feature Checkpoints */}
                <div className="space-y-3 pt-2">
                  {current.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Device Frame */}
              <div className="lg:col-span-6 flex justify-center">
                {current.deviceType === "desktop" ? (
                  /* Desktop Dispatch Board Simulator */
                  <div className="w-full max-w-lg rounded-2xl border border-slate-300 bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-rose-400" />
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="ml-2 text-[10px] text-slate-500 font-mono">
                          app.servicefinder.kh/dispatch
                        </span>
                      </div>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        ADMIN PORTAL
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">Sokha Vireak (HVAC Senior)</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> Boeung Keng Kang 1
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          In Progress
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">Dara Chem (Electrician)</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> Toul Kork
                          </span>
                        </div>
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Dispatched
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">Piseth Mao (Plumber)</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> Chroy Changvar
                          </span>
                        </div>
                        <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          Available (Idle)
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Active Field Crew: 8 / 10</span>
                      <span className="font-bold text-slate-800">Today Payout: $425.00</span>
                    </div>
                  </div>
                ) : (
                  /* Mobile App Simulator */
                  <div className="w-64 rounded-3xl border-4 border-slate-800 bg-white p-3 shadow-2xl">
                    <div className="mx-auto h-3.5 w-20 rounded-full bg-slate-800 mb-3" />

                    {activePersona === "customer" ? (
                      <div className="space-y-3 text-left">
                        <div className="rounded-lg bg-blue-600 p-3 text-white">
                          <span className="text-[10px] opacity-80 block">Active Booking</span>
                          <span className="text-xs font-bold block mt-0.5">AC Cleaning Service</span>
                          <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5 mt-1 inline-block">
                            Arrival in 12 mins
                          </span>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Assigned Tech:</span>
                            <span className="font-bold text-slate-900">Sokha V. ★ 4.9</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">Payment:</span>
                            <span className="font-bold text-emerald-600">Bakong KHQR</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        <div className="rounded-lg bg-slate-900 p-3 text-white">
                          <span className="text-[10px] text-emerald-400 font-bold block">New Work Order</span>
                          <span className="text-xs font-bold block mt-0.5">Leak Pipe Repair</span>
                          <span className="text-[10px] text-slate-300 block mt-1">BKK1, St. 310</span>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-2 text-center">
                          <span className="text-[11px] font-bold text-emerald-800 block">
                            Earn $35.00
                          </span>
                          <span className="text-[9px] text-emerald-600">Swipe to Accept Order</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-2 border-t border-slate-100 text-center">
                      <span className="text-[9px] font-mono text-slate-400">ServiceFinder Mobile OS</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
        </div>
      </div>
    </div>
  </section>
);
}
