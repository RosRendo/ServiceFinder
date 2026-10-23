"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, Smartphone, ShieldCheck } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView } from "@/components/landing/FadeInView";

interface FinalCtaBandProps {
  lang: "kh" | "en";
  onOpenAppDownload: () => void;
}

export function FinalCtaBand({ lang, onOpenAppDownload }: FinalCtaBandProps) {
  const dict = landingDictionary[lang].finalCta;

  return (
    <section className="py-20 md:py-28 bg-white border-t border-zinc-200/80 px-4 sm:px-6 lg:px-8">
      <FadeInView className="mx-auto max-w-6xl rounded-2xl bg-zinc-950 text-white py-16 px-6 sm:px-12 border border-zinc-900 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 text-xs font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>ServiceFinder Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {dict.heading}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Consumer Card */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-white border border-zinc-700">
                <Smartphone className="h-4 w-4" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {dict.consumerTitle}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {dict.consumerSubtitle}
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onOpenAppDownload}
                type="button"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs px-5 py-2.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>{landingDictionary[lang].nav.downloadApp}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
              </button>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium text-xs px-5 py-2.5 rounded-full transition-all cursor-pointer"
              >
                <span>{dict.learnMore}</span>
              </a>
            </div>
          </div>

          {/* Business Operator Card */}
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-white border border-zinc-700">
                <Building2 className="h-4 w-4" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {dict.companyTitle}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
                {dict.companySubtitle}
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/auth/register?role=company_admin&ref=final_cta"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-medium text-xs px-5 py-2.5 rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <span>{landingDictionary[lang].nav.partnerRegister}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
              </Link>
              <a
                href="#for-business"
                className="inline-flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium text-xs px-5 py-2.5 rounded-full transition-all cursor-pointer"
              >
                <span>{landingDictionary[lang].nav.forBusinesses}</span>
              </a>
            </div>
          </div>
        </div>
      </FadeInView>
    </section>
  );
}
