/* eslint-disable @next/next/no-img-element */
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
import { TRADE_IMAGES, BEFORE_AFTER_SHOWCASE } from "@/lib/visual-assets";
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
      icon: Wind,
      startingPrice: 15,
      providerCount: 142,
      popular: true,
      image: TRADE_IMAGES.ac.imageUrl,
      badge: lang === "kh" ? "ជាងជំនាញមានអាជ្ញាប័ណ្ណ" : "Licensed HVAC Crew",
    },
    {
      id: "electrical",
      slug: "electrical",
      name: lang === "kh" ? "សេវាកម្មប្រព័ន្ធអគ្គិសនី" : "Electrical & Wiring",
      description:
        lang === "kh"
          ? "ជួសជុលទុស្សេខ្សែភ្លើង ដំឡើងកុងតាក់ ឌីសង់ទ័រ និងប្រព័ន្ធភ្លើងផ្ទះ"
          : "Circuit repair, breaker box replacement, rewiring & diagnostics",
      icon: Zap,
      startingPrice: 18,
      providerCount: 96,
      popular: true,
      image: TRADE_IMAGES.electrical.imageUrl,
      badge: lang === "kh" ? "ជាងអគ្គិសនីបញ្ជាក់គុណភាព" : "Certified Electricians",
    },
    {
      id: "plumbing",
      slug: "plumbing",
      name: lang === "kh" ? "សេវាកម្មជួសជុលទុយោទឹក" : "Plumbing & Drainage",
      description:
        lang === "kh"
          ? "ដោះស្រាយបញ្ហាស្ទះទុយោ លេចធ្លាយទឹក ដំឡើងម៉ូទ័រ និងឧបករណ៍បន្ទប់ទឹក"
          : "Leak detection, pipe repairs, unclogging & water pump installation",
      icon: Droplet,
      startingPrice: 15,
      providerCount: 114,
      popular: false,
      image: TRADE_IMAGES.plumbing.imageUrl,
      badge: lang === "kh" ? "ជាងទុយោទឹកជំនាញ" : "Master Plumbers",
    },
    {
      id: "cleaning",
      slug: "cleaning",
      name: lang === "kh" ? "សេវាកម្មសម្អាតទូទៅ" : "Deep Home & Office Cleaning",
      description:
        lang === "kh"
          ? "សម្អាតគេហដ្ឋាន បោកពូក សាឡុង សម្អាតមុនចូលនៅ និងការិយាល័យ"
          : "Post-construction cleaning, sofa & mattress shampooing, office janitorial",
      icon: Sparkles,
      startingPrice: 25,
      providerCount: 218,
      popular: true,
      image: TRADE_IMAGES.cleaning.imageUrl,
      badge: lang === "kh" ? "បុគ្គលិកត្រួតពិនិត្យប្រវត្តិរូប" : "Police Cleared Staff",
    },
    {
      id: "handyman",
      slug: "handyman",
      name: lang === "kh" ? "សេវាកម្មជួសជុលទូទៅ" : "Handyman & Appliance",
      description:
        lang === "kh"
          ? "ជួសជុលទូទឹកកក ម៉ាស៊ីនបោកគក់ ចាក់សោរ និងការងារជាងទូទៅ"
          : "Washing machine, refrigerator, furniture assembly & lock services",
      icon: Wrench,
      startingPrice: 20,
      providerCount: 88,
      popular: false,
      image: TRADE_IMAGES.handyman.imageUrl,
      badge: lang === "kh" ? "ជាងជួសជុលចម្រុះមុខងារ" : "Multi-Trade Pros",
    },
    {
      id: "solar",
      slug: "solar",
      name: lang === "kh" ? "សេវាកម្មថាមពលពន្លឺព្រះអាទិត្យ" : "Solar & Inverter Services",
      description:
        lang === "kh"
          ? "ដំឡើង ថែទាំ និងត្រួតពិនិត្យប្រព័ន្ធសូឡាគេហដ្ឋាន និងអាជីវកម្ម"
          : "Residential solar maintenance, inverter inspection & panel cleaning",
      icon: Sun,
      startingPrice: 50,
      providerCount: 42,
      popular: false,
      image: TRADE_IMAGES.solar.imageUrl,
      badge: lang === "kh" ? "អ្នកជំនាញថាមពលស្អាត" : "Clean Energy Pros",
    },
  ];

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
              placeholder={
                lang === "kh"
                  ? "ស្វែងរកសេវាកម្ម (ឧទាហរណ៍៖ ម៉ាស៊ីនត្រជាក់ ភ្លើង ទុយោទឹក សម្អាត)..."
                  : "Search verified services (e.g. AC cleaning, electrical, plumbing)..."
              }
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5"
            />
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shrink-0 cursor-pointer"
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
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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

        {/* High-Resolution Visual Trade Cards Grid */}
        <StaggerContainer className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
          {categories.map((cat) => {
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
                    className="group relative rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-xs hover:shadow-xl hover:border-slate-400 transition-all flex flex-col justify-end min-h-[300px] w-full"
                  >
                    {/* Background Trade Photography with Gradient Overlay */}
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
                      <span className="rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700 px-3 py-1 text-[10px] font-bold text-slate-200">
                        {cat.badge}
                      </span>
                      {cat.popular && (
                        <span className="rounded-full bg-amber-500/90 text-slate-950 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Card Bottom Content with High Contrast Text */}
                    <div className="relative z-10 p-5 space-y-2 text-white">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-white backdrop-blur-xs">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
                          {cat.name}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                        {cat.description}
                      </p>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            {dict.startingFrom}
                          </span>
                          <span className="text-base font-black text-white">
                            ${cat.startingPrice}.00
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-300 font-medium text-[11px]">
                          <span>{cat.providerCount}</span>
                          <span>{dict.verifiedPros}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-white ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
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
            <Link href="/services">
              <Button
                variant="outline"
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <span>{dict.viewAllCta}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </motion.div>
        </FadeInView>
      </div>
    </section>
  );
}
