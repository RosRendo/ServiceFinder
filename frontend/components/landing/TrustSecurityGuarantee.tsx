"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Headphones,
  UserCheck,
  QrCode,
  Wallet,
  Camera,
  Banknote,
  ArrowRight,
  Award,
  Check,
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

interface TrustSecurityGuaranteeProps {
  lang: "kh" | "en";
}

export function TrustSecurityGuarantee({ lang }: TrustSecurityGuaranteeProps) {
  const dict = landingDictionary[lang].trust;
  const hero = landingDictionary[lang].hero;

  const credentialBadges = [
    {
      id: "moc",
      icon: ShieldCheck,
      label: lang === "kh" ? "ចុះបញ្ជីនៅក្រសួងពាណិជ្ជកម្ម" : "Registered company (MoC)",
    },
    {
      id: "bakong",
      icon: QrCode,
      label: hero.trustBakongKhqr,
    },
    {
      id: "background",
      icon: UserCheck,
      label: lang === "kh" ? "ពិនិត្យប្រវត្តិរូប" : "Background-checked Pros",
    },
  ];

  const escrowFlow = [
    {
      id: "pay",
      icon: QrCode,
      label: lang === "kh" ? "អតិថិជនបង់ប្រាក់តាម KHQR" : "Customer pays (KHQR)",
    },
    {
      id: "hold",
      icon: Wallet,
      label: lang === "kh" ? "ប្រាក់កាន់កាប់ជាមួយ Escrow" : "Funds held in escrow",
    },
    {
      id: "verify",
      icon: Camera,
      label: lang === "kh" ? "ការងារបញ្ចប់ ពិនិត្យរូបភាព" : "Job completed, photos verified",
    },
    {
      id: "release",
      icon: Banknote,
      label: lang === "kh" ? "ទូទាត់ប្រាក់ជូនជាង" : "Payout released",
    },
  ];

  const guaranteeRows = [
    {
      id: "license",
      icon: ShieldCheck,
      title: dict.verifiedLicense,
      description: dict.verifiedLicenseDesc,
    },
    {
      id: "mediation",
      icon: Headphones,
      title: dict.disputeMediation,
      description: dict.disputeMediationDesc,
    },
    {
      id: "technicians",
      icon: UserCheck,
      title: dict.certifiedTechnicians,
      description: dict.certifiedTechniciansDesc,
    },
  ];

  return (
    <section id="trust" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-xs">
            <Award className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 space-y-6"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {credentialBadges.map((credential) => {
              const Icon = credential.icon;
              return (
                <div
                  key={credential.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5"
                >
                  <Icon className="h-4 w-4 text-slate-700" />
                  <span className="text-xs font-semibold text-slate-800">
                    {credential.label}
                  </span>
                  <Check className="h-3.5 w-3.5 text-slate-500" />
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="text-center space-y-2">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900">
                {dict.escrowProtection}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                {dict.escrowDesc}
              </p>
            </div>

            <div className="mt-8 flex flex-col md:flex-row md:items-stretch">
              {escrowFlow.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Fragment key={step.id}>
                    {idx > 0 ? (
                      <div
                        className="flex justify-center py-2 md:py-0 md:px-1 md:self-center"
                        aria-hidden="true"
                      >
                        <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0 text-slate-300" />
                      </div>
                    ) : null}
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col items-start gap-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                          <Icon className="h-5 w-5 text-slate-800" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-snug">
                        {step.label}
                      </p>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-xs">
            {guaranteeRows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.id}
                  className="flex items-start gap-4 p-4 sm:p-5"
                >
                  <div className="shrink-0 h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-slate-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {row.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {row.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
