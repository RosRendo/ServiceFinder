"use client";

import { QrCode, ShieldCheck, Zap, Lock, Landmark, Check } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";

/* eslint-disable @next/next/no-img-element */
interface PaymentCredibilityProps {
  lang: "kh" | "en";
}

export function PaymentCredibility({ lang }: PaymentCredibilityProps) {
  const dict = landingDictionary[lang].payments;

  const paymentPartners = [
    { name: "NBC Bakong KHQR", type: "National Standard", highlight: true, imageSrc: "/KHQR.png" },
    { name: "ABA Pay Mobile", type: "Digital Merchant", highlight: false, imageSrc: "/ABA.png" },
    { name: "Wing Bank KHQR", type: "Nationwide Rail", highlight: false, imageSrc: "/Wing.png" },
    { name: "ACLEDA Mobile", type: "Commercial Bank", highlight: false, imageSrc: "/ACLEDA.png" },
    { name: "Canadia Bank", type: "Commercial Bank", highlight: false, imageSrc: "/CANADIA.jpg" },
    { name: "Vattanac Bank", type: "Commercial Bank", highlight: false, imageSrc: "/VATTANAC.png" },
  ];

  return (
    <section className="py-20 bg-slate-950 text-white relative overflow-hidden border-t border-slate-800">
      {/* Subtle Background Structural Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Local Fintech Credentials */}
          <FadeInView direction="left" className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3.5 py-1 text-xs font-bold text-slate-300">
              <QrCode className="h-3.5 w-3.5 text-white" />
              <span>{dict.bakongBadge}</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {dict.title}
            </h2>

            <p className="text-base text-slate-300 font-medium leading-relaxed">
              {dict.subtitle}
            </p>

            {/* Visual Feature Blocks */}
            <div className="space-y-4 pt-2">
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/10 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {dict.instantPayoutsTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {dict.instantPayoutsDesc}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 text-white border border-white/10 shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {dict.escrowTitle}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {dict.escrowDesc}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </FadeInView>

          {/* Right Column: Visual Simulated Bakong KHQR Payment Terminal */}
          <FadeInView direction="right" delay={0.15} className="lg:col-span-6">
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm"
            >
              {/* Top Terminal Screen */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 text-center">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="rounded-md bg-red-600 text-white font-black text-[10px] px-2 py-0.5 tracking-wider">
                    KHQR
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    NATIONAL BANK OF CAMBODIA
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* Stylized QR Code with Authentic KHQR Header */}
                <div className="mx-auto w-40 h-40 rounded-xl bg-white p-3 shadow-inner flex flex-col items-center justify-center relative">
                  <QrCode className="h-32 w-32 text-slate-950" />
                </div>

                <div className="space-y-1">
                  <div className="text-xl font-black text-white tracking-tight">
                    $45.00 <span className="text-xs font-normal text-slate-400">USD</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scan with ABA, Wing, ACLEDA, or any Bakong App
                  </p>
                </div>
              </div>

              {/* Supported Payment Rails Pills */}
              <StaggerContainer className="mt-6 grid grid-cols-2 gap-2.5" staggerDelay={0.05}>
                {paymentPartners.map((partner, index) => (
                  <StaggerItem key={index}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-xl p-2.5 sm:p-3 border transition-all flex items-center justify-between cursor-default ${
                        partner.highlight
                          ? "border-white/20 bg-white/10 text-white"
                          : "border-slate-800 bg-slate-950/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                          <img
                            src={partner.imageSrc}
                            alt={partner.name}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-xs font-bold truncate">{partner.name}</span>
                      </div>
                      <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1.5" />
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-white" />
                  Bank-Grade TLS 1.3 Encryption
                </span>
                <span className="text-white font-bold">
                  Zero Delay Settlement
                </span>
              </div>
            </motion.div>
          </FadeInView>
        </div>
      </div>
    </section>
  );
}
