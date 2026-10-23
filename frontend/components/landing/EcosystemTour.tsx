"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  MapPin,
  Zap,
  Layers,
  Wrench,
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";
import { InteractivePhoneDemo } from "@/components/landing/InteractivePhoneDemo";
import { CompanyDispatchSimulator } from "@/components/landing/CompanyDispatchSimulator";
import { StaffTechSimulator } from "@/components/landing/StaffTechSimulator";

interface EcosystemTourProps {
  lang: "kh" | "en";
}

type PersonaId = "customer" | "company" | "staff";

interface TourStep {
  num: number;
  labelEn: string;
  labelKh: string;
}

const CUSTOMER_STEPS: TourStep[] = [
  { num: 0, labelEn: "Welcome Hero", labelKh: "ទំព័រដើម" },
  { num: 1, labelEn: "Pick Service", labelKh: "ជ្រើសសេវា" },
  { num: 2, labelEn: "Schedule", labelKh: "កាលវិភាគ" },
  { num: 3, labelEn: "Live Match", labelKh: "ផ្គូផ្គងជាង" },
  { num: 4, labelEn: "Bakong KHQR", labelKh: "ទូទាត់ KHQR" },
];

const STAFF_STEPS: TourStep[] = [
  { num: 1, labelEn: "Push Alert", labelKh: "ការងារថ្មី" },
  { num: 2, labelEn: "Checklist", labelKh: "បញ្ជីត្រួតពិនិត្យ" },
  { num: 3, labelEn: "Payout", labelKh: "បើកប្រាក់ចំណូល" },
];

interface PersonaMetric {
  value: string;
  labelKh: string;
  labelEn: string;
  icon: ReactNode;
}

interface PersonaData {
  id: PersonaId;
  icon: ReactNode;
  badge: string;
  title: string;
  oneLiner: string;
  descKh: string;
  descEn: string;
  metrics: PersonaMetric[];
  highlights: [string, string];
}

export function EcosystemTour({ lang }: EcosystemTourProps) {
  const [activePersona, setActivePersona] = useState<PersonaId>("customer");
  const [customerStep, setCustomerStep] = useState(1);
  const [staffStep, setStaffStep] = useState(1);
  const [customerAuto, setCustomerAuto] = useState(true);
  const [staffAuto, setStaffAuto] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (activePersona === "company") return;
    const auto = activePersona === "customer" ? customerAuto : staffAuto;
    if (!auto) return;
    const timer = setInterval(() => {
      if (reducedMotionRef.current || isPaused || document.hidden) return;
      if (activePersona === "customer") {
        setCustomerStep((prev) => (prev + 1) % CUSTOMER_STEPS.length);
      } else {
        setStaffStep((prev) => (prev >= STAFF_STEPS.length ? STAFF_STEPS[0].num : prev + 1));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [activePersona, customerAuto, staffAuto, isPaused]);

  const dict = landingDictionary[lang].ecosystem;

  const personas: Record<PersonaId, PersonaData> = {
    customer: {
      id: "customer",
      icon: <Smartphone className="h-4 w-4" />,
      badge: lang === "kh" ? "កម្មវិធីទូរស័ព្ទសម្រាប់អតិថិជន" : "Mobile Client Experience",
      title: lang === "kh" ? "កក់សេវាកម្មងាយស្រួល និងតាមដានជាងផ្ទាល់" : "30-Second Booking & Live Staff Tracking",
      oneLiner:
        lang === "kh"
          ? "កក់ជាងជំនាញច្បាស់លាស់ ឃើញតម្លៃមុនពេលកក់ និងតាមដានដំណើរជាងតាមផែនទីផ្ទាល់។"
          : "Book certified trade specialists with upfront fixed rates, real-time arrival tracking, and Bakong KHQR.",
      descKh: "កក់ តាមដាន និងទូទាត់ KHQR",
      descEn: "Book, track & pay via KHQR",
      metrics: [
        {
          value: "30s",
          labelKh: "កក់រហ័ស",
          labelEn: "Fast Booking",
          icon: <Clock className="h-4 w-4 text-blue-600" />,
        },
        {
          value: "Live GPS",
          labelKh: "តាមដានជាង",
          labelEn: "Technician Radar",
          icon: <MapPin className="h-4 w-4 text-emerald-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "តម្លៃច្បាស់លាស់ គ្មានការទារថ្លៃលាក់កំបាំង" : "Upfront fixed pricing with zero hidden surcharges",
        lang === "kh" ? "ស្កេន Bakong KHQR ពីគ្រប់ធនាគារក្នុងស្រុក" : "Direct Bakong KHQR scan from any Cambodian bank app",
      ],
    },
    company: {
      id: "company",
      icon: <Monitor className="h-4 w-4" />,
      badge: lang === "kh" ? "ផ្ទាំងគ្រប់គ្រងអាជីវកម្មកម្រិតខ្ពស់" : "Enterprise Dispatching OS",
      title: lang === "kh" ? "៣ ចុចចាត់ចែងការងារ និងវិភាគប្រាក់ចំណេញ" : "3-Click Smart Dispatch & Profit Analytics",
      oneLiner:
        lang === "kh"
          ? "ផ្ទាំងគ្រប់គ្រងចាត់ចែងការងាររហ័ស តាមដានជាងផ្ទាល់ និងទូទាត់ប្រាក់ចំណេញស្វ័យប្រវត្តិ។"
          : "Centrally dispatch jobs to nearest pros, monitor field progress in real time, and audit daily settled revenue.",
      descKh: "ចាត់ចែងការងារ និងរបាយការណ៍",
      descEn: "Dispatch jobs & audit revenue",
      metrics: [
        {
          value: "3 Clicks",
          labelKh: "ចាត់ចែងស្វ័យប្រវត្តិ",
          labelEn: "Auto-Dispatch",
          icon: <Zap className="h-4 w-4 text-amber-600" />,
        },
        {
          value: "< 18s",
          labelKh: "ផ្គូផ្គងជាងជិតបំផុត",
          labelEn: "Avg Match Time",
          icon: <Clock className="h-4 w-4 text-blue-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "ចាត់ចែងការងារក្នុង ៣ ចុចទៅជាងដែលទំនេរ" : "3-click automated dispatch to nearest available pro",
        lang === "kh" ? "របាយការណ៍ហិរញ្ញវត្ថុ និងប្រាក់ចំណេញស្វ័យប្រវត្តិ" : "Automated daily P&L and technician performance audits",
      ],
    },
    staff: {
      id: "staff",
      icon: <Wrench className="h-4 w-4" />,
      badge: lang === "kh" ? "កម្មវិធីទូរស័ព្ទសម្រាប់ជាងបច្ចេកទេស" : "Field Staff Companion",
      title: lang === "kh" ? "ទទួលការងារ ផែនទីនាំផ្លូវ និងបញ្ជាក់ការងារ" : "Instant Job Alerts & Turn-by-Turn Navigation",
      oneLiner:
        lang === "kh"
          ? "ទទួលការងារក្បែរខ្លួនភ្លាមៗ ផែនទីនាំផ្លូវដល់ទ្វារផ្ទះ និងបើកប្រាក់កម្រៃភ្លាមៗតាម Bakong។"
          : "Receive instant work orders, navigate directly to customer doorsteps, and collect guaranteed payouts.",
      descKh: "ទទួលការងារ និងបើកប្រាក់ភ្លាមៗ",
      descEn: "Instant jobs & instant payouts",
      metrics: [
        {
          value: "Instant",
          labelKh: "ដំណឹងការងារថ្មី",
          labelEn: "Push Work Alerts",
          icon: <Zap className="h-4 w-4 text-emerald-600" />,
        },
        {
          value: "Turn-by-Turn",
          labelKh: "ផែនទីនាំផ្លូវ",
          labelEn: "GPS Navigation",
          icon: <MapPin className="h-4 w-4 text-blue-600" />,
        },
      ],
      highlights: [
        lang === "kh" ? "ទទួលការជូនដំណឹងការងារថ្មីភ្លាមៗនៅលើទូរស័ព្ទ" : "Real-time work order push alerts and 1-tap accept",
        lang === "kh" ? "បញ្ជីត្រួតពិនិត្យគុណភាព និងថតរូបបញ្ជាក់ការងារ" : "Digital inspection checklists and photo proof uploads",
      ],
    },
  };

  const current = personas[activePersona];
  const stepsMeta = activePersona === "customer" ? CUSTOMER_STEPS : activePersona === "staff" ? STAFF_STEPS : undefined;
  const activeStep = activePersona === "customer" ? customerStep : activePersona === "staff" ? staffStep : null;
  const autoPlaying = activePersona === "customer" ? customerAuto : activePersona === "staff" ? staffAuto : false;

  const handleStepSelect = (step: number) => {
    if (activePersona === "customer") {
      setCustomerAuto(false);
      setCustomerStep(step);
    } else if (activePersona === "staff") {
      setStaffAuto(false);
      setStaffStep(step);
    }
  };

  const handleCustomerStepChange = (step: number) => {
    setCustomerAuto(false);
    setCustomerStep(step);
  };

  const handleStaffStepChange = (step: number) => {
    setStaffAuto(false);
    setStaffStep(step);
  };

  return (
    <section id="ecosystem" className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
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

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onBlur={() => setIsPaused(false)}
          className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-10 lg:p-12 shadow-xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div
                role="tablist"
                aria-label={lang === "kh" ? "ជ្រើសរើសบุคลิក" : "Choose a persona"}
                className="flex flex-col gap-2"
              >
                {(Object.keys(personas) as PersonaId[]).map((pId) => {
                  const isActive = activePersona === pId;
                  const persona = personas[pId];
                  return (
                    <motion.button
                      key={pId}
                      role="tab"
                      aria-selected={isActive}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActivePersona(pId)}
                      type="button"
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive ? "bg-white/10 text-white" : "bg-slate-50 border border-slate-100 text-slate-700"
                        }`}
                      >
                        {persona.icon}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-bold ${isActive ? "text-white" : "text-slate-900"}`}>
                          {dict[pId === "customer" ? "customerTab" : pId === "company" ? "companyTab" : "staffTab"]}
                        </span>
                        <span className={`block text-[10.5px] leading-snug ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                          {lang === "kh" ? persona.descKh : persona.descEn}
                        </span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.div
                key={activePersona}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="space-y-5 pt-2"
              >
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

                <div className="grid grid-cols-2 gap-2.5">
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
                      <span className="block text-[10.5px] font-medium text-slate-600 leading-tight">
                        {lang === "kh" ? metric.labelKh : metric.labelEn}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {current.highlights.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      </div>
                      <span className="leading-relaxed font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {stepsMeta && (
                <div className="space-y-2 pt-3 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {stepsMeta.map((s) => {
                      const isActive = activeStep === s.num;
                      return (
                        <button
                          key={s.num}
                          type="button"
                          onClick={() => handleStepSelect(s.num)}
                          aria-pressed={isActive}
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? "bg-slate-900 border-slate-900 text-white"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-slate-300"}`} />
                          <span>{lang === "kh" ? s.labelKh : s.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="block text-[9.5px] text-slate-400">
                    {autoPlaying
                      ? lang === "kh"
                        ? "ដំណើរការស្វ័យប្រវត្តិរាល់ ៣ វិនាទី"
                        : "Auto-playing every 3s"
                      : lang === "kh"
                        ? "ចុចជំហានដើម្បីបញ្ជា"
                        : "Tap a step to navigate"}
                  </span>
                </div>
              )}
            </div>

            <div className="lg:col-span-6 flex justify-center">
              {activePersona === "company" ? (
                <CompanyDispatchSimulator lang={lang} />
              ) : activePersona === "customer" ? (
                <InteractivePhoneDemo
                  lang={lang}
                  activeStep={customerStep}
                  onStepChange={handleCustomerStepChange}
                />
              ) : (
                <StaffTechSimulator
                  lang={lang}
                  activeStep={staffStep}
                  onStepChange={handleStaffStepChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
