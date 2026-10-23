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

  const bestDiffIndex = 2;

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

        <FadeInView delay={0.15} className="mt-12">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left border-collapse">
                <colgroup>
                  <col className="w-[38%]" />
                  <col className="w-[31%]" />
                  <col className="w-[31%]" />
                </colgroup>
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-wider">
                    <th
                      scope="col"
                      className="p-4 border-r border-slate-200 bg-slate-50 text-slate-600"
                    >
                      {dict.colFeature}
                    </th>
                    <th
                      scope="col"
                      className="p-4 border-r border-primary/20 bg-primary text-primary-foreground"
                    >
                      <span className="flex items-center justify-between">
                        <span>{dict.colServiceFinder}</span>
                        <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-mono font-bold">
                          ENTERPRISE OS
                        </span>
                      </span>
                    </th>
                    <th scope="col" className="p-4 bg-slate-50 text-slate-500">
                      {dict.colTraditional}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparisonData.map((item, index) => {
                    const isBestDiff = index === bestDiffIndex;
                    return (
                      <tr
                        key={index}
                        className={
                          isBestDiff
                            ? "bg-accent"
                            : "hover:bg-slate-50/50 transition-colors"
                        }
                      >
                        <th
                          scope="row"
                          className={`p-4 align-top border-r border-slate-200 font-bold border-b md:border-b-0 ${
                            isBestDiff ? "text-slate-900" : ""
                          }`}
                        >
                          <span className="text-sm text-slate-900 flex items-center gap-2">
                            <span>{item.feature}</span>
                            {isBestDiff && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-bold text-primary-foreground uppercase">
                                <Zap className="h-3 w-3" />
                                <span className={lang === "kh" ? "text-[11px]" : ""}>
                                  {dict.proofChip}
                                </span>
                              </span>
                            )}
                          </span>
                        </th>
                        <td className="p-4 align-top border-r border-primary/20 border-b md:border-b-0 bg-primary/5">
                          <span className="flex items-start gap-2.5 text-slate-900">
                            <span className="rounded-full bg-primary p-1 text-white shrink-0 mt-0.5 shadow-xs">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs sm:text-sm font-semibold leading-relaxed">
                              {item.sf}
                            </span>
                          </span>
                        </td>
                        <td className="p-4 align-top text-slate-500 border-b md:border-b-0">
                          <span className="flex items-start gap-2.5">
                            <span className="rounded-full bg-slate-100 p-1 text-slate-400 shrink-0 mt-0.5">
                              <X className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-xs sm:text-sm leading-relaxed">
                              {item.trad}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
