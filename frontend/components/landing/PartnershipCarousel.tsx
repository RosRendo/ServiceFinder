/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Building2,
  Building,
  CreditCard,
  QrCode,
  Home,
  Wind,
  Zap,
  Cpu,
  Wrench,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Handshake,
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DaikinLogo,
  PanasonicLogo,
  SchneiderElectricLogo,
  BoschLogo,
  VisaMastercardLogo,
  BoreyPengHuothLogo,
  UrbanVillageLogo,
  SathapanaLogo,
  CamPaintLogo,
} from "@/components/landing/PartnerLogos";

interface PartnershipCarouselProps {
  lang: "kh" | "en";
}

type PartnerCategory = "all" | "finance" | "property" | "equipment";

interface PartnerItem {
  id: string;
  name: string;
  category: "finance" | "property" | "equipment";
  categoryLabelEn: string;
  categoryLabelKh: string;
  badgeEn: string;
  badgeKh: string;
  icon: typeof Landmark;
  tier: "tier1" | "certified";
  imageSrc?: string;
  logoComponent?: React.ComponentType<{ className?: string }>;
}

export function PartnershipCarousel({ lang }: PartnershipCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<PartnerCategory>("all");
  const dict = landingDictionary[lang].partnerships;

  // Track 1: Financial Rails & National Payment Infrastructure (Moving Left)
  const financialPartners: PartnerItem[] = [
    {
      id: "bakong",
      name: "NBC Bakong KHQR",
      category: "finance",
      categoryLabelEn: "National Payment Standard",
      categoryLabelKh: "ស្តង់ដារទូទាត់ជាតិ",
      badgeEn: "National Bank of Cambodia",
      badgeKh: "ធនាគារជាតិនៃកម្ពុជា",
      icon: Landmark,
      tier: "tier1",
      imageSrc: "/KHQR.png",
    },
    {
      id: "aba",
      name: "ABA Bank Enterprise",
      category: "finance",
      categoryLabelEn: "Commercial Banking Rail",
      categoryLabelKh: "ប្រព័ន្ធធនាគារពាណិជ្ជ",
      badgeEn: "Instant Merchant Settlement",
      badgeKh: "ទូទាត់ប្រាក់ភ្លាមៗ",
      icon: CreditCard,
      tier: "tier1",
      imageSrc: "/ABA.png",
    },
    {
      id: "wing",
      name: "Wing Bank Commercial",
      category: "finance",
      categoryLabelEn: "Nationwide Payment Rails",
      categoryLabelKh: "បណ្តាញទូទាត់ទូទាំងប្រទេស",
      badgeEn: "Zero Delay Payouts",
      badgeKh: "គ្មានការពន្យារពេល",
      icon: QrCode,
      tier: "tier1",
      imageSrc: "/Wing.png",
    },
    {
      id: "acleda",
      name: "ACLEDA Bank Plc",
      category: "finance",
      categoryLabelEn: "Commercial Network",
      categoryLabelKh: "បណ្តាញធនាគារពាណិជ្ជកម្ម",
      badgeEn: "Nationwide Rail",
      badgeKh: "គ្របដណ្តប់ទូទាំងប្រទេស",
      icon: Building,
      tier: "tier1",
      imageSrc: "/ACLEDA.png",
    },
    {
      id: "canadia",
      name: "Canadia Bank Corporate",
      category: "finance",
      categoryLabelEn: "Corporate Financial Rails",
      categoryLabelKh: "ប្រព័ន្ធហិរញ្ញវត្ថុសាជីវកម្ម",
      badgeEn: "Escrow Integration",
      badgeKh: "ភ្ជាប់ប្រព័ន្ធ Escrow",
      icon: Landmark,
      tier: "certified",
      imageSrc: "/CANADIA.jpg",
    },
    {
      id: "vattanac",
      name: "Vattanac Bank",
      category: "finance",
      categoryLabelEn: "Commercial Banking",
      categoryLabelKh: "ធនាគារពាណិជ្ជកម្មវឌ្ឍនៈ",
      badgeEn: "Enterprise Rail",
      badgeKh: "ប្រព័ន្ធទូទាត់សាជីវកម្ម",
      icon: Building2,
      tier: "certified",
      imageSrc: "/VATTANAC.png",
    },
    {
      id: "sathapana",
      name: "Sathapana Bank",
      category: "finance",
      categoryLabelEn: "Digital SME Banking",
      categoryLabelKh: "ធនាគារឌីជីថលសម្រាប់សហគ្រាស",
      badgeEn: "Verified Rail",
      badgeKh: "ដៃគូបញ្ជាក់គុណភាព",
      icon: Building2,
      tier: "certified",
      logoComponent: SathapanaLogo,
    },
    {
      id: "visa-mc",
      name: "Visa & Mastercard Business",
      category: "finance",
      categoryLabelEn: "Global Card Processing",
      categoryLabelKh: "ដំណើរការកាតសកល",
      badgeEn: "Bank-Grade Encryption",
      badgeKh: "សុវត្ថិភាពស្តង់ដារធនាគារ",
      icon: CreditCard,
      tier: "tier1",
      logoComponent: VisaMastercardLogo,
    },
  ];

  // Track 2: Premier Developers, Real Estate Communities & Trade Brands (Moving Right)
  const industryPartners: PartnerItem[] = [
    {
      id: "chipmong",
      name: "Chip Mong Land & Facilities",
      category: "property",
      categoryLabelEn: "Commercial & Residential",
      categoryLabelKh: "អចលនទ្រព្យ និងសំណង់ពាណិជ្ជកម្ម",
      badgeEn: "Enterprise Dispatch Partner",
      badgeKh: "ដៃគូចាត់ចែងសេវាកម្ម",
      icon: Building2,
      tier: "tier1",
      imageSrc: "/CHIPMONG.jpg",
    },
    {
      id: "penghuoth",
      name: "Borey Peng Huoth Group",
      category: "property",
      categoryLabelEn: "Premier Residential Community",
      categoryLabelKh: "បុរីលំនៅឋានឈានមុខគេ",
      badgeEn: "45+ Integrated Subdivisions",
      badgeKh: "៤៥+ គម្រោងបុរីដៃគូ",
      icon: Home,
      tier: "tier1",
      logoComponent: BoreyPengHuothLogo,
    },
    {
      id: "urbanvillage",
      name: "Urban Village Phnom Penh",
      category: "property",
      categoryLabelEn: "Smart Community Living",
      categoryLabelKh: "សហគមន៍ឆ្លាតវៃភ្នំពេញ",
      badgeEn: "Resident Portal Partner",
      badgeKh: "ប្រព័ន្ធបម្រើសេវាអ្នករស់នៅ",
      icon: Building,
      tier: "certified",
      logoComponent: UrbanVillageLogo,
    },
    {
      id: "daikin",
      name: "Daikin Air Conditioning",
      category: "equipment",
      categoryLabelEn: "Official HVAC Technology",
      categoryLabelKh: "បច្ចេកវិទ្យាម៉ាស៊ីនត្រជាក់ផ្លូវការ",
      badgeEn: "Certified Inverter Fleet",
      badgeKh: "ជាងទទួលបានវិញ្ញាបនបត្រ",
      icon: Wind,
      tier: "tier1",
      logoComponent: DaikinLogo,
    },
    {
      id: "panasonic",
      name: "Panasonic HVAC Solutions",
      category: "equipment",
      categoryLabelEn: "Smart Inverter & Air Quality",
      categoryLabelKh: "ប្រព័ន្ធត្រជាក់ និងខ្យល់ស្អាត",
      badgeEn: "Factory Spare Parts Partner",
      badgeKh: "គ្រឿងបន្លាស់សុទ្ធពីរោងចក្រ",
      icon: Zap,
      tier: "tier1",
      logoComponent: PanasonicLogo,
    },
    {
      id: "schneider",
      name: "Schneider Electric",
      category: "equipment",
      categoryLabelEn: "Electrical Distribution Gear",
      categoryLabelKh: "ឧបករណ៍ចែកចាយប្រព័ន្ធភ្លើង",
      badgeEn: "IEC Safety Standard",
      badgeKh: "ស្តង់ដារសុវត្ថិភាពអន្តរជាតិ",
      icon: Cpu,
      tier: "tier1",
      logoComponent: SchneiderElectricLogo,
    },
    {
      id: "bosch",
      name: "Bosch Professional Tools",
      category: "equipment",
      categoryLabelEn: "Heavy-Duty Fleet Equipment",
      categoryLabelKh: "ឧបករណ៍ជាងជំនាញកម្រិតខ្ពស់",
      badgeEn: "Precision Fleet Standards",
      badgeKh: "ស្តង់ដារបច្ចេកទេសជាក់លាក់",
      icon: Wrench,
      tier: "certified",
      logoComponent: BoschLogo,
    },
    {
      id: "campaint",
      name: "Cam-Paint Manufacturing",
      category: "equipment",
      categoryLabelEn: "Architectural & Industrial Coatings",
      categoryLabelKh: "ថ្នាំពណ៌សំណង់គុណភាពខ្ពស់",
      badgeEn: "Kingdom-Wide Distribution",
      badgeKh: "ចែកចាយទូទាំងព្រះរាជាណាចក្រ",
      icon: Sparkles,
      tier: "certified",
      logoComponent: CamPaintLogo,
    },
  ];

  // Helper renderer for a single partner card with real image or authentic vector mark
  const renderPartnerCard = (item: PartnerItem, keyPrefix: string) => {
    const isFiltered = activeCategory !== "all" && item.category !== activeCategory;
    const LogoComp = item.logoComponent;

    return (
      <div
        key={`${keyPrefix}-${item.id}`}
        className={`group relative rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs hover:border-slate-400 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center gap-3.5 shrink-0 min-w-[270px] sm:min-w-[300px] cursor-pointer ${
          isFiltered ? "opacity-30 grayscale" : "opacity-100"
        }`}
      >
        {/* Real Brand Logo Container */}
        {item.imageSrc ? (
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-slate-300 transition-colors">
            <img
              src={item.imageSrc}
              alt={item.name}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : LogoComp ? (
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white p-1.5 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-slate-800 transition-colors overflow-hidden">
            <LogoComp className="h-6 w-auto max-w-full" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-slate-800 transition-colors">
            <Landmark className="h-5 w-5 text-white" />
          </div>
        )}

        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate block group-hover:text-slate-950">
              {item.name}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          </div>

          <p className="text-[11px] text-slate-500 truncate">
            {lang === "kh" ? item.categoryLabelKh : item.categoryLabelEn}
          </p>

          <div className="pt-1 flex items-center gap-1.5">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-700">
              {lang === "kh" ? item.badgeKh : item.badgeEn}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200 relative overflow-hidden">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeInView className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1 text-xs font-bold text-slate-700 shadow-xs">
            <Handshake className="h-3.5 w-3.5 text-slate-900" />
            <span>{dict.sectionBadge}</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 leading-tight">
            {dict.title}
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </FadeInView>

        {/* Strategic Trust Pillars Strip */}
        <FadeInView delay={0.1} className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              FINANCIAL RAILS
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
              {dict.statBakong}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              LICENSED ENTERPRISES
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
              {dict.statProviders}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              RESIDENTIAL COMMUNITIES
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
              {dict.statBoreys}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
              CONSUMER TRUST
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block">
              {dict.statEscrow}
            </span>
          </div>
        </FadeInView>

        {/* Interactive Category Filter Pills */}
        <FadeInView delay={0.15} className="mt-8 flex flex-wrap justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {lang === "kh" ? "ដៃគូសហការទាំងអស់" : "All Ecosystem Partners"}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("finance")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === "finance"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {lang === "kh" ? "ស្ថាប័នហិរញ្ញវត្ថុ & KHQR" : "Banking & KHQR Rails"}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("property")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === "property"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {lang === "kh" ? "ក្រុមហ៊ុនអភិវឌ្ឍន៍បុរី & អចលនទ្រព្យ" : "Property Developers & Boreys"}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("equipment")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
              activeCategory === "equipment"
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {lang === "kh" ? "ម៉ាកឧបករណ៍បច្ចេកទេស" : "Equipment & HVAC Brands"}
          </button>
        </FadeInView>

        {/* Dual-Track Smooth Infinite Marquee Carousel */}
        <div className="mt-10 space-y-4">
          {/* Track 1: Financial Rails (Left direction) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>{dict.financialRailsTrack}</span>
              <span>DIRECT NBC INTEGRATION</span>
            </div>

            <div className="w-full overflow-hidden marquee-mask py-1">
              <div className="flex gap-4 w-max animate-marquee">
                {financialPartners.map((item) => renderPartnerCard(item, "f1"))}
                {financialPartners.map((item) => renderPartnerCard(item, "f2"))}
              </div>
            </div>
          </div>

          {/* Track 2: Property Developers & Technical Brands (Reverse / Right direction) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>{dict.developersTrack}</span>
              <span>COMMERCIAL ECOSYSTEM</span>
            </div>

            <div className="w-full overflow-hidden marquee-mask py-1">
              <div className="flex gap-4 w-max animate-marquee-reverse">
                {industryPartners.map((item) => renderPartnerCard(item, "i1"))}
                {industryPartners.map((item) => renderPartnerCard(item, "i2"))}
              </div>
            </div>
          </div>
        </div>

        {/* Partnership Onboarding Callout Banner */}
        <FadeInView delay={0.2} className="mt-12 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:px-6 shadow-xs max-w-3xl mx-auto">
            <div className="text-left space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                {lang === "kh"
                  ? "តើលោកអ្នកជាក្រុមហ៊ុនសេវាកម្ម ធនាគារ ឬក្រុមហ៊ុនអភិវឌ្ឍន៍បុរី?"
                  : "Are you a service enterprise, bank, or residential developer?"}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {lang === "kh"
                  ? "ចូលរួមជាមួយបណ្តាញសេវាកម្មស្តង់ដារលំដាប់ជាតិដំបូងគេនៅកម្ពុជា"
                  : "Integrate with Cambodia's first standardized enterprise field service OS."}
              </span>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/auth/register?role=company_admin&ref=partnership_carousel">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer">
                  <span>{dict.ctaPartner}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
