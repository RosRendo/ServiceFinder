"use client";

import { Check, X, Zap } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView } from "@/components/landing/FadeInView";

interface ComparisonTableProps {
  lang: "kh" | "en";
}

export function ComparisonTable({ lang }: ComparisonTableProps) {
  const dict = landingDictionary[lang].comparison;

  const comparisonData = [
    {
      feature: dict.f1Title,
      sf: dict.f1Sf,
      trad: dict.f1Trad,
    },
    {
      feature: dict.f2Title,
      sf: dict.f2Sf,
      trad: dict.f2Trad,
    },
    {
      feature: dict.f3Title,
      sf: dict.f3Sf,
      trad: dict.f3Trad,
    },
    {
      feature: dict.f4Title,
      sf: dict.f4Sf,
      trad: dict.f4Trad,
    },
    {
      feature: dict.f5Title,
      sf: dict.f5Sf,
      trad: dict.f5Trad,
    },
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <Zap className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </FadeInView>

        {/* High-Contrast Comparison Matrix */}
        <FadeInView delay={0.15} className="mt-12 overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
            <div className="p-4 md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50 text-slate-600">
              {dict.colFeature}
            </div>
            <div className="p-4 md:col-span-4 bg-slate-900 text-white border-b md:border-b-0 md:border-r border-slate-900 flex items-center justify-between">
              <span>{dict.colServiceFinder}</span>
              <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] text-white font-mono font-bold">
                ENTERPRISE OS
              </span>
            </div>
            <div className="p-4 md:col-span-4 bg-slate-50 text-slate-500">
              {dict.colTraditional}
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {comparisonData.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-12 text-sm hover:bg-slate-50/50 transition-colors"
              >
                {/* Feature Name */}
                <div className="p-4 md:col-span-4 font-bold text-slate-900 border-b md:border-b-0 md:border-r border-slate-200 flex items-center">
                  {item.feature}
                </div>

                {/* ServiceFinder OS Value */}
                <div className="p-4 md:col-span-4 bg-slate-50/60 text-slate-900 border-b md:border-b-0 md:border-r border-slate-200 flex items-start gap-2.5">
                  <div className="rounded-full bg-slate-900 p-1 text-white shrink-0 mt-0.5 shadow-xs">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {item.sf}
                  </span>
                </div>

                {/* Traditional Methods Value */}
                <div className="p-4 md:col-span-4 text-slate-500 flex items-start gap-2.5 bg-white">
                  <div className="rounded-full bg-slate-100 p-1 text-slate-400 shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs sm:text-sm leading-relaxed">
                    {item.trad}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
