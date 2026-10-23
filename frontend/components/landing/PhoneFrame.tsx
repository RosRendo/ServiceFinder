import type { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  accentClass?: string;
  className?: string;
}

export function PhoneFrame({
  children,
  accentClass = "bg-blue-900/60",
  className = "",
}: PhoneFrameProps) {
  return (
    <div
      className={`relative w-[280px] sm:w-[305px] h-[570px] rounded-[44px] bg-slate-950 p-2.5 sm:p-3 shadow-2xl shadow-slate-900/30 border-[3px] border-slate-700/80 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden ${className}`}
    >
      <div className="absolute top-24 -left-1.5 w-1 h-8 rounded-l bg-slate-700 pointer-events-none" />
      <div className="absolute top-36 -left-1.5 w-1 h-8 rounded-l bg-slate-700 pointer-events-none" />
      <div className="absolute top-28 -right-1.5 w-1 h-12 rounded-r bg-slate-700 pointer-events-none" />

      <div className="relative z-30 mx-auto h-4 w-22 rounded-full bg-black mb-1 flex items-center justify-between px-2.5 shadow-xs">
        <div className="w-2 h-2 rounded-full bg-slate-900/90 border border-slate-800" />
        <div className={`w-1.5 h-1.5 rounded-full ${accentClass}`} />
      </div>

      <div className="relative w-full h-[515px] rounded-[34px] bg-white overflow-hidden flex flex-col justify-between text-slate-900">
        {children}
      </div>

      <div className="mx-auto h-1 w-24 rounded-full bg-slate-500 mt-1.5" />
    </div>
  );
}
