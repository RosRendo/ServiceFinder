"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  variant?: "full" | "mark" | "horizontal";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string;
  withLink?: boolean;
}

const sizeConfig = {
  xs: {
    mark: "w-5 h-5",
    textService: "text-[10px]",
    textFinder: "text-[12px]",
    height: "h-6",
    gap: "gap-1.5",
  },
  sm: {
    mark: "w-7 h-7",
    textService: "text-xs",
    textFinder: "text-sm",
    height: "h-8",
    gap: "gap-2",
  },
  md: {
    mark: "w-9 h-9",
    textService: "text-sm",
    textFinder: "text-base",
    height: "h-10",
    gap: "gap-2.5",
  },
  lg: {
    mark: "w-11 h-11",
    textService: "text-base",
    textFinder: "text-lg",
    height: "h-12",
    gap: "gap-3",
  },
  xl: {
    mark: "w-14 h-14",
    textService: "text-lg",
    textFinder: "text-xl",
    height: "h-16",
    gap: "gap-3.5",
  },
};

/**
 * ServiceFinder Vector Map-Pin Emblem
 * Teardrop ribbon in sapphire -> electric cyan with an inner solar amber beacon and upward discovery sparks.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 select-none", className)}
      aria-label="ServiceFinder Logo Mark"
    >
      <defs>
        <linearGradient id="bl-pin-ribbon" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="85%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>

        <linearGradient id="bl-pin-inner" x1="30%" y1="20%" x2="90%" y2="85%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="60%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <radialGradient id="bl-solar-beacon" cx="40%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="50%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </radialGradient>

        <linearGradient id="bl-spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Upward Discovery Sparks */}
      <path d="M68 24 L75 8 L71 21 Z" fill="url(#bl-spark-grad)" />
      <path d="M74 27 L88 18 L76 25 Z" fill="url(#bl-spark-grad)" />
      <path d="M72 32 L85 30 L74 34 Z" fill="#06B6D4" />

      {/* Outer Teardrop Ribbon */}
      <path
        d="M48 88 
           C43 81 20 56 20 38 
           C20 22.5 32.5 10 48 10 
           C59 10 68 16 71 25
           C69 25 64 26 62 29
           C58.5 24 53.5 21 48 21
           C38.6 21 31 28.6 31 38
           C31 51 44 69 48 76
           C52 69 65 51 65 38
           C65 36 64.7 34 64.2 32.2
           C67.5 30.5 70.8 33 71.5 35
           C73.5 39 74 44 72 49
           C68 62 53 81 48 88 Z"
        fill="url(#bl-pin-ribbon)"
      />

      {/* Fluid Inner Accent */}
      <path
        d="M48 88
           C53 81 68 62 72 49
           C69 56 61 70 48 82
           C35 70 27 56 24 49
           C22 55 35 73 48 88 Z"
        fill="url(#bl-pin-inner)"
        opacity="0.9"
      />

      {/* Solar Core Beacon */}
      <circle cx="48" cy="38" r="10.5" fill="url(#bl-solar-beacon)" />
    </svg>
  );
}

export function BrandLogo({
  variant = "full",
  size = "md",
  className,
  href = "/",
  withLink = true,
}: BrandLogoProps) {
  const currentSize = sizeConfig[size];

  const content = (
    <div
      className={cn(
        "inline-flex items-center select-none group transition-opacity hover:opacity-95",
        currentSize.height,
        currentSize.gap,
        className
      )}
    >
      {/* Dynamic Map-Marker Mark */}
      <BrandMark className={currentSize.mark} />

      {/* Typography: Stacked Lockup to solve the 13-character horizontal stretch */}
      {variant === "full" && (
        <div className="flex flex-col justify-center leading-none text-left">
          <span className="sr-only">ServiceFinder</span>
          <span
            aria-hidden="true"
            className={cn(
              "font-extrabold uppercase tracking-[0.14em] text-foreground dark:text-slate-100",
              currentSize.textService
            )}
          >
            SERVICE
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "font-black tracking-[0.06em] bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-400 dark:to-cyan-400 -mt-0.5",
              currentSize.textFinder
            )}
          >
            FINDER
          </span>
        </div>
      )}

      {/* Single-line Horizontal Variant if requested */}
      {variant === "horizontal" && (
        <div className="flex items-center gap-1 font-black text-lg tracking-tight">
          <span className="text-foreground">Service</span>
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Finder
          </span>
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
