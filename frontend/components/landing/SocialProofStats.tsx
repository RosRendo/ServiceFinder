"use client";

import { motion } from "framer-motion";
import { Star, Building2, MapPin, House } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

interface SocialProofStatsProps {
  lang: "kh" | "en";
}

export function SocialProofStats({ lang }: SocialProofStatsProps) {
  const dict = landingDictionary[lang].socialProof;

  const stats = [
    {
      value: "25,000+",
      label: dict.statCompletedJobs,
      sub: lang === "kh" ? "ទូទាំងរាជធានីភ្នំពេញ" : "Across Phnom Penh & Provinces",
    },
    {
      value: "500+",
      label: dict.statVerifiedProviders,
      sub: lang === "kh" ? "ក្រុមហ៊ុនចុះបញ្ជីស្របច្បាប់" : "Ministry-Registered Companies",
    },
    {
      value: "24/7",
      label: dict.statDispatch247,
      sub: lang === "kh" ? "ប្រព័ន្ធចាត់ចែងស្វ័យប្រវត្តិ" : "Automated Dispatch System",
    },
    {
      value: "99.4%",
      label: dict.statSatisfactionRate,
      sub: lang === "kh" ? "ផ្អែកលើការវាយតម្លៃអតិថិជន" : "Verified 5-Star Reviews",
    },
  ];

  const homeowner = {
    name: lang === "kh" ? "សុខ ដារា" : "Sok Dara",
    role: lang === "kh" ? "ម្ចាស់ផ្ទះ" : "Homeowner",
    location: "Borey Peng Huoth, Phnom Penh",
    quote:
      lang === "kh"
        ? "ជាងត្រូវបានផ្ទៀងផ្ទាត់ តម្លៃកំណត់នៅក្នុងកម្មវិធីត្រូវនឹងពេលទូទាត់ជាក់ស្តែង ហើយ Bakong KHQR រក្សាប្រាក់កក់របស់ខ្ញុំសុវត្ថិភាពរហូតដល់ការជួសជុលបានបញ្ចប់។"
        : "The verified Pro arrived on time, the fixed price in the app matched what I paid exactly, and Bakong KHQR escrow held my deposit safely until the repair was finished.",
    label: lang === "kh" ? "អតិថិជន" : "Customer",
  };

  const testimonials = [
    {
      name: lang === "kh" ? "អ៊ុន ប៊ុនលី" : "Oun Bunly",
      role: lang === "kh" ? "នាយកប្រតិបត្តិ, CoolPro AC Services" : "Managing Director, CoolPro AC Services",
      location: "Toul Kork, Phnom Penh",
      quote:
        lang === "kh"
          ? "មុនពេលប្រើ ServiceFinder ជាងរបស់យើង ៨ នាក់ត្រូវរង់ចាំការហៅតាមទូរស័ព្ទ និងខាតពេលធ្វើដំណើរ។ ឥឡូវនេះការចាត់ចែងការងារចំណាយពេលត្រឹម ៣ ចុច ហើយលុយចូលគណនីធនាគារភ្លាមៗតាម Bakong KHQR។"
          : "Before ServiceFinder, our 8 technicians lost 2 hours daily waiting on phone calls. Now dispatching takes 3 clicks, and Bakong KHQR settles client revenue straight into our business bank account instantly.",
      rating: 5,
      impact: lang === "kh" ? "ចំណូលកើនឡើង +42%" : "+42% Monthly Revenue",
    },
    {
      name: lang === "kh" ? "ចាន់ សុភាព" : "Chan Sopheap",
      role: lang === "kh" ? "ប្រធានប្រតិបត្តិការ, Angkor Spark Electric" : "Operations Head, Angkor Spark Electric",
      location: "BKK1, Phnom Penh",
      quote:
        lang === "kh"
          ? "ប្រព័ន្ធធានាប្រាក់កក់ Escrow ជួយឱ្យអតិថិជនមានទំនុកចិត្តកក់សេវាកម្មភ្លើង និងដំឡើងសូឡាធំៗជាមួយយើង។ យើងមិនដែលជួបបញ្ហាអតិថិជនគេចវេសមិនទូទាត់ប្រាក់ទៀតឡើយ។"
          : "The platform's escrow protection removed all payment friction with homeowners for major electrical and solar installations. We haven't had a single unpaid invoice since joining.",
      rating: 5,
      impact: lang === "kh" ? "កាត់បន្ថយពេលខាត 100%" : "Zero Payment Delays",
    },
    {
      name: lang === "kh" ? "ជា ស្រីពៅ" : "Chea Sreypov",
      role: lang === "kh" ? "ស្ថាបនិក, CleanLiving Janitorial Agency" : "Founder, CleanLiving Janitorial Agency",
      location: "Sen Sok, Phnom Penh",
      quote:
        lang === "kh"
          ? "កម្មវិធីទូរស័ព្ទរបស់បុគ្គលិកជួយឱ្យយើងដឹងច្បាស់ពីទីតាំង និងម៉ោងដែលបុគ្គលិកទៅដល់ផ្ទះអតិថិជន។ ការកក់សេវាកម្មស្វ័យប្រវត្តបានជួយក្រុមហ៊ុនយើងពង្រីកពី ៤ នាក់ដល់ ២០ នាក់។"
          : "The staff mobile app gives complete visibility over field attendance and job completion photos. The automated booking pipeline helped us scale our team from 4 to 20 cleaners.",
      rating: 5,
      impact: lang === "kh" ? "ពង្រីកបុគ្គលិក 5X" : "5X Team Scale",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Marketplace Metrics Banner with Staggered Entrance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs text-center transition-all hover:border-slate-400 hover:shadow-sm cursor-default"
            >
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {item.value}
              </div>
              <div className="text-xs font-bold text-slate-800 mt-2">
                {item.label}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {item.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto space-y-3 mt-20"
        >
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <Building2 className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {dict.subtitle}
          </p>
        </motion.div>

        {/* Homeowner (Customer First) + Owner Testimonials */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-default md:col-span-3"
          >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-900">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-slate-900 text-slate-900" />
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold">
                <House className="h-3 w-3" />
                {homeowner.label}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{homeowner.quote}"
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-900">{homeowner.name}</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{homeowner.role}</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-slate-400" /> {homeowner.location}
            </p>
          </div>
        </motion.div>

          {testimonials.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all cursor-default"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-slate-900">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-slate-900 text-slate-900" />
                    ))}
                  </div>
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                    {t.impact}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{t.role}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-slate-400" /> {t.location}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-muted-foreground text-[11px] mt-4 text-center">
          {lang === "kh"
            ? "ចំណូលនិងតួលេខទាំងនេះជាការបង្ហាញគំរូប៉ុណ្ណោះ"
            : "Illustrative figures based on platform projections"}
        </p>
      </div>
    </section>
  );
}
