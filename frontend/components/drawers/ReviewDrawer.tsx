"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Star, Flag, EyeOff, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface ReviewRow {
  id: string;
  customer: string;
  company: string;
  staff: string;
  rating: number;
  text: string;
  service: string;
  date: string;
  status: "visible" | "hidden" | "flagged";
}

interface ReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  review: ReviewRow | null;
}

export function ReviewDrawer({ open, onClose, review }: ReviewDrawerProps) {
  const router = useRouter();

  if (!review) return null;

  return (
    <BaseDrawer open={open} onClose={onClose} title={`Review #${review.id.substring(0,8)}`} subtitle={`${review.customer} · ${review.service}`}>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-1.5 border-b border-border pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("w-5 h-5", i < review.rating ? "text-amber-500 fill-current" : "text-muted-foreground/30")} />
          ))}
          <span className="text-sm font-medium text-foreground ml-2">{review.rating}/5</span>
        </div>
        
        <div className="p-4 bg-muted/30 border border-border rounded-xl relative">
          <span className="absolute -top-3 -left-2 text-4xl text-muted-foreground/20 font-serif">"</span>
          <p className="text-sm text-foreground italic leading-relaxed relative z-10">{review.text}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
            <span className="font-medium text-foreground">{review.customer}</span>
            <span>{new Date(review.date).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Company</span><span className="font-medium">{review.company}</span></div>
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Staff</span><span className="font-medium">{review.staff}</span></div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-border">
          <button onClick={() => {
              router.push(`/company/reviews/${review.id}`);
              onClose();
          }} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
             <FileText className="w-4 h-4" /> Detail
          </button>
          
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
            <CheckCircle2 className="w-4 h-4" /> Publish
          </button>
          
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20 transition-colors">
            <EyeOff className="w-4 h-4" /> Hide
          </button>
          
          <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
            <Flag className="w-4 h-4" /> Flag
          </button>
        </div>
      </div>
    </BaseDrawer>
  );
}
