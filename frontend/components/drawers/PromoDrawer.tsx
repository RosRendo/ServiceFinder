"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Tag, Loader2, Percent, Calendar, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border px-8 py-5">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

export function PromoDrawer({ open, onClose, formData, setFormData, onSave, loading }: PromoDrawerProps) {
  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title="Add Promo Code"
      subtitle="Create a new promotion code to distribute to platform customers"
      headerIcon={Tag}
      footer={
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-background hover:bg-muted/50 border border-border text-foreground h-12 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Promo Code
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        <Section title="Code Details">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-bold text-foreground">Promo Code <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20" 
                  className="pl-10 h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-mono font-bold rounded-xl uppercase"
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Rules & Limitations">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-xs font-bold text-foreground flex items-center gap-1.5">
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
                className="h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                Max Uses <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Input 
                id="maxUses" 
                type="number"
                value={formData.maxUses} 
                onChange={(e) => setFormData((p) => ({ ...p, maxUses: e.target.value }))}
                placeholder="Unlimited" 
                className="h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl"
              />
            </div>
          </div>
        </Section>
        
        <Section title="Expiration">
          <div className="space-y-2">
            <Label htmlFor="expiry" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Expiration Date <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input 
              id="expiry" 
              type="date"
              value={formData.expiresAt} 
              onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value }))}
              className="h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl"
            />
          </div>
        </Section>
      </div>
    </BaseDrawer>
  );
}
