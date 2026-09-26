"use client";

import { motion } from "framer-motion";
import { Smartphone, Monitor, Navigation, Landmark, ArrowRight, Zap } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

interface EcosystemPipelineProps {
  lang: "kh" | "en";
}

export function EcosystemPipeline({ lang }: EcosystemPipelineProps) {
  const dict = landingDictionary[lang].visual;

  const steps = [
    {
      step: 1,
      title: lang === "kh" ? "កក់សេវាកម្មក្នុង ៣០ វិនាទី" : "30s Customer Booking",
      desc: lang === "kh" ? "អតិថិជនកក់តាមទូរស័ព្ទជាមួយតម្លៃច្បាស់លាស់" : "Homeowner selects service with upfront pricing",
      icon: Smartphone,
      pulse: lang === "kh" ? "ជូនដំណឹងភ្លាមៗ" : "Instant Push",
    },
    {
      step: 2,
      title: lang === "kh" ? "៣ ចុចចាត់ចែងការងារ" : "3-Click Smart Dispatch",
      desc: lang === "kh" ? "ផ្គូផ្គងជាងដែលនៅជិតបំផុតតាម GPS" : "System routes order to nearest idle technician",
      icon: Monitor,
      pulse: lang === "kh" ? "ផែនទីនាំផ្លូវ" : "GPS Route",
    },
    {
      step: 3,
      title: lang === "kh" ? "ជាងចុះបំពេញការងារ" : "Field GPS Execution",
      desc: lang === "kh" ? "ជាងពិនិត្យបញ្ជីគុណភាព និងថតរូបបញ្ជាក់" : "Tech follows digital checklist & uploads proof",
      icon: Navigation,
      pulse: lang === "kh" ? "ស្កេន KHQR" : "Bakong Scan",
    },
    {
      step: 4,
      title: lang === "kh" ? "ប្រាក់ចូលគណនីភ្លាមៗ" : "Instant Bank Settlement",
      desc: lang === "kh" ? "ផ្ទេរចូលគណនីធនាគារក្រុមហ៊ុនតាម Bakong" : "Revenue deposited directly to business account",
      icon: Landmark,
      pulse: lang === "kh" ? "ជោគជ័យ ១០០%" : "100% Settled",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 sm:p-8 lg:p-10 shadow-xs space-y-8"
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-xs">
          <Zap className="h-3.5 w-3.5 text-slate-700" />
          <span>{lang === "kh" ? "លំហូរដំណើរការស្វ័យប្រវត្តិ" : "Automated Workflow"}</span>
        </div>
        <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {dict.pipelineTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {dict.pipelineSubtitle}
        </p>
      </div>

      {/* Connected 4-Node Flow with Staggered Motion */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative flex flex-col justify-between"
            >
              {/* Card Container */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between h-full cursor-default">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-xs font-bold">
                      {item.step}
                    </span>
                  </div>
                  <h4 className="font-heading text-sm font-bold text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-900" />
                    </span>
                    {item.pulse}
                  </span>
                </div>
              </div>

              {/* Connecting Desktop Arrow */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-xs items-center justify-center text-slate-400">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
