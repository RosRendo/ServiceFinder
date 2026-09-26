"use client";

import React, { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { MapPin, CheckCircle, Save, Layers, AlertCircle } from "lucide-react";
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

export function ServiceAreaDrawer({
  open,
  onClose,
  area,
  onSave,
  isSaving = false,
}: ServiceAreaDrawerProps) {
  const [formData, setFormData] = useState<Partial<ServiceAreaRecord>>({
    name: "",
    city: "Phnom Penh",
    coverageRadiusKm: 15,
    status: "active",
    baseDeliveryFee: 3.5,
    surgeMultiplier: 1.0,
    notes: "",
  });

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
      setFormData({
        name: "",
        city: "Phnom Penh",
        coverageRadiusKm: 15,
        status: "active",
        baseDeliveryFee: 3.5,
        surgeMultiplier: 1.0,
        notes: "",
      });
    }
  }, [area]);

  if (!open) return null;

  const isEditing = Boolean(area?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave?.(formData);
  };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Service Zone: ${area?.name}` : "Configure New Service Area"}
      subtitle="Operational boundaries, district dispatch limits & surcharge multipliers"
      width="lg"
      headerIcon={MapPin}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background font-sans text-slate-900">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Zone Name & Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Area / Zone Name</label>
              <Input
                required
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Khan Chamkarmon"
                className="bg-white border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Primary Municipality</label>
              <Input
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Phnom Penh"
                className="bg-white border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Radius (km)</label>
              <Input
                type="number"
                step="0.5"
                value={formData.coverageRadiusKm ?? 15}
                onChange={(e) => setFormData({ ...formData, coverageRadiusKm: parseFloat(e.target.value) || 0 })}
                className="bg-white border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Base Surcharge ($)</label>
              <Input
                type="number"
                step="0.25"
                value={formData.baseDeliveryFee ?? 3.5}
                onChange={(e) => setFormData({ ...formData, baseDeliveryFee: parseFloat(e.target.value) || 0 })}
                className="bg-white border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Surge Ratio</label>
              <Input
                type="number"
                step="0.1"
                value={formData.surgeMultiplier ?? 1.0}
                onChange={(e) => setFormData({ ...formData, surgeMultiplier: parseFloat(e.target.value) || 1.0 })}
                className="bg-white border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Zone Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Status</label>
            <div className="flex items-center gap-3">
              {(["active", "inactive", "pending"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
                    formData.status === status
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Operational Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Dispatch Restrictions / Notes</label>
            <Textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Traffic surge between 5pm-7pm, require extra travel buffer."
              className="bg-white border-slate-200 text-sm min-h-[90px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold text-slate-700 border-slate-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !formData.name?.trim()}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Area"}
          </Button>
        </div>
      </form>
    </BaseDrawer>
  );
}

export default ServiceAreaDrawer;
