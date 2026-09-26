"use client";

import { useState } from "react";
import { X, Smartphone, QrCode, Download, Apple, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "kh" | "en";
}

export function AppDownloadModal({ isOpen, onClose, lang }: AppDownloadModalProps) {
  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close download modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Smartphone className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-slate-900">
            {lang === "kh" ? "ទាញយកកម្មវិធីទូរស័ព្ទ ServiceFinder" : "Get the ServiceFinder Mobile App"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {lang === "kh"
              ? "ជ្រើសរើសកម្មវិធីដែលត្រូវនឹងតម្រូវការរបស់អ្នក៖ សម្រាប់អតិថិជនកក់សេវាកម្ម ឬសម្រាប់ជាងបច្ចេកទេសទទួលការងារ"
              : "Choose the application for your role: Book services as a client or receive jobs as a field technician."}
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === "customer"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {lang === "kh" ? "សម្រាប់អតិថិជន (Client)" : "For Customers (Client)"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === "staff"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {lang === "kh" ? "សម្រាប់ជាងបច្ចេកទេស (Staff)" : "For Field Staff (Tech)"}
          </button>
        </div>

        {/* Platform Downloads with Realistic QR & Links */}
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Android Companion (APK / Play)
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === "kh"
                    ? "ទាញយកឯកសារ APK ដោយផ្ទាល់ ឬតាមរយៈ Google Play"
                    : "Direct APK installation or Google Play Store preview."}
                </p>
              </div>
              <a
                href="/downloads/servicefinder-customer.apk"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>APK</span>
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Apple className="h-4 w-4 text-slate-900" />
                  iOS Companion (Apple TestFlight)
                </span>
                <p className="text-[11px] text-slate-500">
                  {lang === "kh"
                    ? "សាកល្បងនៅលើ iPhone តាមរយៈកម្មវិធី Apple TestFlight"
                    : "Install the iOS client preview via Apple TestFlight."}
                </p>
              </div>
              <a
                href="https://testflight.apple.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <span>TestFlight</span>
              </a>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-5 border-t border-slate-100 pt-4 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{lang === "kh" ? "តាមដានទីតាំងជាងផ្ទាល់" : "Live GPS Staff Arrival"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{lang === "kh" ? "ស្កេន Bakong KHQR ភ្លាមៗ" : "Instant Bakong KHQR"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{lang === "kh" ? "ការជូនដំណឹងការងារ ២៤/៧" : "Real-time Push Alerts"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>{lang === "kh" ? "សុវត្ថិភាពទិន្នន័យខ្ពស់" : "Secure End-to-End"}</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full text-xs font-semibold py-2 rounded-lg border-slate-200"
          >
            {lang === "kh" ? "បិទផ្ទាំងនេះ" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
