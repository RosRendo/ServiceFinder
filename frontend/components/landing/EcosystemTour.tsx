"use client";

import { useState } from "react";
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  TrendingUp,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { EcosystemPipeline } from "@/components/landing/EcosystemPipeline";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion, AnimatePresence } from "framer-motion";
import { InteractivePhoneDemo } from "@/components/landing/InteractivePhoneDemo";
import { CompanyDispatchSimulator } from "@/components/landing/CompanyDispatchSimulator";
import { StaffTechSimulator } from "@/components/landing/StaffTechSimulator";

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
      oneLiner:
        lang === "kh"
          ? "កក់ជាងជំនាញច្បាស់លាស់ ឃើញតម្លៃមុនពេលកក់ និងតាមដានដំណើរជាងតាមផែនទីផ្ទាល់។"
          : "Book certified trade specialists with upfront fixed rates, real-time arrival tracking, and Bakong KHQR.",
      metrics: [
        {
          value: "30s",
          label: lang === "kh" ? "កក់រហ័ស" : "Fast Booking",
          icon: <Clock className="h-4 w-4 text-blue-600" />,
        },
        {
          value: "Live GPS",
          label: lang === "kh" ? "តាមដានជាង" : "Technician Radar",
          icon: <MapPin className="h-4 w-4 text-emerald-600" />,
        },
        {
          value: "100%",
          label: lang === "kh" ? "ការពារប្រាក់កក់" : "KHQR Escrow Safe",
          icon: <ShieldCheck className="h-4 w-4 text-indigo-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "តម្លៃច្បាស់លាស់ គ្មានការទារថ្លៃលាក់កំបាំង" : "Upfront fixed pricing with zero hidden surcharges",
        lang === "kh" ? "ផែនទីផ្ទាល់តាមដានពេលជាងធ្វើដំណើរមកដល់" : "Live GPS map tracking technician arrival",
        lang === "kh" ? "ស្កេន Bakong KHQR ពីគ្រប់ធនាគារក្នុងស្រុក" : "Direct Bakong KHQR scan from any Cambodian bank app",
      ],
    },
    company: {
      id: "company" as PersonaId,
      tabLabel: dict.companyTab,
      badge: lang === "kh" ? "ផ្ទាំងគ្រប់គ្រងអាជីវកម្មកម្រិតខ្ពស់" : "Enterprise Dispatching OS",
      title: lang === "kh" ? "៣ ចុចចាត់ចែងការងារ និងវិភាគប្រាក់ចំណេញ" : "3-Click Smart Dispatch & Profit Analytics",
      oneLiner:
        lang === "kh"
          ? "ផ្ទាំងគ្រប់គ្រងចាត់ចែងការងាររហ័ស តាមដានជាងផ្ទាល់ និងទូទាត់ប្រាក់ចំណេញស្វ័យប្រវត្តិ។"
          : "Centrally dispatch jobs to nearest pros, monitor field progress in real time, and audit daily settled revenue.",
      metrics: [
        {
          value: "3 Clicks",
          label: lang === "kh" ? "ចាត់ចែងស្វ័យប្រវត្តិ" : "Auto-Dispatch",
          icon: <Zap className="h-4 w-4 text-amber-600" />,
        },
        {
          value: "< 18s",
          label: lang === "kh" ? "ផ្គូផ្គងជាងជិតបំផុត" : "Avg Match Time",
          icon: <Clock className="h-4 w-4 text-blue-600" />,
        },
        {
          value: "Instant",
          label: lang === "kh" ? "ទូទាត់ប្រាក់ចំណេញ" : "Bakong Settlement",
          icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "ចាត់ចែងការងារក្នុង ៣ ចុចទៅជាងដែលទំនេរ" : "3-click automated dispatch to nearest available pro",
        lang === "kh" ? "តារាងតាមដានស្ថានភាពការងារក្នុងពេលជាក់ស្តែង" : "Real-time dispatch kanban with status indicators",
        lang === "kh" ? "របាយការណ៍ហិរញ្ញវត្ថុ និងប្រាក់ចំណេញស្វ័យប្រវត្តិ" : "Automated daily P&L and technician performance audits",
      ],
    },
    staff: {
      id: "staff" as PersonaId,
      tabLabel: dict.staffTab,
      badge: lang === "kh" ? "កម្មវិធីទូរស័ព្ទសម្រាប់ជាងបច្ចេកទេស" : "Field Staff Companion",
      title: lang === "kh" ? "ទទួលការងារ ផែនទីនាំផ្លូវ និងបញ្ជាក់ការងារ" : "Instant Job Alerts & Turn-by-Turn Navigation",
      oneLiner:
        lang === "kh"
          ? "ទទួលការងារក្បែរខ្លួនភ្លាមៗ ផែនទីនាំផ្លូវដល់ទ្វារផ្ទះ និងបើកប្រាក់កម្រៃភ្លាមៗតាម Bakong។"
          : "Receive instant work orders, navigate directly to customer doorsteps, and collect guaranteed payouts.",
      metrics: [
        {
          value: "Instant",
          label: lang === "kh" ? "ដំណឹងការងារថ្មី" : "Push Work Alerts",
          icon: <Zap className="h-4 w-4 text-emerald-600" />,
        },
        {
          value: "Turn-by-Turn",
          label: lang === "kh" ? "ផែនទីនាំផ្លូវ" : "GPS Navigation",
          icon: <MapPin className="h-4 w-4 text-blue-600" />,
        },
        {
          value: "100% Net",
          label: lang === "kh" ? "បើកប្រាក់ភ្លាមៗ" : "Direct Payout",
          icon: <UserCheck className="h-4 w-4 text-purple-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "ទទួលការជូនដំណឹងការងារថ្មីភ្លាមៗនៅលើទូរស័ព្ទ" : "Real-time work order push alerts and 1-tap accept",
        lang === "kh" ? "ប្រព័ន្ធផែនទី GPS នាំផ្លូវដល់ទ្វារផ្ទះអតិថិជន" : "Integrated GPS navigation directly to client doorstep",
        lang === "kh" ? "បញ្ជីត្រួតពិនិត្យគុណភាព និងថតរូបបញ្ជាក់ការងារ" : "Digital inspection checklists and photo proof uploads",
      ],
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
              {/* Left Column: Visual Metrics & Concise Highlights */}
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-block rounded-md bg-slate-900 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {current.badge}
                </span>

                <div className="space-y-2">
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                    {current.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {current.oneLiner}
                  </p>
                </div>

                {/* 3 Visual Metric Cards */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {current.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs text-center space-y-1"
                    >
                      <div className="mx-auto w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {metric.icon}
                      </div>
                      <span className="block font-heading font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                        {metric.value}
                      </span>
                      <span className="block text-[10.5px] font-medium text-slate-500 leading-tight">
                        {metric.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Concise Visual Highlights */}
                <div className="space-y-2.5 pt-2">
                  {current.highlights.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="leading-relaxed font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Simulators */}
              <div className="lg:col-span-6 flex justify-center">
                {activePersona === "company" ? (
                  <CompanyDispatchSimulator lang={lang} />
                ) : activePersona === "customer" ? (
                  <InteractivePhoneDemo lang={lang} />
                ) : (
                  <StaffTechSimulator lang={lang} />
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
