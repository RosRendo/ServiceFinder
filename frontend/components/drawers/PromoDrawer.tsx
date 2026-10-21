"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Tag, Loader2, Percent, Calendar, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface PromoFormData {
  code: string;
  discountPercent: string;
  maxUses: string;
  expiresAt: string;
  isActive: boolean;
}

interface PromoDrawerProps {
  open: boolean;
  onClose: () => void;
  formData: PromoFormData;
  setFormData: React.Dispatch<React.SetStateAction<PromoFormData>>;
  onSave: () => void;
  loading: boolean;
  title?: string;
}

export function PromoDrawer({ open, onClose, formData, setFormData, onSave, loading, title }: PromoDrawerProps) {
  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={title || "Add Promo Code"}
      subtitle="Provision a new discount incentive for customer bookings."
      headerIcon={Tag}
      width="md"
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || !formData.code.trim()}
            onClick={onSave}
            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 rounded-xl"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Promotion</span>
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 text-xs font-sans">
        <div className="space-y-1">
          <Label htmlFor="code" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Promo Code <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. SUMMER25"
              className="pl-9 h-9 bg-background border-border font-mono font-bold text-xs rounded-xl uppercase text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="discount" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              Discount (%) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="discount"
              type="number"
              min={1}
              max={100}
              value={formData.discountPercent}
              onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
              placeholder="20"
              className="h-9 bg-background border-border text-xs rounded-xl font-mono text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="maxUses" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              Usage Cap <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="maxUses"
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData((p) => ({ ...p, maxUses: e.target.value }))}
              placeholder="Unlimited"
              className="h-9 bg-background border-border text-xs rounded-xl font-mono text-foreground"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="expiry" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            Expiration Date <span className="text-muted-foreground font-normal">(Optional)</span>
          </Label>
          <Input
            id="expiry"
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value }))}
            className="h-9 bg-background border-border text-xs rounded-xl font-mono text-foreground"
          />
        </div>
      </div>
    </BaseDrawer>
  );
}

export default PromoDrawer;
