"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/contexts/AuthContext";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { PartnershipCarousel } from "@/components/landing/PartnershipCarousel";
import { CategoryExplorer } from "@/components/landing/CategoryExplorer";
import { PartnerRoiCalculator } from "@/components/landing/PartnerRoiCalculator";
import { EcosystemTour } from "@/components/landing/EcosystemTour";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { TrustSecurityGuarantee } from "@/components/landing/TrustSecurityGuarantee";
import { SocialProofStats } from "@/components/landing/SocialProofStats";
import { FaqSection } from "@/components/landing/FaqSection";
import { FinalCtaBand } from "@/components/landing/FinalCtaBand";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { AppDownloadModal } from "@/components/landing/AppDownloadModal";

export default function LandingPage() {
  const { user, loading, isAuthenticated } = useAuthContext();
  const router = useRouter();

  // Bilingual Language State (persisted in localStorage, default: Khmer)
  const [lang, setLang] = useState<"kh" | "en">("kh");
  const [isAppDownloadOpen, setIsAppDownloadOpen] = useState(false);

  // Initialize language from browser storage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("sf_landing_lang");
      if (savedLang === "kh" || savedLang === "en") {
        setLang(savedLang);
      }
    } catch {
      // Fallback silently if storage unavailable
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "kh" ? "km" : "en";
  }, [lang]);

  const handleLanguageChange = (newLang: "kh" | "en") => {
    setLang(newLang);
    try {
      localStorage.setItem("sf_landing_lang", newLang);
    } catch {
      // Ignore storage write errors
    }
  };

  // Redirect authenticated operators to their respective dashboards
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "company_admin") {
        router.push("/company/dashboard");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden">
      {/* 1. Sticky Navigation Header */}
      <LandingHeader
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onOpenAppDownload={() => setIsAppDownloadOpen(true)}
      />

      <main>
        {/* 2. Hero Section: Consumer-First Value Prop & Operating System Showcase */}
        <HeroSection
          lang={lang}
          onOpenAppDownload={() => setIsAppDownloadOpen(true)}
        />

        {/* 3. Consumer Service Category Discovery (id="services") */}
        <CategoryExplorer lang={lang} />

        {/* 4. Trust, Security & Ministry Verification Guarantees (id="trust") */}
        <TrustSecurityGuarantee lang={lang} />

        {/* 5. 3-Way Ecosystem Interactive Tour (id="ecosystem") */}
        <EcosystemTour lang={lang} />

        {/* 6. Social Proof & Verified Cambodian Partner Case Studies */}
        <SocialProofStats lang={lang} />

        {/* 7. Business Track: ROI Calculator + Comparison Table (id="for-business") */}
        <section id="for-business" className="scroll-mt-16">
          <PartnerRoiCalculator lang={lang} />
          <ComparisonTable lang={lang} />
        </section>

        {/* 8. Dedicated Dual-Track Sponsor & Ecosystem Alliances Marquee Carousel (Pre-Footer Band) */}
        <PartnershipCarousel lang={lang} />

        {/* 9. Operational FAQs & Objection Handling (id="faqs") */}
        <FaqSection lang={lang} />

        {/* 10. Final Conversion Band: Consumer + Company Tracks */}
        <FinalCtaBand
          lang={lang}
          onOpenAppDownload={() => setIsAppDownloadOpen(true)}
        />
      </main>

      {/* 11. Localized Footer */}
      <LandingFooter lang={lang} />

      {/* Mobile App Download Trigger Modal */}
      <AppDownloadModal
        isOpen={isAppDownloadOpen}
        onClose={() => setIsAppDownloadOpen(false)}
        lang={lang}
      />
    </div>
  );
}
