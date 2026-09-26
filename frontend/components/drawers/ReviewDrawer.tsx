"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Star, Flag, EyeOff, CheckCircle2, FileText, User, Building2, Briefcase, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";

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
  const { toast } = useToast();

  if (!review) return null;

  const customerName = review.customer || "Customer";
  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CU";

  return (
    <BaseDrawer open={open} onClose={onClose} title={`Review #${review.id?.toString().substring(0, 8)}`} subtitle={`${customerName} · ${review.service || "Service"}`} width="lg">
      <div className="p-6 space-y-6">
        
        {/* Header / Rating Section */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 rounded-xl border border-border/50 shadow-sm shrink-0">
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">{customerName}</h3>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("w-4 h-4", i < review.rating ? "text-amber-500 fill-current" : "text-muted-foreground/30")} />
                ))}
                <span className="text-xs font-semibold text-foreground ml-1.5">{review.rating}/5 Rating</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border",
              review.status === "visible" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
              review.status === "flagged" ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
              "text-muted-foreground bg-muted border-border"
            )}>
              {review.status || "Visible"}
            </span>
          </div>
        </div>
        
        {/* Review Written Text */}
        <div className="p-5 bg-muted/20 border border-border rounded-xl relative space-y-2">
          <span className="absolute top-2 left-3 text-5xl text-muted-foreground/10 font-serif leading-none">“</span>
          <p className="text-sm text-foreground italic leading-relaxed relative z-10 pt-2 px-1">
            {review.text || "No written comments left by customer."}
          </p>
          <div className="text-[10px] text-muted-foreground text-right font-medium">
            Submitted {new Date(review.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-foreground border-b border-border/50 pb-2 mb-2 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Review Details
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Service</span>
            <span className="font-medium text-foreground">{review.service}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Company</span>
            <span className="font-medium text-foreground">{review.company}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2"><User className="w-3.5 h-3.5" /> Provider Staff</span>
            <span className="font-medium text-foreground">{review.staff}</span>
          </div>
        </div>

        {/* Quick Actions (Company Review Management) */}
        <div className="pt-4 border-t border-border">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">Company Actions</p>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={() => {
                navigator.clipboard.writeText(review.id);
                toast({
                  title: "Copied!",
                  description: "Review ID copied to clipboard.",
                });
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
            >
              <FileText className="w-3.5 h-3.5" />
              Copy ID
            </button>
            <button
              onClick={() => {
                router.push(`/company/messages?topic=review_${review.id}`);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border bg-muted/60 text-foreground hover:bg-muted border-border"
            >
              <User className="w-3.5 h-3.5" />
              Reach Out
            </button>
            <button
              onClick={() => {
                router.push(`/company/disputes?reviewId=${review.id}`);
                onClose();
              }}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors border bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20"
            >
              <Flag className="w-3.5 h-3.5" />
              Dispute
            </button>
          </div>
        </div>

      </div>
    </BaseDrawer>
  );
}
