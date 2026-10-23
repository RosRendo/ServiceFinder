/* eslint-disable @next/next/no-img-element */
"use client";


import { useState, useRef, useCallback, useEffect } from "react";
import { ChevronsLeftRight } from "lucide-react";

export interface BeforeAfterScrubberProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  aspectRatio?: string;
}

export function BeforeAfterScrubber({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
  aspectRatio = "aspect-16/10",
}: BeforeAfterScrubberProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clampedX = Math.max(0, Math.min(x, rect.width));
    const percent = (clampedX / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    },
    [handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md ${aspectRatio} ${className}`}
      style={{ touchAction: "pan-y" }}
      onMouseDown={() => setIsDragging(true)}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Background Layer) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        loading="lazy"
      />

      {/* After Badge (Top Right) */}
      <div className="absolute top-3 right-3 z-10 rounded-full bg-emerald-950/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 shadow-xs pointer-events-none">
        {afterLabel}
      </div>

      {/* Before Image (Foreground Layer with CSS clip-path) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath: `inset(0 calc(100% - ${sliderPosition}%) 0 0)`,
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        {/* Before Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-10 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-slate-200 border border-slate-700 shadow-xs">
          {beforeLabel}
        </div>
      </div>

      {/* Vertical Slider Handle Line */}
      <div
        className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.5)] cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Floating Dual-Chevron Knob */}
        <div
          tabIndex={0}
          role="slider"
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPosition)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setSliderPosition((prev) => Math.max(0, prev - 5));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              setSliderPosition((prev) => Math.min(100, prev + 5));
            } else if (e.key === "Home") {
              e.preventDefault();
              setSliderPosition(0);
            } else if (e.key === "End") {
              e.preventDefault();
              setSliderPosition(100);
            }
          }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg border border-slate-200 transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
        >
          <ChevronsLeftRight className="h-4 w-4" />
        </div>
      </div>

      {/* Bottom Micro-hint */}
      <div className="absolute bottom-3 inset-x-0 z-10 flex justify-center pointer-events-none">
        <span className="rounded-full bg-slate-900/70 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-white/90">
          ↔ Drag to compare
        </span>
      </div>
    </div>
  );
}
