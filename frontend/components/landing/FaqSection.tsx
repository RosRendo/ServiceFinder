"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";

interface FaqSectionProps {
  lang: "kh" | "en";
}

export function FaqSection({ lang }: FaqSectionProps) {
  const [openFaq, setOpenFaq] = useState<string | null>("faq-1");
  const [activeTab, setActiveTab] = useState<"all" | "partner" | "customer">("all");
  const dict = landingDictionary[lang].faq;

  const faqs = [
    {
      id: "faq-1",
      category: "partner",
      q: {
        kh: "តើប្រាក់ទូទាត់របស់អតិថិជននឹងផ្ទេរចូលគណនីធនាគាររបស់ក្រុមហ៊ុនខ្ញុំដោយរបៀបណា?",
        en: "How do client payments get deposited into my company bank account?",
      },
      a: {
        kh: "ServiceFinder ភ្ជាប់ផ្ទាល់ជាមួយប្រព័ន្ធ Bakong KHQR របស់ធនាគារជាតិនៃកម្ពុជា។ នៅពេលជាងបច្ចេកទេសរបស់អ្នកបញ្ចប់ការងារ ហើយអតិថិជនបញ្ជាក់ទទួល ប្រាក់ចំណូលនឹងត្រូវផ្ទេរចូលគណនីធនាគាររបស់ក្រុមហ៊ុនអ្នក (ដូចជា ABA, Wing, ACLEDA) ភ្លាមៗក្នុងពេលជាក់ស្តែង។",
        en: "ServiceFinder integrates directly with the National Bank of Cambodia Bakong KHQR network. Once your technician marks a job completed and the client approves, funds settle immediately into your verified business bank account (ABA, Wing, ACLEDA, etc.) in real time.",
      },
    },
    {
      id: "faq-2",
      category: "partner",
      q: {
        kh: "តើមានកម្រៃសេវាដំឡើងដំបូង ឬកិច្ចសន្យាចងភ្ជាប់រយៈពេលយូរដែរឬទេ?",
        en: "Is there an upfront setup fee or long-term lock-in contract?",
      },
      a: {
        kh: "មិនមានឡើយ! ServiceFinder គ្មានថ្លៃចុះឈ្មោះដំបូង និងគ្មានកិច្ចសន្យាចងភ្ជាប់ឡើយ។ យើងគិតកម្រៃជើងសារតូចមួយតែនៅពេលដែលក្រុមហ៊ុនរបស់អ្នកទទួលបានការកក់ការងារជោគជ័យប៉ុណ្ណោះ។ ប្រសិនបើគ្មានការងារ អ្នកមិនបាច់ចំណាយប្រាក់អ្វីឡើយ។",
        en: "None whatsoever. There are zero upfront setup fees and zero lock-in contracts. We charge a modest platform success fee only on bookings successfully completed and paid through the system. If you don't earn, you pay nothing.",
      },
    },
    {
      id: "faq-3",
      category: "customer",
      q: {
        kh: "តើប្រព័ន្ធធានាសុវត្ថិភាព Escrow ការពារអតិថិជនយ៉ាងដូចម្តេច?",
        en: "How does the Escrow booking deposit guarantee protect homeowners?",
      },
      a: {
        kh: "នៅពេលលោកអ្នកកក់សេវាកម្ម ប្រាក់កក់ត្រូវបានរក្សាទុកដោយសុវត្ថិភាពនៅក្នុងប្រព័ន្ធ Escrow។ ប្រាក់នេះនឹងមិនត្រូវបានបញ្ចេញទៅក្រុមហ៊ុនសេវាកម្មឡើយ លុះត្រាតែជាងបានមកដល់ ធ្វើការជួសជុលចប់សព្វគ្រប់ និងលោកអ្នកបានពិនិត្យពេញចិត្តលើលទ្ធផល។",
        en: "When you book, your payment deposit is securely held in an escrow vault. The funds are never disbursed to the service provider until the technician completes the inspection or repair and you confirm satisfaction.",
      },
    },
    {
      id: "faq-4",
      category: "partner",
      q: {
        kh: "តើខ្ញុំអាចកំណត់ប្រភេទសេវាកម្ម និងកាលវិភាគការងាររបស់ជាងដោយខ្លួនឯងបានទេ?",
        en: "Can I customize service pricing, operational areas, and technician schedules?",
      },
      a: {
        kh: "បាទ/ចាស! ផ្ទាំងគ្រប់គ្រងក្រុមហ៊ុនអនុញ្ញាតឱ្យអ្នកកំណត់បញ្ជីសេវាកម្ម តម្លៃមូលដ្ឋាន តំបន់ភូមិសាស្ត្រដែលអ្នកទទួលការងារ (ដូចជា ខណ្ឌទួលគោក បឹងកេងកង សែនសុខ) និងកាលវិភាគធ្វើការរបស់ជាងម្នាក់ៗបានយ៉ាងងាយស្រួល។",
        en: "Absolutely. The company admin dashboard gives you full autonomy to configure your service catalog, baseline labor rates, operational districts (e.g. Toul Kork, BKK, Sen Sok), and working hours per technician.",
      },
    },
    {
      id: "faq-5",
      category: "customer",
      q: {
        kh: "តើជាងបច្ចេកទេសនៅលើ ServiceFinder មានការធានាគុណភាពដែរឬទេ?",
        en: "Are service technicians vetted, licensed, and guaranteed?",
      },
      a: {
        kh: "ក្រុមហ៊ុន និងជាងទាំងអស់នៅលើ ServiceFinder ត្រូវបានផ្ទៀងផ្ទាត់អាជ្ញាប័ណ្ណអាជីវកម្ម និងអត្តសញ្ញាណប័ណ្ណយ៉ាងហ្មត់ចត់។ រាល់ការងារជួសជុលទាំងអស់ត្រូវបានគាំទ្រដោយការធានាគុណភាពរយៈពេល ៣០ ថ្ងៃ និងក្រុមការងារដោះស្រាយវិវាទ ២៤/៧។",
        en: "Yes. All providers undergo strict business license verification and criminal background checks. Every completed service is backed by a 30-day workmanship guarantee and 24/7 platform dispute mediation.",
      },
    },
    {
      id: "faq-6",
      category: "partner",
      q: {
        kh: "តើត្រូវចំណាយពេលប៉ុន្មានដើម្បីចាប់ផ្តើមប្រើប្រាស់ ServiceFinder?",
        en: "How quickly can my service company get onboarded and start receiving jobs?",
      },
      a: {
        kh: "លោកអ្នកអាចចុះឈ្មោះគណនីក្រុមហ៊ុនបានក្នុងរយៈពេលត្រឹម ២ នាទី។ ក្រុមការងារយើងនឹងពិនិត្យផ្ទៀងផ្ទាត់ឯកសារអាជ្ញាប័ណ្ណក្នុងរយៈពេល ២៤ ម៉ោង បន្ទាប់មកលោកអ្នកអាចចាប់ផ្តើមចាត់ចែងការងារ និងទទួលការកក់ភ្លាមៗ។",
        en: "Company onboarding takes less than 2 minutes online. Once your business documents are verified (typically within 24 hours), your company dashboard is active and ready to receive and dispatch bookings immediately.",
      },
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    if (activeTab === "all") return true;
    return faq.category === activeTab;
  });

  return (
    <section id="faqs" className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
            <HelpCircle className="h-3.5 w-3.5 text-slate-700" />
            <span>{dict.sectionBadge}</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
            {dict.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {dict.subtitle}
          </p>
        </motion.div>

        {/* Category Filter Tabs */}
        <div className="mt-8 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            aria-pressed={activeTab === "all"}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dict.tabAll}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("partner")}
            aria-pressed={activeTab === "partner"}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "partner"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dict.tabPartner}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            aria-pressed={activeTab === "customer"}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "customer"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dict.tabCustomer}
          </button>
        </div>

        {/* Accordion List with Smooth Expand Animation */}
        <div className="mt-10 space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaq === faq.id;
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-colors hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/60 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-bold text-slate-900 pr-4">
                    {faq.q[lang]}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-slate-900" : ""
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/30">
                        {faq.a[lang]}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
