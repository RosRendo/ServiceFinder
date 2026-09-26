"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  QrCode,
  CheckCircle2,
  Zap,
  Sparkles,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import {
  PHNOM_PENH_DISTRICTS,
  SIMULATED_DISPATCH_ORDERS,
  SimulatedDispatchOrder,
} from "@/lib/visual-assets";

interface DispatchMapSimulatorProps {
  lang: "kh" | "en";
}

export function DispatchMapSimulator({ lang }: DispatchMapSimulatorProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>("wo-8421");
  const [isKhqrModalOpen, setIsKhqrModalOpen] = useState<boolean>(false);

  const activeOrder =
    SIMULATED_DISPATCH_ORDERS.find((o) => o.id === selectedOrderId) ||
    SIMULATED_DISPATCH_ORDERS[0];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl overflow-hidden">
      {/* Simulation Window Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-bold text-slate-800">
            {lang === "kh" ? "ផែនទីចាត់ចែងការងាររាជធានីភ្នំពេញ" : "Phnom Penh Live GPS Dispatch Map"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{lang === "kh" ? "ដំណើរការផ្ទាល់" : "Live Real-Time"}</span>
        </div>
      </div>

      {/* Stylized Vector SVG Map Canvas */}
      <div className="relative h-56 sm:h-64 w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden select-none">
        {/* Subtle Map Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        <svg
          viewBox="0 0 500 300"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Mekong & Tonle Sap Stylized River Path */}
          <path
            d="M 380 0 Q 340 100 360 200 Q 380 260 420 300"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="18"
            opacity="0.3"
          />
          <path
            d="M 280 0 Q 320 80 340 130"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="12"
            opacity="0.3"
          />

          {/* District Boundary Circles & Glows */}
          {PHNOM_PENH_DISTRICTS.map((d) => (
            <g key={d.id} className="cursor-pointer">
              <circle
                cx={`${d.x * 5}`}
                cy={`${d.y * 3}`}
                r="18"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <circle
                cx={`${d.x * 5}`}
                cy={`${d.y * 3}`}
                r="3"
                fill={activeOrder.districtId === d.id ? "#38bdf8" : "#64748b"}
              />
              <text
                x={`${d.x * 5}`}
                y={`${d.y * 3 + 28}`}
                fill="#94a3b8"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                className="font-sans"
              >
                {lang === "kh" ? d.nameKh : d.nameEn}
              </text>
            </g>
          ))}

          {/* Active Animated Route Vector */}
          <path
            d={activeOrder.pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Destination Customer Pin */}
          <g transform={`translate(${activeOrder.vehicleCoord.x + 30}, ${activeOrder.vehicleCoord.y + 15})`}>
            <circle r="8" fill="#ef4444" opacity="0.2" className="animate-ping" />
            <circle r="4" fill="#ef4444" />
          </g>

          {/* Vehicle Marker Pin */}
          <g
            transform={`translate(${activeOrder.vehicleCoord.x}, ${activeOrder.vehicleCoord.y})`}
            className="transition-transform duration-500 ease-out"
          >
            <circle r="12" fill="#2563eb" opacity="0.3" />
            <circle r="8" fill="#2563eb" />
            <circle r="3" fill="#ffffff" />
          </g>
        </svg>

        {/* Floating ETA HUD Indicator */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 text-xs text-white shadow-lg">
          <Navigation className="h-3.5 w-3.5 text-blue-400 animate-spin" />
          <div>
            <span className="font-bold block leading-none">
              {activeOrder.technicianName}
            </span>
            <span className="text-[10px] text-slate-400">
              {activeOrder.etaMinutes > 0
                ? `${activeOrder.etaMinutes} mins arrival`
                : "Arrived & Settled"}
            </span>
          </div>
        </div>

        {/* Bakong KHQR Quick Trigger Button */}
        <button
          type="button"
          onClick={() => setIsKhqrModalOpen(true)}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 shadow-md transition-all cursor-pointer"
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>{lang === "kh" ? "មើល Bakong KHQR" : "View Bakong KHQR"}</span>
        </button>
      </div>

      {/* Interactive Work Order Dispatch Cards */}
      <div className="mt-3 space-y-2">
        {SIMULATED_DISPATCH_ORDERS.map((order) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              className={`rounded-xl p-3 border transition-all cursor-pointer flex items-center justify-between text-xs ${
                isSelected
                  ? "border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20"
                  : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900">
                    {order.orderNumber}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[11px] font-medium text-slate-600">
                    {lang === "kh" ? order.titleKh : order.titleEn}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    {lang === "kh" ? order.districtNameKh : order.districtNameEn}
                  </span>
                  <span>•</span>
                  <span>{order.technicianName}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-black text-slate-900">
                  ${order.amountUsd.toFixed(2)}
                </div>
                <span
                  className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    order.status === "settled"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.status === "settled" ? "Settled" : `${order.etaMinutes}m ETA`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Bakong KHQR Payment Popover Modal */}
      {isKhqrModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-center space-y-3">
            <button
              onClick={() => setIsKhqrModalOpen(false)}
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" />
            </div>

            <div className="space-y-1">
              <span className="rounded-full bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                Bakong KHQR
              </span>
              <h4 className="text-xs font-black text-slate-900">
                {lang === "kh" ? "ទូទាត់ជោគជ័យភ្លាមៗ" : "Instant NBC Settlement"}
              </h4>
              <p className="text-[10px] text-slate-500">
                Ref: KHQR-NBC-8422 • Settle to ABA Bank
              </p>
            </div>

            {/* Stylized QR Code Graphic */}
            <div className="mx-auto h-32 w-32 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
              <QrCode className="h-24 w-24 text-slate-900" />
            </div>

            <div className="text-sm font-black text-slate-900">
              $65.00 USD
            </div>

            <button
              type="button"
              onClick={() => setIsKhqrModalOpen(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 rounded-lg"
            >
              {lang === "kh" ? "បិទផ្ទាំងនេះ" : "Close Receipt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
