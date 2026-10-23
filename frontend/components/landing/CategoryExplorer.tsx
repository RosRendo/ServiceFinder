"use client";


import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wind,
  Zap,
  Droplet,
  Sparkles,
  Wrench,
  Sun,
  Search,
  ArrowRight,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingDictionary } from "@/lib/landing-dictionary";
import { BEFORE_AFTER_SHOWCASE } from "@/lib/visual-assets";
import { BeforeAfterScrubber } from "@/components/landing/BeforeAfterScrubber";
import { FadeInView, StaggerContainer, StaggerItem } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";

interface CategoryExplorerProps {
  lang: "kh" | "en";
}

export function CategoryExplorer({ lang }: CategoryExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBeforeAfterId, setActiveBeforeAfterId] = useState<string>("ac-coil");
  const router = useRouter();
  const dict = landingDictionary[lang].categories;
  const visualDict = landingDictionary[lang].visual;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/services");
    }
  };

  const activeBeforeAfter =
    BEFORE_AFTER_SHOWCASE.find((item) => item.id === activeBeforeAfterId) ||
    BEFORE_AFTER_SHOWCASE[0];

  const categories = [
    {
      id: "air-conditioning",
      slug: "air-conditioning",
      name: lang === "kh" ? "សេវាកម្មម៉ាស៊ីនត្រជាក់" : "Air Conditioning & HVAC",
      description:
        lang === "kh"
          ? "លាងសម្អាត បញ្ចូលហ្គាស ជួសជុល និងដំឡើងម៉ាស៊ីនត្រជាក់គ្រប់ប្រភេទ"
          : "Deep cleaning, chemical wash, gas refill, repair & installation",
      scope:
        lang === "kh"
          ? "លាងសម្អាតគីមី & ពិនិត្យហ្គាស"
          : "Coil Chemical Wash & Gas Check",
      highlight:
        lang === "kh"
          ? "មកដល់ក្នុង ១២ នាទី • ជាងមានអាជ្ញាប័ណ្ណ"
          : "12m avg arrival • Licensed Pro",
      icon: Wind,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 15,
      providerCount: 142,
      popular: true,
    },
    {
      id: "electrical",
      slug: "electrical",
      name: lang === "kh" ? "សេវាកម្មប្រព័ន្ធអគ្គិសនី" : "Electrical & Wiring",
      description:
        lang === "kh"
          ? "ជួសជុលទុស្សេខ្សែភ្លើង ដំឡើងកុងតាក់ ឌីសង់ទ័រ និងប្រព័ន្ធភ្លើងផ្ទះ"
          : "Circuit repair, breaker box replacement, rewiring & diagnostics",
      scope:
        lang === "kh"
          ? "ប្រអប់ភ្លើងមេ & ខ្សែភ្លើង 3-Phase"
          : "Circuit Breaker & 3-Phase Rewire",
      highlight:
        lang === "kh"
          ? "ជាងភ្លើងកម្រិតជាន់ខ្ពស់ • ធានាគុណភាព"
          : "Certified Electrician • 15m ETA",
      icon: Zap,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 18,
      providerCount: 96,
      popular: true,
    },
    {
      id: "plumbing",
      slug: "plumbing",
      name: lang === "kh" ? "សេវាកម្មជួសជុលទុយោទឹក" : "Plumbing & Drainage",
      description:
        lang === "kh"
          ? "ដោះស្រាយបញ្ហាស្ទះទុយោ លេចធ្លាយទឹក ដំឡើងម៉ូទ័រ និងឧបករណ៍បន្ទប់ទឹក"
          : "Leak detection, pipe repairs, unclogging & water pump installation",
      scope:
        lang === "kh"
          ? "ម៉ូទ័របូមទឹក & ដោះស្ទះទុយោទឹក"
          : "Water Booster Pump & Pipe Leak",
      highlight:
        lang === "kh"
          ? "ឧបករណ៍រកកន្លែងលេចធ្លាយទំនើប"
          : "Leak Detection Tools • Fast Fix",
      icon: Droplet,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 15,
      providerCount: 114,
      popular: false,
    },
    {
      id: "cleaning",
      slug: "cleaning",
      name: lang === "kh" ? "សេវាកម្មសម្អាតទូទៅ" : "Deep Home & Office Cleaning",
      description:
        lang === "kh"
          ? "សម្អាតគេហដ្ឋាន បោកពូក សាឡុង សម្អាតមុនចូលនៅ និងការិយាល័យ"
          : "Post-construction cleaning, sofa & mattress shampooing, office janitorial",
      scope:
        lang === "kh"
          ? "បោសសម្អាតវីឡា & បោកពូកសាឡុង"
          : "Villa Cleaning & Deep Sofa Shampoo",
      highlight:
        lang === "kh"
          ? "បុគ្គលិកត្រួតពិនិត្យប្រវត្តិរូប ១០០%"
          : "Police Cleared Crew • 5-Star",
      icon: Sparkles,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 25,
      providerCount: 218,
      popular: true,
    },
    {
      id: "handyman",
      slug: "handyman",
      name: lang === "kh" ? "សេវាកម្មជួសជុលទូទៅ" : "Handyman & Appliance",
      description:
        lang === "kh"
          ? "ជួសជុលទូទឹកកក ម៉ាស៊ីនបោកគក់ ចាក់សោរ និងការងារជាងទូទៅ"
          : "Washing machine, refrigerator, furniture assembly & lock services",
      scope:
        lang === "kh"
          ? "គ្រឿងអេឡិចត្រូនិក & ដំឡើងសម្ភារ"
          : "Appliance Repair & Lock Assembly",
      highlight:
        lang === "kh"
          ? "ជាងចម្រុះមុខងាររហ័ស"
          : "Multi-Trade Toolkit • On-Demand",
      icon: Wrench,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 20,
      providerCount: 88,
      popular: false,
    },
    {
      id: "solar",
      slug: "solar",
      name: lang === "kh" ? "សេវាកម្មថាមពលពន្លឺព្រះអាទិត្យ" : "Solar & Inverter Services",
      description:
        lang === "kh"
          ? "ដំឡើង ថែទាំ និងត្រួតពិនិត្យប្រព័ន្ធសូឡាគេហដ្ឋាន និងអាជីវកម្ម"
          : "Residential solar maintenance, inverter inspection & panel cleaning",
      scope:
        lang === "kh"
          ? "ត្រួតពិនិត្យ Inverter & បន្ទះសូឡា"
          : "Solar Inverter Health & Rooftop Panels",
      highlight:
        lang === "kh"
          ? "អ្នកជំនាញថាមពលស្អាត"
          : "Clean Energy Pros • Warranty",
      icon: Sun,
      iconBg: "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-zinc-950 group-hover:text-white transition-colors",
      startingPrice: 50,
      providerCount: 42,
      popular: false,
    },
  ];

  const featuredSlugs = ["air-conditioning", "cleaning"];
  const featuredCategories = featuredSlugs
    .map((slug) => categories.find((cat) => cat.slug === slug))
    .filter((cat): cat is (typeof categories)[number] => Boolean(cat));
  const compactCategories = categories.filter(
    (cat) => !featuredSlugs.includes(cat.slug)
  );

  return (
    <section id="services" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </FadeInView>

        {/* Instant Search Bar */}
        <FadeInView delay={0.1} className="mt-8 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 transition-all"
          >
            <div className="pl-3 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={dict.exploreServices}
              placeholder={
                lang === "kh"
                  ? "ស្វែងរកសេវាកម្ម (ឧទាហរណ៍៖ ម៉ាស៊ីនត្រជាក់ ភ្លើង ទុយោទឹក សម្អាត)..."
                  : "Search verified services (e.g. AC cleaning, electrical, plumbing)..."
              }
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
            />
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shrink-0 cursor-pointer"
            >
              <span>{lang === "kh" ? "ស្វែងរក" : "Search"}</span>
            </Button>
          </form>
        </FadeInView>

        {/* Visual Proof Centerpiece: Interactive Before/After Scrubber */}
        <FadeInView delay={0.15} className="mt-14 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Scrubber Left Details */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800">
                <Sparkle className="h-3.5 w-3.5 text-slate-700" />
                <span>{visualDict.beforeAfterTitle}</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {lang === "kh" ? activeBeforeAfter.titleKh : activeBeforeAfter.titleEn}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {visualDict.beforeAfterSubtitle}
              </p>

              {/* Scenario Toggle Buttons */}
              <div className="flex gap-2 pt-2">
                {BEFORE_AFTER_SHOWCASE.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveBeforeAfterId(item.id)}
                    aria-pressed={activeBeforeAfterId === item.id}
                    className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeBeforeAfterId === item.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.trade}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {lang === "kh"
                    ? "ការធានាលើការជួសជុល និងលាងសម្អាតរយៈពេល ៣០ ថ្ងៃ"
                    : "Backed by 30-Day Workmanship Guarantee"}
                </span>
              </div>
            </div>

            {/* Scrubber Right: Interactive Dual-Image Handle */}
            <div className="lg:col-span-7">
              <BeforeAfterScrubber
                beforeImage={activeBeforeAfter.beforeUrl}
                afterImage={activeBeforeAfter.afterUrl}
                beforeLabel={
                  lang === "kh"
                    ? activeBeforeAfter.beforeLabelKh
                    : activeBeforeAfter.beforeLabelEn
                }
                afterLabel={
                  lang === "kh"
                    ? activeBeforeAfter.afterLabelKh
                    : activeBeforeAfter.afterLabelEn
                }
                className="w-full"
              />
            </div>
          </div>
        </FadeInView>

        {/* Featured Popular Trade Cards (Price-Forward Hero Row) */}
        <StaggerContainer className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.08}>
          {featuredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <StaggerItem key={cat.id} className="flex">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full flex"
                >
                  <Link
                    href={`/services?category=${cat.slug}`}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all flex flex-col justify-between w-full select-none md:min-h-[220px]"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${cat.iconBg}`}>
                          <Icon className="h-7 w-7 stroke-[2]" />
                        </div>

                        <div className="flex items-center gap-2">
                          {cat.popular && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 text-[11px] font-bold leading-snug">
                              {lang === "kh" ? "ពេញនិយម" : "Popular"}
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {cat.providerCount} {dict.verifiedPros}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                          {cat.scope}
                        </p>
                      </div>

                      <div className="mt-3.5 flex items-center gap-2 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">{cat.highlight}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                          {dict.startingFrom}
                        </span>
                        <span className="font-heading text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          ${cat.startingPrice}.00
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 bg-slate-900 group-hover:bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-xs group-hover:translate-x-0.5">
                        <span>{lang === "kh" ? "កក់ឥឡូវនេះ" : "Book Pro"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Compact Trade Cards Grid */}
        <StaggerContainer className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" staggerDelay={0.08}>
          {compactCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <StaggerItem key={cat.id} className="flex">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-full flex"
                >
                  <Link
                    href={`/services?category=${cat.slug}`}
                    className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between w-full select-none"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${cat.iconBg}`}>
                          <Icon className="h-5 w-5 stroke-[2]" />
                        </div>
                        <h3 className="font-heading text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {cat.name}
                        </h3>
                        {cat.popular && (
                          <span className="ml-auto shrink-0 rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-[10.5px] font-bold leading-snug">
                            {lang === "kh" ? "ពេញនិយម" : "Popular"}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500 font-medium leading-snug">
                        {cat.scope}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">
                        {cat.providerCount} {dict.verifiedPros}
                      </span>
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {dict.startingFrom}
                        </span>
                        <span className="font-heading text-base font-black text-slate-900">
                          ${cat.startingPrice}.00
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1 bg-slate-900 group-hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all shadow-xs group-hover:translate-x-0.5">
                        <span>{lang === "kh" ? "កក់ឥឡូវនេះ" : "Book Pro"}</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* View All CTA */}
        <FadeInView delay={0.2} className="mt-12 text-center">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <Link
              href="/services"
              className="inline-flex items-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              <span>{dict.viewAllCta}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </FadeInView>
      </div>
    </section>
  );
}
