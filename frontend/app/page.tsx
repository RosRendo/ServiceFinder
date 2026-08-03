"use client";

import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Sparkles, Star, CalendarCheck, Users, MapPin, BarChart3,
  CheckCircle2, ArrowRight, Wallet, Check, Bot, Bell,
  CloudLightning, ChevronDown, Play,
  Home, Search, Calendar, User, Wifi, Battery, Signal,
  Clock, Shield, Image as ImageIcon, MessageSquare, Phone as PhoneIcon, Navigation, ShieldCheck, Map, Plus, Check as CheckIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Phone UI Components
const PhoneStatusBar = ({ theme = "dark" }: { theme?: "dark" | "light" }) => (
  <div className={`absolute top-0 inset-x-0 h-10 px-6 pt-2.5 flex justify-between items-center z-40 ${theme === "dark" ? "text-slate-900" : "text-white"}`}>
    <span className="text-[10px] font-extrabold tracking-tighter ml-1">9:41</span>
    <div className="flex items-center gap-1.5 mr-1">
      <Signal className="w-3 h-3" />
      <Wifi className="w-3.5 h-3.5" />
      <Battery className="w-4 h-4" />
    </div>
  </div>
);

const PhoneBottomNav = ({ lang }: { lang: "kh" | "en" }) => (
  <div className="absolute bottom-0 inset-x-0 h-16 bg-white border-t border-slate-100 flex justify-between items-center px-6 pb-2 z-40 rounded-b-[2.2rem]">
    <div className="flex flex-col items-center gap-0.5 text-slate-900 cursor-pointer">
      <Home className="w-5 h-5" />
      <span className="text-[8px] font-bold">{lang === "kh" ? "ទំព័រដើម" : "Home"}</span>
    </div>
    <div className="flex flex-col items-center gap-0.5 text-slate-400 cursor-pointer">
      <Search className="w-5 h-5" />
      <span className="text-[8px] font-bold">{lang === "kh" ? "ស្វែងរក" : "Search"}</span>
    </div>
    <div className="flex flex-col items-center gap-0.5 text-slate-400 cursor-pointer">
      <Calendar className="w-5 h-5" />
      <span className="text-[8px] font-bold">{lang === "kh" ? "ការកក់" : "Bookings"}</span>
    </div>
    <div className="flex flex-col items-center gap-0.5 text-slate-400 cursor-pointer">
      <User className="w-5 h-5" />
      <span className="text-[8px] font-bold">{lang === "kh" ? "គណនី" : "Profile"}</span>
    </div>
  </div>
);

const AppHeader = ({ lang }: { lang: "kh" | "en" }) => (
  <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-md z-30 sticky top-0 rounded-t-3xl mt-0">
    <div>
      <div className="flex items-center gap-1 text-slate-400">
        <MapPin className="w-3 h-3" />
        <span className="text-[9px] font-bold uppercase tracking-wider">{lang === "kh" ? "ភ្នំពេញ" : "Phnom Penh"}</span>
      </div>
      <div className="text-sm font-black text-slate-900 tracking-tight">ServiceFinder</div>
    </div>
    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center relative shadow-sm">
      <Bell className="w-4 h-4 text-slate-600" />
      <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></div>
    </div>
  </div>
);

// Animated Counter Component
function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const incrementTime = Math.max(Math.floor(duration / end), 15);
      const timer = setInterval(() => {
        start += Math.ceil(end / (duration / incrementTime));
        if (start >= end) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(start);
        }
      }, incrementTime);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  const { user, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  // Multi-lingual Language State (Khmer as default)
  const [lang, setLang] = useState<"kh" | "en">("kh");

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "company_admin") router.push("/company/dashboard");
      if (user.role === "admin") router.push("/admin/dashboard");
    }
  }, [loading, isAuthenticated, user, router]);

  // Mouse Move 3D effect for Hero phone
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // App Showcase screen state & Auto-play
  const [activeShowcaseTab, setActiveShowcaseTab] = useState(0);
  const showcaseAutoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const startShowcaseAutoPlay = () => {
    stopShowcaseAutoPlay();
    showcaseAutoPlayRef.current = setInterval(() => {
      setActiveShowcaseTab((prev) => (prev + 1) % 6);
    }, 5000);
  };

  const stopShowcaseAutoPlay = () => {
    if (showcaseAutoPlayRef.current) {
      clearInterval(showcaseAutoPlayRef.current);
    }
  };

  useEffect(() => {
    startShowcaseAutoPlay();
    return () => stopShowcaseAutoPlay();
  }, []);

  const handleShowcaseTabClick = (index: number) => {
    stopShowcaseAutoPlay();
    setActiveShowcaseTab(index);
  };

  const partners = [
    "Google", "Microsoft", "Amazon", "Stripe", "Shopify", "Adobe",
    "Slack", "Airbnb", "OpenAI", "Meta", "Netflix", "Salesforce"
  ];

  const officeImages = [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80"
  ];

  // Translation Dictionary
  const t = {
    kh: {
      navLogin: "ចូលគណនី",
      navGetStarted: "ចាប់ផ្តើមឥឡូវនេះ",
      heroBadge: "ប្រព័ន្ធប្រតិបត្តិការអាជីវកម្មលំដាប់ខ្ពស់",
      heroTitleLine1: "រាល់អ្វីៗដែលអាជីវកម្មអ្នកត្រូវការ",
      heroTitleLine2: "ក្នុងផ្ទាំងគ្រប់គ្រងតែមួយ។",
      heroDesc: "បង្រួបបង្រួមប្រតិបត្តិការរបស់អ្នក សម្រួលការកក់ទុក សម្របសម្រួលបុគ្គលិក និងប្រមូលការទូទាត់ប្រាក់ភ្លាមៗនៅក្នុងប្រព័ន្ធប្រតិបត្តិការតែមួយ។",
      getStarted: "ចាប់ផ្តើមឥតគិតថ្លៃ",
      watchDemo: "ទស្សនាវីដេអូណែនាំ",
      activeUsers: "អ្នកប្រើប្រាស់សកម្ម",
      partners: "ដៃគូអាជីវកម្ម",
      avgRating: "ការវាយតម្លៃមធ្យម",
      trustedBy: "ទទួលបានការជឿទុកចិត្តដោយក្រុមហ៊ុនជាង ៥០០ ទូទាំងពិភពលោក",
      globalPresence: "វត្តមានទូទាំងសកលលោក",
      globalDesc: "ដៃគូរបស់យើងប្រតិបត្តិការទូទាំងជាង ៥០ ប្រទេសដើម្បីជួយឱ្យអាជីវកម្មរីកចម្រើន។",
      featuresTitle: "សមត្ថភាពរបស់ប្រព័ន្ធ",
      featuresSubtitle: "លក្ខណៈពិសេសស្នូលសម្រាប់ប្រតិបត្តិការអាជីវកម្មសេវាកម្មរបស់អ្នក",
      appExpTitle: "បទពិសោធន៍កម្មវិធីទូរស័ព្ទ",
      appExpSub: "សូមមើលដំណើរកក់សេវាកម្មជាក់ស្តែងនៅលើទូរស័ព្ទដៃរបស់អតិថិជន",
      statsCompleted: "សេវាកម្មដែលបានបញ្ចប់",
      statsCountries: "ប្រទេសដែលបានបម្រើ",
      statsUptime: "អត្រាដំណើរការប្រព័ន្ធ",
      testimonialsTitle: "ការយល់ឃើញរបស់អ្នកប្រើប្រាស់",
      timelineTitle: "ជំហាននៃការចាប់ផ្តើម",
      timelineSub: "ចាប់ផ្តើមដំណើរការអាជីវកម្មរបស់អ្នកក្នុងរយៈពេលតែប៉ុន្មាននាទី",
       pricingTitle: "កញ្ចប់តម្លៃសេវាកម្ម",
      pricingSub: "ជ្រើសរើសកញ្ចប់តម្លៃដែលសមស្របនឹងទំហំអាជីវកម្មរបស់អ្នក",
      faqTitle: "សំណួរដែលសួរញឹកញាប់",
      ctaTitle: "ត្រៀមខ្លួនដើម្បីផ្លាស់ប្តូរអាជីវកម្មរបស់អ្នកហើយឬនៅ?",
      ctaSub: "ចូលរួមជាមួយម៉ាកយីហោរាប់រយដែលកំពុងប្រើប្រាស់ ServiceFinder ដើម្បីពង្រីកប្រតិបត្តិការរបស់ពួកគេ។",
      contactSales: "ទាក់ទងមកផ្នែកលក់",
      footerDesc: "ប្រព័ន្ធប្រតិបត្តិការទំនើបសម្រាប់សេវាកម្មចល័ត។",
      newsletter: "ព្រឹត្តិបត្រព័ត៌មាន",
      join: "ចូលរួម",
      rightsReserved: "រក្សាសិទ្ធិគ្រប់យ៉ាង។",
      privacyPolicy: "គោលការណ៍ឯកជនភាព",
      termsSla: "លក្ខខណ្ឌ និង SLA"
    },
    en: {
      navLogin: "LOGIN",
      navGetStarted: "GET STARTED",
      heroBadge: "Enterprise Business OS",
      heroTitleLine1: "Everything your business needs",
      heroTitleLine2: "in one dashboard.",
      heroDesc: "Unify your operations, streamline booking pipelines, coordinate real-time field staff, and collect instant payments in a single operating system.",
      getStarted: "Get Started Free",
      watchDemo: "Watch Demo",
      activeUsers: "Active Users",
      partners: "Business Partners",
      avgRating: "Average Rating",
      trustedBy: "Trusted by 500+ Companies Worldwide",
      globalPresence: "Global Presence",
      globalDesc: "Our partners operate across 50+ countries helping businesses grow with our platform.",
      featuresTitle: "Platform Capabilities",
      featuresSubtitle: "Core capabilities to power your service operations",
      appExpTitle: "Application Experience",
      appExpSub: "Click a feature below to preview the mobile application UI.",
      statsCompleted: "Transactions Completed",
      statsCountries: "Countries Served",
      statsUptime: "Uptime SLA",
      testimonialsTitle: "User Endorsements",
      timelineTitle: "Onboarding Flow",
      timelineSub: "Get operational in minutes following these simple steps.",
      pricingTitle: "Subscription Tiers",
      pricingSub: "Select an operational plan that matches your current business footprint.",
      faqTitle: "Operational FAQs",
      ctaTitle: "Ready to Transform Your Business?",
      ctaSub: "Join hundreds of service brands using ServiceFinder to unify schedules, accept bookings online, and scale operations.",
      contactSales: "Contact Sales",
      footerDesc: "The modern operating system for field services.",
      newsletter: "Newsletter",
      join: "Join",
      rightsReserved: "All rights reserved.",
      privacyPolicy: "Privacy Policy",
      termsSla: "Terms & SLA"
    }
  };

  const faqs = [
    {
      q: { kh: "តើទិន្នន័យអាជីវកម្មរបស់ខ្ញុំមានសុវត្ថិភាពកម្រិតណា?", en: "How secure is my business data on ServiceFinder?" },
      a: { 
        kh: "យើងប្រើប្រាស់ការអ៊ិនគ្រីបកម្រិតធនាគារ AES-256 សម្រាប់រាល់ទិន្នន័យរក្សាទុក និង TLS 1.3 សម្រាប់ទិន្នន័យកំពុងបញ្ជូន។ ប្រព័ន្ធផ្ទៀងផ្ទាត់ ២ ជាន់ (2FA) ត្រូវបានអនុវត្តលើគណនីអភិបាល។", 
        en: "We utilize banking-grade AES-256 encryption for all data at rest and TLS 1.3 for data in transit. Multi-factor authentication (2FA) is enforced for administrative panels to prevent unauthorized access." 
      }
    },
    {
      q: { kh: "តើខ្ញុំអាចកែសម្រួលប្រព័ន្ធឱ្យត្រូវនឹងប្រភេទសេវាកម្មរបស់ខ្ញុំបានទេ?", en: "Can I customize the platform for my specific service industry?" },
      a: {
        kh: "បាទ/ចាស! ServiceFinder ត្រូវបានរចនាឡើងដើម្បីសម្របសម្រួល។ អ្នកអាចកំណត់លំហូរកក់សេវាកម្ម បញ្ជីការងាររបស់បុគ្គលិក និងទម្រង់ចាត់ចែងការងារដែលត្រូវនឹងអាជីវកម្មរបស់អ្នក។",
        en: "Yes! ServiceFinder is built to adapt. You can define custom booking flows, field staff checklists, and industry-specific dispatch templates to match your cleaning, HVAC, plumbing, or landscaping operational templates."
      }
    },
    {
      q: { kh: "តើប្រាក់ទូទាត់របស់អតិថិជននឹងផ្ទេរចូលគណនីធនាគាររបស់ខ្ញុំដោយរបៀបណា?", en: "How do client payments get deposited to my company bank account?" },
      a: {
        kh: "យើងភ្ជាប់ផ្ទាល់ជាមួយប្រព័ន្ធទូទាត់ប្រាក់ក្នុងស្រុក (ដូចជា ABA Pay នៅក្នុងប្រទេសកម្ពុជា) និងប្រព័ន្ធអន្តរជាតិ (Stripe/VISA/Mastercard)។ ប្រាក់ចំណូលនឹងត្រូវផ្ទេរចូលគណនីធនាគាររបស់អ្នករៀងរាល់ថ្ងៃ។",
        en: "We integrate directly with local gateways (like ABA Pay in Cambodia) and global standard clearers (Stripe/VISA/Mastercard). Payouts are transferred automatically to your linked business bank account daily."
      }
    },
    {
      q: { kh: "តើមានការគិតថ្លៃសេវាលាក់កំបាំងណាមួយដែរឬទេ?", en: "Is there a setup fee or hidden pricing contracts?" },
      a: {
        kh: "មិនមានតម្លៃចុះឈ្មោះ តម្លៃលាក់កំបាំង ឬកិច្ចសន្យាចងភ្ជាប់ឡើយ។ អ្នកអាចដំឡើង បន្ថយ ឬលុបការជាវគម្រោងរបស់អ្នកបានគ្រប់ពេល។",
        en: "No setup fees, no surprise charges, and absolutely no lock-in contracts. You can downgrade, upgrade, or cancel your subscription at any time directly from the billing portal."
      }
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden relative">
      
      {/* Subtle Light Corporate Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

      {/* Marquee and Animations CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes carouselScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-carousel {
          animation: carouselScroll 50s linear infinite;
        }
        .animate-carousel:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-50 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">ServiceFinder</span>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {/* Language Switcher Pill Toggle */}
            <button
              onClick={() => setLang(lang === "kh" ? "en" : "kh")}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-black uppercase hover:bg-slate-100 transition-all duration-250 flex items-center gap-1 shadow-sm bg-white text-slate-800"
            >
              🌐 {lang === "kh" ? "ខ្មែរ" : "ENG"}
            </button>

            <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              {t[lang].navLogin}
            </Link>
            <Link href="/auth/register">
              <Button className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg shadow-md transition-all duration-200">
                {t[lang].navGetStarted}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section 
        className="pt-36 pb-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hero Left Column */}
        <div className="lg:col-span-6 space-y-8 text-left">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" /> {t[lang].heroBadge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-black tracking-tight leading-[1.12] text-slate-900"
          >
            {t[lang].heroTitleLine1} <br />
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
              {t[lang].heroTitleLine2}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-slate-500 font-semibold leading-relaxed max-w-xl"
          >
            {t[lang].heroDesc}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/auth/register">
                <Button className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white text-base font-bold rounded-lg shadow-lg flex items-center gap-2">
                  {t[lang].getStarted} <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" className="h-14 px-8 border-slate-200 text-slate-800 hover:bg-slate-100 font-bold rounded-lg text-base flex items-center gap-2 bg-white shadow-sm">
                <Play className="w-4 h-4 text-slate-500 fill-current" /> {t[lang].watchDemo}
              </Button>
            </div>

            {/* App Store & Play Store Download Badges */}
            <div className="flex items-center gap-3 pt-1">
              <a href="#" className="h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-2.5 shadow-md transition-all duration-200">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 2.99 1.11.09 2.27-.56 3-1.44z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Download on the</div>
                  <div className="text-xs font-black">App Store</div>
                </div>
              </a>
              <a href="#" className="h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-2.5 shadow-md transition-all duration-200">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M5.25 1.5c-.2 0-.39.06-.55.17l10.97 10.97 3.5-3.5L5.7 1.83a1.05 1.05 0 0 0-.45-.33zm-1.55.85c-.09.18-.15.39-.15.65v18c0 .26.06.47.15.65L14.12 12zm2.08 19.82c.15.03.3.03.45-.03l13.52-7.8c.6-.35.9-.89.9-1.44l-3.5 3.5zm11.75-10.97L6.56 2.25c-.15-.06-.3-.06-.45-.03z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">GET IT ON</div>
                  <div className="text-xs font-black">Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Trust Badges & User Statistics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 max-w-lg"
          >
            <div>
              <div className="text-2xl font-black text-slate-900"><Counter value={100} suffix="K+" /></div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{t[lang].activeUsers}</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900"><Counter value={500} suffix="+" /></div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{t[lang].partners}</div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
                4.9/5 <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{t[lang].avgRating}</div>
            </div>
          </motion.div>

        </div>

        {/* Hero Right Column: Phone Screen */}
        <div className="lg:col-span-6 flex justify-center items-center relative h-[650px]">
          
          <motion.div 
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 1, 0]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 left-6 w-52 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-xl shadow-xl z-10 hidden sm:block"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === "kh" ? "បានបញ្ជាក់" : "Confirmed"}</div>
                <div className="text-sm font-black text-slate-900">{lang === "kh" ? "🧹 បោសសម្អាត" : "🧹 Cleaning"}</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ 
              y: [0, 12, 0],
              rotate: [0, -1, 0]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-24 right-4 w-56 bg-white/95 backdrop-blur-xl border border-slate-200 p-4 rounded-xl shadow-xl z-10 hidden sm:block"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === "kh" ? "ការវាយតម្លៃអតិថិជន" : "Customer Rating"}</div>
                <div className="text-xs font-bold text-slate-900">{lang === "kh" ? "៥/៥ - ល្អឥតខ្ចោះ" : "5/5 - Excellent"}</div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Phone frame */}
          <motion.div
            style={{
              rotateY: mousePos.x * 20,
              rotateX: -mousePos.y * 20,
              transformStyle: "preserve-3d"
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative w-[300px] h-[600px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden z-20 flex flex-col cursor-grab active:cursor-grabbing"
          >
            {/* Notch */}
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
              <div className="w-24 h-4 bg-slate-900 rounded-b-2xl"></div>
            </div>

            <PhoneStatusBar />

            {/* Screen contents */}
            <div className="flex-grow flex flex-col relative bg-white text-slate-900 overflow-hidden">
              <div className="pt-10"></div>
              <AppHeader lang={lang} />
              <div className="p-5 pb-20 flex-grow flex flex-col justify-between overflow-y-auto relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent pointer-events-none" />
              
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900">{lang === "kh" ? "សួស្តី 👋" : "Hello 👋"}</h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">{lang === "kh" ? "តើអ្នកត្រូវការសេវាកម្មអ្វី?" : "What service do you need?"}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 p-0.5 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="User Profile" className="w-full h-full rounded-full object-cover" />
                  </div>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-2.5 flex items-center gap-2 text-slate-400 text-xs font-bold">
                  <span>{lang === "kh" ? "🔍 ស្វែងរកសេវាកម្ម..." : "🔍 Search services..."}</span>
                </div>

                {/* Popular Services */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "សេវាកម្មពេញនិយម" : "Popular Services"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg">{lang === "kh" ? "🧹 បោសសម្អាត" : "🧹 Cleaning"}</span>
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg">{lang === "kh" ? "🛠 ជួសជុល" : "🛠 Repair"}</span>
                    <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg">{lang === "kh" ? "❄ ម៉ាស៊ីនត្រជាក់" : "❄ AC Service"}</span>
                  </div>
                </div>

                {/* Recommended Near You */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "ណែនាំសម្រាប់អ្នក" : "Recommended Near You"}</div>
                  <div className="border border-slate-150 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between">
                    <div className="flex gap-3 items-center">
                      <img 
                        src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&q=80" 
                        alt="Staff Sokha" 
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{lang === "kh" ? "សុខា រ. (អ្នកជំនាញសម្អាត)" : "Sokha R. (Expert Cleaner)"}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span className="text-[9px] font-bold text-slate-600">{lang === "kh" ? "4.9 (2,340 វាយតម្លៃ)" : "4.9 (2,340 reviews)"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-400">{lang === "kh" ? "ចាប់ពី" : "From"} <span className="text-slate-900 font-extrabold">$25</span></div>
                      <Button className="h-7 px-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                        {lang === "kh" ? "កក់ឥឡូវនេះ" : "Book Now"}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
            </div>

            <PhoneBottomNav lang={lang} />
          </motion.div>

        </div>
      </section>

      {/* 3. Company Partner Section */}
      <section className="py-16 border-y border-slate-200 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{t[lang].trustedBy}</p>
        </div>
        
        {/* Infinite Logo Carousel */}
        <div className="w-full overflow-hidden relative py-2">
          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          <div className="flex w-[200%] animate-marquee">
            <div className="flex gap-16 shrink-0">
              {partners.map((partner, idx) => (
                <span key={`partner-a-${idx}`} className="text-lg md:text-2xl font-black text-slate-300 tracking-tight select-none whitespace-nowrap uppercase hover:text-slate-900 transition-colors duration-200">
                  {partner}
                </span>
              ))}
            </div>
            <div className="flex gap-16 shrink-0">
              {partners.map((partner, idx) => (
                <span key={`partner-b-${idx}`} className="text-lg md:text-2xl font-black text-slate-300 tracking-tight select-none whitespace-nowrap uppercase hover:text-slate-900 transition-colors duration-200">
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Office & Business Carousel Section */}
      <section className="py-24 bg-white border-b border-slate-200 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 uppercase">{t[lang].globalPresence}</h2>
            <p className="text-slate-500 font-semibold">{t[lang].globalDesc}</p>
          </div>
        </div>

        {/* Scrolling Office Gallery */}
        <div className="w-full overflow-hidden relative py-2">
          <div className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="flex w-[200%] animate-carousel">
            <div className="flex gap-6 shrink-0">
              {officeImages.map((src, idx) => (
                <div key={`img-a-${idx}`} className="w-[300px] h-[200px] rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm group relative">
                  <img 
                    src={src} 
                    alt="Corporate Business Office" 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Innovation Center</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 shrink-0">
              {officeImages.map((src, idx) => (
                <div key={`img-b-${idx}`} className="w-[300px] h-[200px] rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm group relative">
                  <img 
                    src={src} 
                    alt="Corporate Business Office" 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Innovation Center</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Enterprise Core</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">{t[lang].featuresTitle}</h2>
          <p className="text-slate-500 font-semibold mt-2">{t[lang].featuresSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: AI Assistant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <Bot className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "ចាត់ចែងការងារដោយ AI" : "AI Dispatcher"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "វិភាគចរាចរណ៍ ទីតាំងបុគ្គលិក និងកាលវិភាគ ដើម្បីចាត់ចែងការងារដែលចូលមកដោយស្វ័យប្រវត្ត។" : "Analyze traffic, tech locations, and schedules instantly to auto-assign incoming bookings to optimal staff."}
            </p>
          </div>

          {/* Card 2: Real Time Analytics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <BarChart3 className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "របាយការណ៍ផ្ទាល់" : "Real-Time Analytics"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "តាមដានរាល់សកម្មភាពអាជីវកម្ម ភាគរយការងារដែលបានបញ្ចប់ និងសមិទ្ធផលការងាររបស់បុគ្គលិក។" : "Track real-time profitability metrics, completed ticket percentages, and field personnel performance instantly."}
            </p>
          </div>

          {/* Card 3: Smart Notifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <Bell className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "ដំណឹងឆ្លាតវៃ" : "Smart Notifications"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "ផ្ញើសារ SMS និងការជូនដំណឹងផ្ទាល់ទៅកាន់អតិថិជនអំពីទីតាំង និងពេលវេលាមកដល់របស់បុគ្គលិក។" : "Send SMS alerts and real-time updates directly to clients on technician location and estimated arrival time."}
            </p>
          </div>

          {/* Card 4: Booking Management */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <CalendarCheck className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "លំហូរការកក់" : "Booking Flow"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "ទទួលការកក់ទុកផ្ទាល់តាមអ៊ីនធឺណិត។ ធ្វើបច្ចុប្បន្នភាពកាលវិភាគភ្លាមៗ ជៀសវាងការជាន់គ្នានៃការងារ។" : "Accept bookings directly online. Sync schedules instantly, minimizing double bookings and scheduling gaps."}
            </p>
          </div>

          {/* Card 5: Payment Integration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <Wallet className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "ការទូទាត់ប្រាក់ក្នុងស្រុក" : "Local Payments"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "បញ្ចូលគ្នាជាមួយមធ្យោបាយទូទាត់ប្រាក់ក្នុងស្រុក និងអន្តរជាតិ។ ប្រមូលប្រាក់កក់ទុកដោយងាយស្រួល។" : "Integrated local and international payment methods. Collect booking fees and invoices instantly."}
            </p>
          </div>

          {/* Card 6: Cloud Synchronization */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-300 hover:shadow-md transition-all duration-300 group">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
              <CloudLightning className="w-6 h-6 text-slate-700 group-hover:text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2 uppercase">{lang === "kh" ? "ធ្វើសមកាលកម្មភ្លាមៗ" : "Instant Sync"}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-semibold">
              {lang === "kh" ? "ប្រើប្រាស់រាល់ទិន្នន័យពីទូរស័ព្ទដៃ ថេប្លេត ឬកុំព្យូទ័រ។ ទិន្នន័យត្រូវបានរក្សាទុកនៅលើប្រព័ន្ធខ្លោដ។" : "Access real-time business metrics from mobile, tablet, or desktop. Data remains synced across all devices."}
            </p>
          </div>
        </div>
      </section>

      {/* 6. App Showcase Section */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">{t[lang].appExpTitle}</h2>
            <p className="text-slate-500 font-semibold">{t[lang].appExpSub}</p>
          </div>

          {/* Selectors */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {[
              { kh: "ស្វែងរក", en: "Discover" },
              { kh: "ប្រៀបធៀប", en: "Compare" },
              { kh: "ជ្រើសរើស", en: "Choose" },
              { kh: "ទូទាត់", en: "Checkout" },
              { kh: "តាមដាន", en: "Track" },
              { kh: "វាយតម្លៃ", en: "Review" }
            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleShowcaseTabClick(idx)}
                className={`px-5 py-2.5 rounded-xl border text-[11px] font-extrabold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                  activeShowcaseTab === idx
                    ? "bg-slate-900 text-white border-slate-900 shadow-md scale-105"
                    : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {lang === "kh" ? tab.kh : tab.en}
              </button>
            ))}
          </div>

          {/* Animated App Showcase */}
          <div className="flex justify-center relative max-w-4xl mx-auto">
            
            {/* Left Floating Cards */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }} 
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-0 lg:left-8 hidden md:flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 z-10"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">50,000+</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "អតិថិជនពេញចិត្ត" : "Happy Customers"}</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [10, -10, 10] }} 
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-32 left-4 lg:left-16 hidden md:flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 z-10"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">4.9 Rating</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "ការវាយតម្លៃមធ្យម" : "Average Score"}</div>
              </div>
            </motion.div>

            {/* Right Floating Cards */}
            <motion.div 
              animate={{ y: [-8, 8, -8] }} 
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute top-32 right-0 lg:right-8 hidden md:flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 z-10"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">{lang === "kh" ? "បានផ្ទៀងផ្ទាត់ ✓" : "Verified Provider ✓"}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "អ្នកផ្តល់សេវា" : "Top Professionals"}</div>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [8, -8, 8] }} 
              transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute bottom-40 right-4 lg:right-12 hidden md:flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 z-10"
            >
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">{lang === "kh" ? "ទូទាត់ជោគជ័យ ✓" : "Payment Complete ✓"}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "សុវត្ថិភាព ១០០%" : "100% Secure"}</div>
              </div>
            </motion.div>

            <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col z-20">
              
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
                <div className="w-24 h-4 bg-slate-900 rounded-b-2xl"></div>
              </div>

              <PhoneStatusBar />

              {/* Screens */}
              <div className="flex-grow relative overflow-hidden bg-white pb-16">
                <AnimatePresence mode="wait">
                  {activeShowcaseTab === 0 && (
                    <motion.div
                      key="show-discover"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-slate-50"
                    >
                      <div className="pt-10 bg-white"></div>
                      <AppHeader lang={lang} />
                      <div className="p-4 pb-20 overflow-y-auto flex-grow space-y-4">
                        {/* Greeting */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <h3 className="text-lg font-black tracking-tight text-slate-900">{lang === "kh" ? "អរុណសួស្តី 👋" : "Good Morning 👋"}</h3>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5">{lang === "kh" ? "តើអ្នកត្រូវការសេវាកម្មអ្វី?" : "What service do you need?"}</p>
                          
                          <div className="mt-3 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <Search className="w-3.5 h-3.5" />
                            <span>{lang === "kh" ? "ស្វែងរកសេវាកម្ម..." : "Search cleaning, repair..."}</span>
                          </div>
                        </div>

                        {/* Popular Icons */}
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{lang === "kh" ? "សេវាកម្មពេញនិយម" : "Popular Services"}</div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white border border-slate-100 rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-lg">🧹</span>
                              <span className="text-[8px] font-bold">{lang === "kh" ? "សម្អាត" : "Cleaning"}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-lg">🔧</span>
                              <span className="text-[8px] font-bold">{lang === "kh" ? "ជួសជុល" : "Repair"}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-lg">❄</span>
                              <span className="text-[8px] font-bold">{lang === "kh" ? "ម៉ាស៊ីនត្រជាក់" : "AC"}</span>
                            </div>
                            <div className="bg-white border border-slate-100 rounded-xl p-2 flex flex-col items-center gap-1 shadow-sm">
                              <span className="text-lg">🚚</span>
                              <span className="text-[8px] font-bold">{lang === "kh" ? "ដឹកជញ្ជូន" : "Moving"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Sponsor Carousel */}
                        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {/* Sponsor 1 */}
                          <div className="h-28 w-[85%] shrink-0 rounded-2xl overflow-hidden relative shadow-sm snap-center">
                            <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30"></div>
                            <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-white text-[7px] font-black tracking-widest">SPONSORED</div>
                            <div className="absolute bottom-3 left-3">
                              <span className="text-white font-black text-xs block leading-tight">Sparkle Cleaning Co.</span>
                              <span className="text-white/90 font-semibold text-[8px] mt-0.5 block">Top-rated house cleaning</span>
                            </div>
                          </div>
                          
                          {/* Sponsor 2 */}
                          <div className="h-28 w-[85%] shrink-0 rounded-2xl overflow-hidden relative shadow-sm snap-center">
                            <img src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30"></div>
                            <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-0.5 rounded text-white text-[7px] font-black tracking-widest">SPONSORED</div>
                            <div className="absolute bottom-3 left-3">
                              <span className="text-white font-black text-xs block leading-tight">Elite Plumbing</span>
                              <span className="text-white/90 font-semibold text-[8px] mt-0.5 block">24/7 Emergency repairs</span>
                            </div>
                          </div>
                        </div>

                        {/* Recommended Near You */}
                        <div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{lang === "kh" ? "ណែនាំសម្រាប់អ្នក" : "Recommended Near You"}</div>
                          <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm space-y-2">
                            <div className="flex items-center gap-3">
                              <img src="https://images.unsplash.com/photo-1527515637-640a3eeb16ea?auto=format&fit=crop&w=60&q=80" alt="CleanHome" className="w-10 h-10 rounded-xl object-cover" />
                              <div className="flex-grow">
                                <span className="text-[11px] font-black block text-slate-900">CleanHome Cambodia</span>
                                <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-amber-500 text-amber-500"/> 4.9 (1,200 {lang === "kh" ? "ការកក់" : "bookings"})</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                              <span className="flex items-center gap-1 text-emerald-600"><CheckIcon className="w-3 h-3" /> {lang === "kh" ? "ទំនេរថ្ងៃនេះ" : "Available today"}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 2.5 km {lang === "kh" ? "ពីទីនេះ" : "away"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeShowcaseTab === 1 && (
                    <motion.div
                      key="show-compare"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-slate-50"
                    >
                      <div className="pt-10 bg-white"></div>
                      <AppHeader lang={lang} />
                      <div className="p-4 pb-20 overflow-y-auto flex-grow space-y-4">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{lang === "kh" ? "អ្នកជំនាញណែនាំ" : "Recommended Professionals"}</div>
                        
                        {/* Rich Cards */}
                        <div className="space-y-3">
                          
                          <div className="bg-white border border-slate-150 p-3 rounded-2xl shadow-sm">
                            <div className="flex gap-3">
                              <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=60&q=80" alt="Sokha" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <span className="text-[12px] font-black text-slate-900 leading-none">{lang === "kh" ? "សុខា រ." : "Sokha R."}</span>
                                  <span className="text-[11px] font-black text-slate-900">$25<span className="text-[9px] text-slate-500">/hr</span></span>
                                </div>
                                <span className="text-[9px] text-slate-500 font-bold mt-1 block">{lang === "kh" ? "អ្នកជំនាញសម្អាត" : "Professional Cleaner"}</span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[9px] font-bold flex items-center gap-0.5 text-slate-700"><Star className="w-3 h-3 fill-amber-500 text-amber-500"/> 4.9</span>
                                  <span className="text-[9px] font-bold text-slate-400">•</span>
                                  <span className="text-[9px] font-bold text-slate-600">120 {lang === "kh" ? "ការងារ" : "jobs"}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                              <div className="text-[8px] font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500"/> {lang === "kh" ? "តបក្នុង 2 នាទី" : "Replies in 2 min"}</div>
                              <div className="text-[8px] font-bold text-slate-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500"/> {lang === "kh" ? "បានផ្ទៀងផ្ទាត់" : "Verified"}</div>
                            </div>
                            <Button className="w-full mt-3 h-8 text-[10px] font-bold bg-slate-900 text-white rounded-lg">{lang === "kh" ? "ជ្រើសរើស" : "Choose"}</Button>
                          </div>

                          <div className="bg-white border border-slate-150 p-3 rounded-2xl shadow-sm">
                            <div className="flex gap-3">
                              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80" alt="Darith" className="w-12 h-12 rounded-xl object-cover border border-slate-100" />
                              <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                  <span className="text-[12px] font-black text-slate-900 leading-none">{lang === "kh" ? "ដារិទ្ធ ក." : "Darith K."}</span>
                                  <span className="text-[11px] font-black text-slate-900">$30<span className="text-[9px] text-slate-500">/hr</span></span>
                                </div>
                                <span className="text-[9px] text-slate-500 font-bold mt-1 block">{lang === "kh" ? "ជាងម៉ាស៊ីនត្រជាក់" : "AC Specialist"}</span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[9px] font-bold flex items-center gap-0.5 text-slate-700"><Star className="w-3 h-3 fill-amber-500 text-amber-500"/> 4.8</span>
                                  <span className="text-[9px] font-bold text-slate-400">•</span>
                                  <span className="text-[9px] font-bold text-slate-600">90 {lang === "kh" ? "ការងារ" : "jobs"}</span>
                                </div>
                              </div>
                            </div>
                            <Button className="w-full mt-3 h-8 text-[10px] font-bold bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200">{lang === "kh" ? "ជ្រើសរើស" : "Choose"}</Button>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeShowcaseTab === 2 && (
                    <motion.div
                      key="show-choose"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-slate-50"
                    >
                      <div className="pt-10 bg-white"></div>
                      <AppHeader lang={lang} />
                      <div className="p-4 pb-20 overflow-y-auto flex-grow space-y-4">
                        
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                          <div className="relative">
                            <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=100&q=80" alt="Sokha" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white"><ShieldCheck className="w-2.5 h-2.5" /></div>
                          </div>
                          <h4 className="font-black text-sm mt-2">Sokha R.</h4>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-slate-500">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500"/> 4.9 • {lang === "kh" ? "បានផ្ទៀងផ្ទាត់ ✓" : "Verified Professional ✓"}
                          </div>

                          <div className="grid grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-slate-100">
                            <div>
                              <div className="text-sm font-black text-slate-900">5 {lang === "kh" ? "ឆ្នាំ" : "yrs"}</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "បទពិសោធន៍" : "Experience"}</div>
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900">320</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{lang === "kh" ? "ការងារបញ្ចប់" : "Completed"}</div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-wider">{lang === "kh" ? "សេវាកម្ម" : "Services"}</div>
                          <ul className="space-y-1.5 text-[10px] font-bold text-slate-600">
                            <li className="flex items-center gap-2"><CheckIcon className="w-3 h-3 text-emerald-500" /> {lang === "kh" ? "សម្អាតស៊ីជម្រៅ" : "Deep Cleaning"}</li>
                            <li className="flex items-center gap-2"><CheckIcon className="w-3 h-3 text-emerald-500" /> {lang === "kh" ? "ជូតកញ្ចក់" : "Window Cleaning"}</li>
                            <li className="flex items-center gap-2"><CheckIcon className="w-3 h-3 text-emerald-500" /> {lang === "kh" ? "បោកសាឡុង" : "Sofa Cleaning"}</li>
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                          <div className="text-[10px] font-black text-slate-900 mb-2 uppercase tracking-wider">{lang === "kh" ? "ស្នាដៃ" : "Work Gallery"}</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative h-16 rounded-lg overflow-hidden border border-slate-200">
                              <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80" className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] font-bold text-center py-0.5">Before</div>
                            </div>
                            <div className="relative h-16 rounded-lg overflow-hidden border border-slate-200">
                              <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=150&q=80" className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 inset-x-0 bg-emerald-500/90 text-white text-[8px] font-bold text-center py-0.5">After</div>
                            </div>
                          </div>
                        </div>

                        <Button className="w-full h-10 bg-slate-900 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider shadow-lg">{lang === "kh" ? "កក់ឥឡូវនេះ" : "Book Now"}</Button>
                      </div>
                    </motion.div>
                  )}

                  {activeShowcaseTab === 3 && (
                    <motion.div
                      key="show-checkout"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-slate-50"
                    >
                      <div className="pt-10 bg-white"></div>
                      <AppHeader lang={lang} />
                      <div className="p-4 pb-20 overflow-y-auto flex-grow space-y-4">
                        
                        <div className="text-[11px] font-black text-slate-900 px-1">{lang === "kh" ? "ការកក់របស់អ្នក" : "Your Booking"}</div>
                        
                        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg border border-slate-200">🧹</div>
                            <div>
                              <div className="text-[11px] font-black">{lang === "kh" ? "សេវាកម្មសម្អាត" : "Home Cleaning"}</div>
                              <div className="text-[9px] font-bold text-slate-500">{lang === "kh" ? "អ្នកផ្តល់សេវា: សុខា រ." : "Provider: Sokha R."}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-0.5">{lang === "kh" ? "កាលបរិច្ឆេទ" : "Date"}</span>
                              <span className="text-slate-900">July 28</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-0.5">{lang === "kh" ? "ម៉ោង" : "Time"}</span>
                              <span className="text-slate-900">2:00 PM</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-0.5">{lang === "kh" ? "អាសយដ្ឋាន" : "Address"}</span>
                              <span className="text-slate-900 flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-500" /> {lang === "kh" ? "ភ្នំពេញ" : "Phnom Penh"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm space-y-2 text-[10px] font-bold">
                          <div className="flex justify-between text-slate-500">
                            <span>{lang === "kh" ? "សេវាកម្ម" : "Service"}</span>
                            <span>$25.00</span>
                          </div>
                          <div className="flex justify-between text-slate-500 pb-2 border-b border-slate-100">
                            <span>{lang === "kh" ? "កម្រៃសេវា" : "Fee"}</span>
                            <span>$2.00</span>
                          </div>
                          <div className="flex justify-between text-slate-900 pt-1 text-[12px] font-black">
                            <span>{lang === "kh" ? "សរុប" : "Total"}</span>
                            <span>$27.00</span>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-150 p-3 rounded-2xl shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-[8px] font-black">ABA</div>
                            <span className="text-[10px] font-bold">ABA Pay</span>
                          </div>
                          <div className="w-3 h-3 rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                          </div>
                        </div>

                        <Button className="w-full h-10 bg-slate-900 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> {lang === "kh" ? "បញ្ជាក់ការទូទាត់" : "Confirm Booking"}
                        </Button>
                        <div className="flex justify-center items-center gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                          <ShieldCheck className="w-2.5 h-2.5" /> {lang === "kh" ? "ការទូទាត់សុវត្ថិភាព" : "Secure Payment"}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeShowcaseTab === 4 && (
                    <motion.div
                      key="show-track"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-white"
                    >
                      <div className="pt-10"></div>
                      <AppHeader lang={lang} />
                      <div className="flex-grow relative flex flex-col">
                        
                        {/* Dominant Map Area */}
                        <div className="flex-grow bg-slate-100 relative overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
                          
                          {/* Animated Route Line */}
                          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                            <path d="M50,150 Q100,50 200,100 T250,250" fill="transparent" stroke="#10b981" strokeWidth="4" strokeDasharray="6 6" className="animate-pulse" />
                          </svg>

                          <div className="absolute bottom-1/3 right-1/4 z-10 flex flex-col items-center">
                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white relative">
                              <MapPin className="w-5 h-5" />
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                            </div>
                          </div>

                          {/* Moving Vehicle */}
                          <motion.div 
                            animate={{ x: [0, 50, 100], y: [0, -30, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/3 left-1/4 z-10"
                          >
                            <div className="bg-white p-1.5 rounded-full shadow-lg border border-slate-200 text-lg">🚲</div>
                          </motion.div>
                        </div>

                        {/* Status Bottom Sheet */}
                        <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5 pb-24 z-20 relative -mt-4">
                          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4"></div>
                          
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <div className="text-[18px] font-black text-slate-900 leading-none">{lang === "kh" ? "ជិតមកដល់ហើយ" : "Arriving in"}</div>
                              <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">{lang === "kh" ? "សុខាកំពុងធ្វើដំណើរ" : "Sokha is on the way"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-black text-emerald-600 tabular-nums">04<span className="animate-pulse">:</span>32</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase">min : sec</div>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=60&q=80" alt="Sokha R." className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              <div>
                                <span className="text-[11px] font-bold block leading-none">Sokha R.</span>
                                <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1 mt-0.5"><Star className="w-3 h-3 fill-current"/> 4.9</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"><MessageSquare className="w-4 h-4" /></div>
                              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 hover:bg-emerald-200 cursor-pointer"><PhoneIcon className="w-4 h-4" /></div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {activeShowcaseTab === 5 && (
                    <motion.div
                      key="show-review"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col text-slate-900 bg-slate-50"
                    >
                      <div className="pt-10 bg-white"></div>
                      <AppHeader lang={lang} />
                      <div className="p-5 pb-24 overflow-y-auto flex-grow flex flex-col items-center text-center">
                        
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 mt-6 border-4 border-white shadow-sm">
                          <CheckIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{lang === "kh" ? "ការងារបានបញ្ចប់!" : "Service Completed!"}</h3>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 mb-8">{lang === "kh" ? "តើអ្នកមានបទពិសោធន៍យ៉ាងណាដែរ?" : "How was your experience?"}</p>

                        <div className="bg-white w-full p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                          <img src="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=60&q=80" alt="Sokha R." className="w-12 h-12 rounded-full object-cover mx-auto border border-slate-200" />
                          <div className="flex justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-6 h-6 ${star === 5 ? "text-slate-200" : "fill-amber-400 text-amber-400"}`} />
                            ))}
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-left">
                            <span className="text-[10px] text-slate-400 font-bold">{lang === "kh" ? "សរសេរមតិយោបល់..." : "Write a review..."}</span>
                          </div>

                          <Button className="w-full h-9 bg-slate-900 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider">{lang === "kh" ? "បញ្ជូនការវាយតម្លៃ" : "Submit Review"}</Button>
                        </div>

                        <Button variant="outline" className="w-full h-10 mt-6 border-slate-200 bg-white text-slate-900 font-bold rounded-lg text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
                          <Plus className="w-4 h-4" /> {lang === "kh" ? "កក់ម្តងទៀត" : "Book Again"}
                        </Button>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <PhoneBottomNav lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Statistics Section */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">
              <Counter value={1} suffix="M+" />
            </h3>
            <p className="text-xs font-bold text-slate-450 uppercase tracking-wider mt-2">{t[lang].statsCompleted}</p>
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">
              <Counter value={105} suffix="K+" />
            </h3>
            <p className="text-xs font-bold text-slate-450 uppercase tracking-wider mt-2">{t[lang].activeUsers}</p>
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">
              <Counter value={50} suffix="+" />
            </h3>
            <p className="text-xs font-bold text-slate-455 uppercase tracking-wider mt-2">{t[lang].statsCountries}</p>
          </div>
          <div>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900">
              99.99%
            </h3>
            <p className="text-xs font-bold text-slate-450 uppercase tracking-wider mt-2">{t[lang].statsUptime}</p>
          </div>
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-3">Testimonials</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">{t[lang].testimonialsTitle}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <blockquote className="text-slate-650 font-semibold text-sm leading-relaxed mb-6">
              {lang === "kh" 
                ? `"ការផ្លាស់ប្តូរមកប្រើប្រាស់ ServiceFinder ជួយសម្រួលដល់ការកក់សេវាកម្ម និងការតាមដានការងាររបស់បុគ្គលិកយ៉ាងខ្លាំង។ ចំនួនអតិថិជនកក់បានកើនឡើង ៣៥% ក្នុងខែដំបូង។"`
                : `"Transitioning our entire booking and tracking operations to ServiceFinder dramatically reduced customer friction. Booking volume surged 35% in our first month."`}
            </blockquote>
            <div>
              <div className="font-bold text-slate-900 text-sm">{lang === "kh" ? "រិទ្ធី ស." : "Rithy S."}</div>
              <div className="text-xs text-slate-400 font-bold mt-0.5">{lang === "kh" ? "ស្ថាបនិក, CleanHome Cambodia" : "Founder, CleanHome Cambodia"}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <blockquote className="text-slate-655 font-semibold text-sm leading-relaxed mb-6">
              {lang === "kh" 
                ? `"សមត្ថភាពមើលឃើញទីតាំងរបស់បុគ្គលិកកំពុងធ្វើដំណើរជួយកាត់បន្ថយការខលសួរនាំយ៉ាងច្រើន។ ជាប្រព័ន្ធគ្រប់គ្រងសេវាកម្មដែលល្អបំផុត។"`
                : `"Being able to see exactly where our field contractors are en-route eliminates redundant operational calls. Highly recommended system."`}
            </blockquote>
            <div>
              <div className="font-bold text-slate-900 text-sm">{lang === "kh" ? "សុខា ភ." : "Sokha P."}</div>
              <div className="text-xs text-slate-400 font-bold mt-0.5">{lang === "kh" ? "ប្រធានប្រតិបត្តិការ, Angkor HVAC" : "Operations Lead, Angkor HVAC"}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <blockquote className="text-slate-655 font-semibold text-sm leading-relaxed mb-6">
              {lang === "kh" 
                ? `"ប្រព័ន្ធទូទាត់ប្រាក់ដំណើរការល្អខ្លាំងណាស់។ ការធ្វើសមកាលកម្មវិក្កយបត្រអនុញ្ញាតឱ្យយើងផ្ទេរប្រាក់ទៅបុគ្គលិកបានភ្លាមៗក្រោយការងារបញ្ចប់។"`
                : `"Excellent payment collection flow. Invoice payment sync allows us to pay out contractors quickly based on customer check-outs."`}
            </blockquote>
            <div>
              <div className="font-bold text-slate-900 text-sm">{lang === "kh" ? "ដារិទ្ធ ក." : "Darith K."}</div>
              <div className="text-xs text-slate-400 font-bold mt-0.5">{lang === "kh" ? "ម្ចាស់អាជីវកម្ម, SmartFix Phnom Penh" : "Owner, SmartFix Phnom Penh"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. How It Works Section */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">{t[lang].timelineTitle}</h2>
            <p className="text-slate-500 font-semibold">{t[lang].timelineSub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {[
              { step: "01", title: { kh: "ទាញយកកម្មវិធី", en: "Download App" }, desc: { kh: "ដំឡើងកម្មវិធីសម្រាប់អតិថិជន និងអ្នកផ្តល់សេវាកម្ម។", en: "Install the client and service provider applications." } },
              { step: "02", title: { kh: "ចុះឈ្មោះគណនី", en: "Register Account" }, desc: { kh: "បង្កើតប្រវត្តិរូបក្រុមហ៊ុន ឬគណនីអ្នកប្រើប្រាស់របស់អ្នក។", en: "Create your organization profile or customer account." } },
              { step: "03", title: { kh: "ភ្ជាប់ប្រព័ន្ធទូទាត់", en: "Link Business" }, desc: { kh: "ភ្ជាប់គណនីធនាគារក្នុងស្រុកដើម្បីទូទាត់ប្រាក់បានរហ័ស។", en: "Connect local bank details and check-out rules." } },
              { step: "04", title: { kh: "រៀបចំការចាត់ចែង", en: "Set Up Dispatch" }, desc: { kh: "កំណត់បញ្ជីការងារ និងបុគ្គលិកសកម្មរបស់អ្នក។", en: "Add dispatch targets and staff checklists." } },
              { step: "05", title: { kh: "ពង្រីកប្រតិបត្តិការ", en: "Scale Operations" }, desc: { kh: "សង្កេតមើលកំណើនអតិថិជន និងប្រាក់ចំណូលសកម្ម។", en: "Observe booking conversion and revenue growth." } }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 space-y-4">
                <div className="text-5xl font-black text-slate-200 tracking-tight">{item.step}</div>
                <h4 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">{lang === "kh" ? item.title.kh : item.title.en}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">{lang === "kh" ? item.desc.kh : item.desc.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase mb-4">{t[lang].pricingTitle}</h2>
          <p className="text-slate-500 font-semibold">{t[lang].pricingSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">{lang === "kh" ? "ឥតគិតថ្លៃ" : "Free"}</h3>
              <p className="text-slate-400 font-bold text-sm mb-6">{lang === "kh" ? "ល្អឥតខ្ចោះសម្រាប់ប្រតិបត្តិករទោល" : "Perfect for solo operators"}</p>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-8">$0</div>
              <ul className="space-y-4 text-slate-655 text-sm font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "បុគ្គលិករហូតដល់ ៥ នាក់" : "Up to 5 staff members"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "ការកក់សេវាកម្មអនឡាញជាមូលដ្ឋាន" : "Basic online bookings"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "របាយការណ៍សង្ខេបប្រចាំខែ" : "Standard dashboard report"}</li>
              </ul>
            </div>
            <Link href="/auth/register" className="mt-8">
              <Button className="w-full h-12 bg-transparent hover:bg-slate-50 text-slate-900 font-bold rounded-lg border border-slate-200">
                {lang === "kh" ? "ចាប់ផ្តើមគម្រោងឥតគិតថ្លៃ" : "Start Free Plan"}
              </Button>
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="bg-white border border-slate-300 rounded-2xl p-8 flex flex-col justify-between relative ring-2 ring-slate-900/5 scale-105 shadow-md">
            <span className="absolute top-0 right-6 -translate-y-1/2 bg-slate-900 text-white font-bold uppercase tracking-wider text-[9px] px-3 py-1 rounded-full">
              {lang === "kh" ? "ពេញនិយមបំផុត" : "Most Popular"}
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">{lang === "kh" ? "កម្រិតវិជ្ជាជីវៈ" : "Professional"}</h3>
              <p className="text-slate-500 font-bold text-sm mb-6">{lang === "kh" ? "សម្រាប់អាជីវកម្មកំពុងរីកចម្រើន" : "For expanding businesses"}</p>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-8">$29<span className="text-sm font-semibold text-slate-400">/{lang === "kh" ? "ខែ" : "mo"}</span></div>
              <ul className="space-y-4 text-slate-700 text-sm font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {lang === "kh" ? "មិនកំណត់ចំនួនបុគ្គលិកចល័ត" : "Unlimited field contractors"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {lang === "kh" ? "ប្រព័ន្ធ GPS តាមដានបុគ្គលិកផ្ទាល់" : "Live GPS dispatch & ETAs"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {lang === "kh" ? "របាយការណ៍វិភាគកម្រិតខ្ពស់" : "Advanced analytics integrations"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> {lang === "kh" ? "ការភ្ជាប់ ABA Pay ស្វ័យប្រវត្ត" : "Automated billing gateways"}</li>
              </ul>
            </div>
            <Link href="/auth/register" className="mt-8">
              <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg">
                {lang === "kh" ? "សាកល្បងឥតគិតថ្លៃ" : "Get Started Free"}
              </Button>
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">{lang === "kh" ? "សហគ្រាស" : "Enterprise"}</h3>
              <p className="text-slate-400 font-bold text-sm mb-6">{lang === "kh" ? "សម្រាប់ក្រុមហ៊ុនដែលមានសាខាច្រើន" : "For multi-branch groups"}</p>
              <div className="text-4xl font-black text-slate-900 tracking-tight mb-8">$99<span className="text-sm font-semibold text-slate-400">/{lang === "kh" ? "ខែ" : "mo"}</span></div>
              <ul className="space-y-4 text-slate-655 text-sm font-semibold">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "រួមបញ្ចូលរាល់មុខងារ Pro" : "All Professional features"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "ការគ្រប់គ្រងសាខាច្រើន" : "Multi-branch branch management"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "ការតភ្ជាប់ API ផ្តាច់មុខ" : "Dedicated API access endpoints"}</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-900" /> {lang === "kh" ? "គាំទ្រសេវាកម្មបន្ទាន់ ២៤/៧" : "SLA & Priority 24/7 support"}</li>
              </ul>
            </div>
            <Link href="/auth/register" className="mt-8">
              <Button className="w-full h-12 bg-transparent hover:bg-slate-50 text-slate-900 font-bold rounded-lg border border-slate-200">
                {t[lang].contactSales}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 11. FAQ Accordion Section */}
      <section className="py-24 max-w-3xl mx-auto px-6 border-t border-slate-200">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight uppercase">{t[lang].faqTitle}</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border-b border-slate-200 pb-4">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left py-3 text-sm md:text-base font-bold uppercase tracking-tight text-slate-900 hover:text-slate-700 transition-colors"
              >
                <span>{lang === "kh" ? faq.q.kh : faq.q.en}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-slate-500 leading-relaxed font-semibold pt-2">
                      {lang === "kh" ? faq.a.kh : faq.a.en}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* 12. Final CTA Section */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-12 md:p-20 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent pointer-events-none" />
          
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">
            {t[lang].ctaTitle}
          </h2>
          <p className="text-slate-500 font-semibold text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            {t[lang].ctaSub}
          </p>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-lg w-full sm:w-auto">
                  {lang === "kh" ? "សាកល្បងឥតគិតថ្លៃឥឡូវនេះ" : "Get Started Free"}
                </Button>
              </Link>
              <Button variant="outline" className="h-14 px-10 border-slate-200 text-slate-800 hover:bg-slate-50 font-bold rounded-lg bg-transparent w-full sm:w-auto">
                {t[lang].contactSales}
              </Button>
            </div>

            {/* App Store & Play Store Badges */}
            <div className="flex justify-center items-center gap-3 pt-2">
              <a href="#" className="h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-2.5 shadow-md transition-all duration-200">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.64.74-1.2 1.88-1.05 2.99 1.11.09 2.27-.56 3-1.44z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Download on the</div>
                  <div className="text-xs font-black">App Store</div>
                </div>
              </a>
              <a href="#" className="h-11 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg inline-flex items-center gap-2.5 shadow-md transition-all duration-200">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M5.25 1.5c-.2 0-.39.06-.55.17l10.97 10.97 3.5-3.5L5.7 1.83a1.05 1.05 0 0 0-.45-.33zm-1.55.85c-.09.18-.15.39-.15.65v18c0 .26.06.47.15.65L14.12 12zm2.08 19.82c.15.03.3.03.45-.03l13.52-7.8c.6-.35.9-.89.9-1.44l-3.5 3.5zm11.75-10.97L6.56 2.25c-.15-.06-.3-.06-.45-.03z"/>
                </svg>
                <div className="text-left leading-none">
                  <div className="text-[8px] font-bold uppercase tracking-wider text-slate-400">GET IT ON</div>
                  <div className="text-xs font-black">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-16 px-6 border-t border-slate-200 text-slate-500 text-sm font-semibold">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-slate-900" />
              <span className="font-bold text-lg tracking-tight uppercase">ServiceFinder</span>
            </div>
            <p className="text-xs text-slate-450 font-semibold leading-relaxed">
              {t[lang].footerDesc}
            </p>
          </div>

          <div>
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="#" className="hover:text-slate-900 transition-colors">Scheduler</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Field App</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">ABA Gateway</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">API Docs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-2 font-semibold">
              <li><a href="#" className="hover:text-slate-900 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Support Center</a></li>
              <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-widest mb-4">{t[lang].newsletter}</h4>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="email@company.com" 
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 flex-grow"
              />
              <Button className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-lg text-xs font-bold shrink-0">{t[lang].join}</Button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <span>© {new Date().getFullYear()} ServiceFinder. {t[lang].rightsReserved}</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900 transition-colors">{t[lang].privacyPolicy}</a>
            <a href="#" className="hover:text-slate-900 transition-colors">{t[lang].termsSla}</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
