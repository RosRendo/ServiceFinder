"use client";

import Link from "next/link";
import { ShieldCheck, QrCode, MapPin, Mail, Phone } from "lucide-react";
import { landingDictionary } from "@/lib/landing-dictionary";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface LandingFooterProps {
  lang: "kh" | "en";
}

export function LandingFooter({ lang }: { lang: "kh" | "en" }) {
  const dict = landingDictionary[lang].footer;

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info & Local Trust */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo variant="full" size="md" href="/" />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {dict.brandTagline}
            </p>

            {/* Ministry & Bakong Credibility Pill */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 max-w-fit">
                <QrCode className="h-4 w-4 text-white" />
                <span className="font-medium">{dict.bakongSupported}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 max-w-fit">
                <ShieldCheck className="h-4 w-4 text-white" />
                <span className="font-medium">
                  {lang === "kh"
                    ? "ចុះបញ្ជីពាណិជ្ជកម្មស្របច្បាប់នៅកម្ពុជា"
                    : "Officially Registered with Ministry of Commerce"}
                </span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>{dict.phnomPenhAddress}</span>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {dict.companyCol}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#for-business" className="hover:text-white transition-colors">
                  {dict.partnerProgram}
                </a>
              </li>
              <li>
                <a href="#ecosystem" className="hover:text-white transition-colors">
                  {lang === "kh" ? "របៀបដំណើរការ" : "Platform Architecture"}
                </a>
              </li>
              <li>
                <a href="#trust" className="hover:text-white transition-colors">
                  {lang === "kh" ? "ការធានាសុវត្ថិភាព" : "Safety Guarantees"}
                </a>
              </li>
              <li>
                <Link href="/auth/register?role=company_admin" className="hover:text-white transition-colors">
                  {lang === "kh" ? "ចុះឈ្មោះក្រុមហ៊ុន" : "Company Registration"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Trades */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {dict.servicesCol}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/services?category=air-conditioning" className="hover:text-white transition-colors">
                  {dict.airConditioning}
                </Link>
              </li>
              <li>
                <Link href="/services?category=electrical" className="hover:text-white transition-colors">
                  {dict.electrical}
                </Link>
              </li>
              <li>
                <Link href="/services?category=plumbing" className="hover:text-white transition-colors">
                  {dict.plumbing}
                </Link>
              </li>
              <li>
                <Link href="/services?category=cleaning" className="hover:text-white transition-colors">
                  {dict.cleaning}
                </Link>
              </li>
              <li>
                <Link href="/services?category=handyman" className="hover:text-white transition-colors">
                  {dict.handyman}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {dict.legalCol}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {dict.termsConditions}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {dict.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/sla" className="hover:text-white transition-colors">
                  {dict.slaGuarantee}
                </Link>
              </li>
              <li>
                <Link href="/escrow" className="hover:text-white transition-colors">
                  {dict.escrowRules}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} ServiceFinder Platform. {dict.rightsReserved}</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-medium">Bakong KHQR</span>
            <span className="text-slate-400 font-medium">ABA Pay</span>
            <span className="text-slate-400 font-medium">Wing Bank</span>
            <span className="text-slate-400 font-medium">Visa / Mastercard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
