"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Menu, X, ArrowRight, ShieldCheck, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { landingDictionary } from "@/lib/landing-dictionary";

import { BrandLogo } from "@/components/brand/BrandLogo";

interface LandingHeaderProps {
  lang: "kh" | "en";
  onLanguageChange: (newLang: "kh" | "en") => void;
  onOpenAppDownload: () => void;
}

export function LandingHeader({
  lang,
  onLanguageChange,
  onOpenAppDownload,
}: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dict = landingDictionary[lang].nav;

  const toggleLanguage = () => {
    onLanguageChange(lang === "kh" ? "en" : "kh");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo variant="full" size="md" href="/" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#for-business"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dict.forBusinesses}
          </a>
          <a
            href="#services"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dict.services}
          </a>
          <a
            href="#ecosystem"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dict.howItWorks}
          </a>
          <a
            href="#trust"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dict.trust}
          </a>
          <a
            href="#faqs"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {dict.faqs}
          </a>
        </nav>

        {/* Action Controls & Language Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
            aria-label="Switch language"
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span>{lang === "kh" ? "English" : "ភាសាខ្មែរ"}</span>
          </button>

          {/* App Download Trigger */}
          <button
            onClick={onOpenAppDownload}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>{dict.downloadApp}</span>
          </button>

          {/* Login Link */}
          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2 py-1.5 transition-colors"
          >
            {dict.login}
          </Link>

          {/* Partner Registration Primary CTA */}
          <Link href="/auth/register?role=company_admin&ref=landing_header">
            <Button
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>{dict.partnerRegister}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700"
          >
            <Globe className="h-3 w-3 text-slate-500" />
            <span>{lang === "kh" ? "EN" : "KH"}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
            className="p-1.5 text-slate-600 hover:text-slate-900"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-lg">
          <div className="flex flex-col gap-3">
            <a
              href="#for-business"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {dict.forBusinesses}
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {dict.services}
            </a>
            <a
              href="#ecosystem"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {dict.howItWorks}
            </a>
            <a
              href="#trust"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {dict.trust}
            </a>
            <a
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {dict.faqs}
            </a>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAppDownload();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>{dict.downloadApp}</span>
              </button>
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="flex-1 text-center py-2 text-sm font-semibold text-slate-700 rounded-lg border border-slate-200"
                >
                  {dict.login}
                </Link>
                <Link
                  href="/auth/register?role=company_admin&ref=landing_header_mobile"
                  className="flex-1 text-center py-2 text-sm font-bold uppercase tracking-wider text-white bg-slate-900 rounded-lg shadow-sm"
                >
                  {dict.partnerRegister}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
