"use client";

import React, { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Percent, Save, Layers, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface CommissionRuleRecord {
  id?: string | number;
  tierName: string;
  minMonthlyJobs: number;
  maxMonthlyJobs?: number;
  platformTakeRatePercent: number;
  technicianPayoutPercent: number;
  status: "active" | "inactive";
  applicableCategories?: string[];
  description?: string;
}

interface CommissionRuleDrawerProps {
  open: boolean;
  onClose: () => void;
  rule: CommissionRuleRecord | null;
  onSave?: (updatedRule: Partial<CommissionRuleRecord>) => void;
  isSaving?: boolean;
}

export function CommissionRuleDrawer({
  open,
  onClose,
  rule,
  onSave,
  isSaving = false,
}: CommissionRuleDrawerProps) {
  const [formData, setFormData] = useState<Partial<CommissionRuleRecord>>({
    tierName: "",
    minMonthlyJobs: 0,
    maxMonthlyJobs: 50,
    platformTakeRatePercent: 15,
    technicianPayoutPercent: 85,
    status: "active",
    description: "",
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        tierName: rule.tierName || "",
        minMonthlyJobs: rule.minMonthlyJobs ?? 0,
        maxMonthlyJobs: rule.maxMonthlyJobs ?? 50,
        platformTakeRatePercent: rule.platformTakeRatePercent ?? 15,
        technicianPayoutPercent: rule.technicianPayoutPercent ?? 85,
        status: rule.status || "active",
        description: rule.description || "",
      });
    } else {
      setFormData({
        tierName: "",
        minMonthlyJobs: 0,
        maxMonthlyJobs: 50,
        platformTakeRatePercent: 15,
        technicianPayoutPercent: 85,
        status: "active",
        description: "",
      });
    }
  }, [rule]);

  if (!open) return null;

  const isEditing = Boolean(rule?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tierName?.trim()) return;
    onSave?.(formData);
  };

  const handlePlatformRateChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setFormData({
      ...formData,
      platformTakeRatePercent: clamped,
      technicianPayoutPercent: 100 - clamped,
    });
  };

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Tier Rule: ${rule?.tierName}` : "Create Commission Split Tier"}
      subtitle="Define technician volume thresholds and platform revenue take-rates"
      width="lg"
      headerIcon={Percent}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-background font-sans text-slate-900">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tier Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Tier Name</label>
            <Input
              required
              value={formData.tierName || ""}
              onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
              placeholder="e.g. Master Contractor Tier"
              className="bg-white border-slate-200 text-sm"
            />
          </div>

          {/* Job Volume Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Min Monthly Jobs</label>
              <Input
                type="number"
                min="0"
                value={formData.minMonthlyJobs ?? 0}
                onChange={(e) => setFormData({ ...formData, minMonthlyJobs: parseInt(e.target.value) || 0 })}
                className="bg-white border-slate-200 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Max Monthly Jobs</label>
              <Input
                type="number"
                min="1"
                value={formData.maxMonthlyJobs ?? 50}
                onChange={(e) => setFormData({ ...formData, maxMonthlyJobs: parseInt(e.target.value) || 50 })}
                className="bg-white border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Rate Splits */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Revenue Allocation</span>
              <span className="text-xs font-semibold text-slate-500">Total: 100%</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500">Platform Fee (%)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.platformTakeRatePercent ?? 15}
                  onChange={(e) => handlePlatformRateChange(parseFloat(e.target.value) || 0)}
                  className="bg-white border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-slate-500">Technician Share (%)</span>
                <Input
                  type="number"
                  disabled
                  value={formData.technicianPayoutPercent ?? 85}
                  className="bg-slate-100 border-slate-200 font-bold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Tier Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Rule Status</label>
            <div className="flex items-center gap-3">
              {(["active", "inactive"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all",
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

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Policy Description</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Automatically awarded when technician maintains > 4.8 rating over 50 completed bookings."
              className="bg-white border-slate-200 text-sm min-h-[80px]"
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
            disabled={isSaving || !formData.tierName?.trim()}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isSaving ? "Saving..." : isEditing ? "Update Split Rule" : "Create Split Rule"}
          </Button>
        </div>
      </form>
    </BaseDrawer>
  );
}

export default CommissionRuleDrawer;
