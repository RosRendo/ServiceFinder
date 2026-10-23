/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import {
  Landmark,
  CheckCircle2,
  ArrowRight,
  Handshake,
} from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { FadeInView } from "@/components/landing/FadeInView";
import { motion } from "framer-motion";
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

interface PartnerItem {
  id: string;
  name: string;
  categoryLabelEn: string;
  categoryLabelKh: string;
  badgeEn: string;
  badgeKh: string;
  imageSrc?: string;
  logoComponent?: React.ComponentType<{ className?: string }>;
}

export function PartnershipCarousel({ lang }: PartnershipCarouselProps) {
  const dict = landingDictionary[lang].partnerships;

  const financialPartners: PartnerItem[] = [
    {
      id: "bakong",
      name: "NBC Bakong KHQR",
      categoryLabelEn: "National Payment Standard",
      categoryLabelKh: "ស្តង់ដារទូទាត់ជាតិ",
      badgeEn: "National Bank of Cambodia",
      badgeKh: "ធនាគារជាតិនៃកម្ពុជា",
      imageSrc: "/KHQR.png",
    },
    {
      id: "aba",
      name: "ABA Bank Enterprise",
      categoryLabelEn: "Commercial Banking Rail",
      categoryLabelKh: "ប្រព័ន្ធធនាគារពាណិជ្ជ",
      badgeEn: "Instant Merchant Settlement",
      badgeKh: "ទូទាត់ប្រាក់ភ្លាមៗ",
      imageSrc: "/ABA.png",
    },
    {
      id: "wing",
      name: "Wing Bank Commercial",
      categoryLabelEn: "Nationwide Payment Rails",
      categoryLabelKh: "បណ្តាញទូទាត់ទូទាំងប្រទេស",
      badgeEn: "Zero Delay Payouts",
      badgeKh: "គ្មានការពន្យារពេល",
      imageSrc: "/Wing.png",
    },
    {
      id: "acleda",
      name: "ACLEDA Bank Plc",
      categoryLabelEn: "Commercial Network",
      categoryLabelKh: "បណ្តាញធនាគារពាណិជ្ជកម្ម",
      badgeEn: "Nationwide Rail",
      badgeKh: "គ្របដណ្តប់ទូទាំងប្រទេស",
      imageSrc: "/ACLEDA.png",
    },
    {
      id: "canadia",
      name: "Canadia Bank Corporate",
      categoryLabelEn: "Corporate Financial Rails",
      categoryLabelKh: "ប្រព័ន្ធហិរញ្ញវត្ថុសាជីវកម្ម",
      badgeEn: "Escrow Integration",
      badgeKh: "ភ្ជាប់ប្រព័ន្ធ Escrow",
      imageSrc: "/CANADIA.jpg",
    },
    {
      id: "vattanac",
      name: "Vattanac Bank",
      categoryLabelEn: "Commercial Banking",
      categoryLabelKh: "ធនាគារពាណិជ្ជកម្មវឌ្ឍនៈ",
      badgeEn: "Enterprise Rail",
      badgeKh: "ប្រព័ន្ធទូទាត់សាជីវកម្ម",
      imageSrc: "/VATTANAC.png",
    },
    {
      id: "sathapana",
      name: "Sathapana Bank",
      categoryLabelEn: "Digital SME Banking",
      categoryLabelKh: "ធនាគារឌីជីថលសម្រាប់សហគ្រាស",
      badgeEn: "Verified Rail",
      badgeKh: "ដៃគូបញ្ជាក់គុណភាព",
      logoComponent: SathapanaLogo,
    },
    {
      id: "visa-mc",
      name: "Visa & Mastercard Business",
      categoryLabelEn: "Global Card Processing",
      categoryLabelKh: "ដំណើរការកាតសកល",
      badgeEn: "Bank-Grade Encryption",
      badgeKh: "សុវត្ថិភាពស្តង់ដារធនាគារ",
      logoComponent: VisaMastercardLogo,
    },
  ];

  const industryPartners: PartnerItem[] = [
    {
      id: "chipmong",
      name: "Chip Mong Land & Facilities",
      categoryLabelEn: "Commercial & Residential",
      categoryLabelKh: "អចលនទ្រព្យ និងសំណង់ពាណិជ្ជកម្ម",
      badgeEn: "Enterprise Dispatch Partner",
      badgeKh: "ដៃគូចាត់ចែងសេវាកម្ម",
      imageSrc: "/CHIPMONG.jpg",
    },
    {
      id: "penghuoth",
      name: "Borey Peng Huoth Group",
      categoryLabelEn: "Premier Residential Community",
      categoryLabelKh: "បុរីលំនៅឋានឈានមុខគេ",
      badgeEn: "45+ Integrated Subdivisions",
      badgeKh: "៤៥+ គម្រោងបុរីដៃគូ",
      logoComponent: BoreyPengHuothLogo,
    },
    {
      id: "urbanvillage",
      name: "Urban Village Phnom Penh",
      categoryLabelEn: "Smart Community Living",
      categoryLabelKh: "សហគមន៍ឆ្លាតវៃភ្នំពេញ",
      badgeEn: "Resident Portal Partner",
      badgeKh: "ប្រព័ន្ធបម្រើសេវាអ្នករស់នៅ",
      logoComponent: UrbanVillageLogo,
    },
    {
      id: "daikin",
      name: "Daikin Air Conditioning",
      categoryLabelEn: "Official HVAC Technology",
      categoryLabelKh: "បច្ចេកវិទ្យាម៉ាស៊ីនត្រជាក់ផ្លូវការ",
      badgeEn: "Certified Inverter Fleet",
      badgeKh: "ជាងទទួលបានវិញ្ញាបនបត្រ",
      logoComponent: DaikinLogo,
    },
    {
      id: "panasonic",
      name: "Panasonic HVAC Solutions",
      categoryLabelEn: "Smart Inverter & Air Quality",
      categoryLabelKh: "ប្រព័ន្ធត្រជាក់ និងខ្យល់ស្អាត",
      badgeEn: "Factory Spare Parts Partner",
      badgeKh: "គ្រឿងបន្លាស់សុទ្ធពីរោងចក្រ",
      logoComponent: PanasonicLogo,
    },
    {
      id: "schneider",
      name: "Schneider Electric",
      categoryLabelEn: "Electrical Distribution Gear",
      categoryLabelKh: "ឧបករណ៍ចែកចាយប្រព័ន្ធភ្លើង",
      badgeEn: "IEC Safety Standard",
      badgeKh: "ស្តង់ដារសុវត្ថិភាពអន្តរជាតិ",
      logoComponent: SchneiderElectricLogo,
    },
    {
      id: "bosch",
      name: "Bosch Professional Tools",
      categoryLabelEn: "Heavy-Duty Fleet Equipment",
      categoryLabelKh: "ឧបករណ៍ជាងជំនាញកម្រិតខ្ពស់",
      badgeEn: "Precision Fleet Standards",
      badgeKh: "ស្តង់ដារបច្ចេកទេសជាក់លាក់",
      logoComponent: BoschLogo,
    },
    {
      id: "campaint",
      name: "Cam-Paint Manufacturing",
      categoryLabelEn: "Architectural & Industrial Coatings",
      categoryLabelKh: "ថ្នាំពណ៌សំណង់គុណភាពខ្ពស់",
      badgeEn: "Kingdom-Wide Distribution",
      badgeKh: "ចែកចាយទូទាំងព្រះរាជាណាចក្រ",
      logoComponent: CamPaintLogo,
    },
  ];

  const renderPartnerLogoCell = (item: PartnerItem) => {
    const LogoComp = item.logoComponent;

    return (
      <div
        key={item.id}
        className="group relative rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-3.5 shadow-xs flex items-center gap-3 min-w-0"
      >
        {item.imageSrc ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden group-hover:border-slate-300 transition-colors">
            <img
              src={item.imageSrc}
              alt={item.name}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ) : LogoComp ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white p-1.5 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-slate-800 transition-colors overflow-hidden">
            <LogoComp className="h-6 w-auto max-w-full" />
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:bg-slate-800 transition-colors">
            <Landmark className="h-5 w-5" />
          </div>
        )}

        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-slate-900 text-[11px] sm:text-xs tracking-tight truncate block group-hover:text-slate-950">
              {item.name}
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          </div>

          <p className="text-[11px] text-slate-500 truncate">
            {lang === "kh" ? item.categoryLabelKh : item.categoryLabelEn}
          </p>

          <span className="hidden sm:inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-700">
            {lang === "kh" ? item.badgeKh : item.badgeEn}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

        <div className="mt-10 space-y-6">
          <FadeInView delay={0.1}>
            <div className="flex items-center gap-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <Landmark className="h-3.5 w-3.5 shrink-0" />
              <span>{dict.financialRailsTrack}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {financialPartners.map((item) => renderPartnerLogoCell(item))}
            </div>
          </FadeInView>

          <FadeInView delay={0.15}>
            <div className="flex items-center gap-2 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              <Handshake className="h-3.5 w-3.5 shrink-0" />
              <span>{dict.developersTrack}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {industryPartners.map((item) => renderPartnerLogoCell(item))}
            </div>
          </FadeInView>
        </div>

        <FadeInView delay={0.2} className="mt-10 text-center">
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
              <Link href="/auth/register?role=company_admin&ref=partnership_carousel" className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer">
                <span>{dict.ctaPartner}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}
