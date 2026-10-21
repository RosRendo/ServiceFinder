"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Star, Flag, EyeOff, CheckCircle2, FileText, User, Building2, Briefcase, Trash2, ExternalLink, MessageSquare } from "lucide-react";
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
  isAdmin?: boolean;
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  visible: { label: "Visible", class: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  hidden: { label: "Hidden", class: "text-muted-foreground bg-muted border-border" },
  flagged: { label: "Flagged", class: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
};

export function ReviewDrawer({ open, onClose, review, isAdmin = false }: ReviewDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();

  if (!review) return null;

  const customerName = review.customer || "Client";
  const initials = customerName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CL";

  const badgeConfig = STATUS_BADGES[review.status] || STATUS_BADGES.visible;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={`Review #${review.id?.toString().substring(0, 8)}`}
      subtitle={`${customerName} · ${review.service || "Service"}`}
      badge={
        <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border", badgeConfig.class)}>
          {badgeConfig.label}
        </span>
      }
      width="lg"
    >
      <div className="p-6 space-y-5 font-sans">
        {/* Rating & Customer Hero Card */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3.5">
            <Avatar className="w-11 h-11 rounded-xl border border-border">
              <AvatarFallback className="rounded-xl font-bold bg-muted text-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-bold text-foreground">{customerName}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i < review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                    )}
                  />
                ))}
                <span className="font-mono text-xs font-bold text-foreground ml-1.5">{Number(review.rating).toFixed(1)} / 5.0</span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            {review.date}
          </div>
        </div>

        {/* Written Review Quote */}
        <div className="p-5 bg-card border border-border rounded-2xl relative space-y-2">
          <span className="absolute top-2 left-3.5 text-4xl text-muted-foreground/15 font-serif select-none">“</span>
          <p className="text-xs text-foreground italic leading-relaxed relative z-10 pt-1 px-1">
            {review.text || "No written testimonial comments left by customer."}
          </p>
        </div>

        {/* Context Details */}
        <div className="space-y-2.5 text-xs bg-card border border-border rounded-2xl p-4">
          <p className="font-bold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Order Context
          </p>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Service
            </span>
            <span className="font-medium text-foreground">{review.service}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Merchant Provider
            </span>
            <span className="font-semibold text-foreground">{review.company}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> Field Staff
            </span>
            <span className="font-medium text-foreground">{review.staff}</span>
          </div>
        </div>

        {/* Actions Section */}
        <div className="pt-2">
          {isAdmin ? (
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={() => {
                  toast({ title: "Visibility Toggled", description: "Review visibility has been updated." });
                  onClose();
                }}
                className="h-9 text-xs font-semibold rounded-xl border border-border gap-2"
              >
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{review.status === "hidden" ? "Unhide Review" : "Hide Review"}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast({ title: "Review Flagged", description: "Review has been marked for moderation audit." });
                  onClose();
                }}
                className="h-9 text-xs font-semibold rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 gap-2"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Flag Content</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/company/messages?topic=review_${review.id}`);
                  onClose();
                }}
                className="h-9 text-xs font-semibold rounded-xl border border-border gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Contact Client</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/company/disputes?reviewId=${review.id}`);
                  onClose();
                }}
                className="h-9 text-xs font-semibold rounded-xl border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 gap-2"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Dispute Rating</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </BaseDrawer>
  );
}

export default ReviewDrawer;
