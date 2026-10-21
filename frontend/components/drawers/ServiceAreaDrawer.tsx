"use client";

import React, { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { MapPin, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ServiceAreaRecord {
  id?: string | number;
  name: string;
  code?: string;
  city?: string;
  districts?: string[];
  coverageRadiusKm?: number;
  status: "active" | "inactive" | "pending";
  baseDeliveryFee?: number;
  surgeMultiplier?: number;
  notes?: string;
}

interface ServiceAreaDrawerProps {
  open: boolean;
  onClose: () => void;
  area: ServiceAreaRecord | null;
  onSave?: (updatedArea: Partial<ServiceAreaRecord>) => void;
  isSaving?: boolean;
}

const EMPTY_AREA: Partial<ServiceAreaRecord> = {
  name: "",
  city: "Phnom Penh",
  coverageRadiusKm: 15,
  status: "active",
  baseDeliveryFee: 3.5,
  surgeMultiplier: 1.0,
  notes: "",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  inactive: "bg-muted text-foreground border-border",
};

export function ServiceAreaDrawer({ open, onClose, area, onSave, isSaving = false }: ServiceAreaDrawerProps) {
  const [formData, setFormData] = useState<Partial<ServiceAreaRecord>>(EMPTY_AREA);

  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name || "",
        code: area.code || "",
        city: area.city || "Phnom Penh",
        coverageRadiusKm: area.coverageRadiusKm || 15,
        status: area.status || "active",
        baseDeliveryFee: area.baseDeliveryFee ?? 3.5,
        surgeMultiplier: area.surgeMultiplier ?? 1.0,
        notes: area.notes || "",
      });
    } else {
      setFormData(EMPTY_AREA);
    }
  }, [area]);

  const isEditing = Boolean(area?.id);
  const labelCls = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";
  const inputCls = "h-9 bg-background border-border text-xs rounded-xl text-foreground";

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave?.(formData);
  };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? area?.name || "Edit Service Zone" : "New Service Area"}
      subtitle="Coverage boundary, delivery surcharge and surge pricing."
      headerIcon={MapPin}
      width="md"
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSaving || !formData.name?.trim()}
            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 rounded-xl"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Area"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Zone Name *</label>
            <Input
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Khan Chamkarmon"
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Municipality</label>
            <Input
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Phnom Penh"
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Radius (km)</label>
            <Input
              type="number"
              step="0.5"
              value={formData.coverageRadiusKm ?? 15}
              onChange={(e) => setFormData({ ...formData, coverageRadiusKm: parseFloat(e.target.value) || 0 })}
              className={cn(inputCls, "font-mono")}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Surcharge ($)</label>
            <Input
              type="number"
              step="0.25"
              value={formData.baseDeliveryFee ?? 3.5}
              onChange={(e) => setFormData({ ...formData, baseDeliveryFee: parseFloat(e.target.value) || 0 })}
              className={cn(inputCls, "font-mono")}
            />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Surge Ratio</label>
            <Input
              type="number"
              step="0.1"
              value={formData.surgeMultiplier ?? 1.0}
              onChange={(e) => setFormData({ ...formData, surgeMultiplier: parseFloat(e.target.value) || 1.0 })}
              className={cn(inputCls, "font-mono")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Status</label>
          <div className="grid grid-cols-3 gap-2">
            {(["active", "pending", "inactive"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={cn(
                  "h-8.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-colors",
                  formData.status === status
                    ? STATUS_STYLES[status]
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Dispatch Notes</label>
          <Textarea
            value={formData.notes || ""}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Traffic surge between 5pm–7pm, allow extra travel buffer."
            className="bg-background border-border text-xs rounded-xl min-h-[85px] resize-none text-foreground"
          />
        </div>
      </form>
    </BaseDrawer>
  );
}

export default ServiceAreaDrawer;
