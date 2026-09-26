"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Headphones, UserCheck, Check, Award, BadgeCheck } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

interface TrustSecurityGuaranteeProps {
  lang: "kh" | "en";
}

export function TrustSecurityGuarantee({ lang }: TrustSecurityGuaranteeProps) {
  const dict = landingDictionary[lang].trust;

  const pillars = [
    {
      id: "license",
      title: dict.verifiedLicense,
      description: dict.verifiedLicenseDesc,
      icon: ShieldCheck,
      badge: lang === "kh" ? "ក្រសួងពាណិជ្ជកម្ម" : "Ministry Verified",
      sealNumber: "MOC-REG #0049281",
    },
    {
      id: "escrow",
      title: dict.escrowProtection,
      description: dict.escrowProtectionDesc,
      icon: Lock,
      badge: lang === "kh" ? "សុវត្ថិភាព ១០០%" : "100% Escrow Vault",
      sealNumber: "ENCRYPTED DEPOSIT",
    },
    {
      id: "mediation",
      title: dict.disputeMediation,
      description: dict.disputeMediationDesc,
      icon: Headphones,
      badge: lang === "kh" ? "ដោះស្រាយ ២៤/៧" : "24/7 Mediation",
      sealNumber: "SLA GUARANTEED",
    },
    {
      id: "technicians",
      title: dict.certifiedTechnicians,
      description: dict.certifiedTechniciansDesc,
      icon: UserCheck,
      badge: lang === "kh" ? "ពិនិត្យប្រវត្តិរូប" : "Police Clearance",
      sealNumber: "BIOMETRIC VERIFIED",
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

        {/* Graphical Seal Emblem Cards Grid with Staggered Motion */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between overflow-hidden cursor-default"
              >
                {/* Top Subtle Stripe */}
                <div className="absolute top-0 inset-x-0 h-1 bg-slate-900 transition-transform duration-300 group-hover:scale-x-105" />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 shadow-xs group-hover:bg-slate-100 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    {/* Graphical Seal Pill */}
                    <div className="flex items-center gap-1 rounded-md bg-slate-50 text-slate-700 px-2.5 py-1 border border-slate-200 text-[10px] font-mono font-bold">
                      <BadgeCheck className="h-3.5 w-3.5 text-slate-900" />
                      <span>{pillar.badge}</span>
                    </div>
                  </div>

                  <h3 className="font-heading text-base font-bold text-slate-900 leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="font-semibold text-slate-500">{pillar.sealNumber}</span>
                  <span className="text-slate-900 font-bold flex items-center gap-1 font-sans">
                    <Check className="h-3 w-3" /> Certified
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
