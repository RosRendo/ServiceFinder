"use client";

import React, { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { Percent, Save, Loader2 } from "lucide-react";
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

const LABEL = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";
const INPUT = "h-9 bg-background border-border text-xs rounded-xl";
const FORM_ID = "commission-rule-form";

const EMPTY: Partial<CommissionRuleRecord> = {
  tierName: "",
  minMonthlyJobs: 0,
  maxMonthlyJobs: 50,
  platformTakeRatePercent: 15,
  technicianPayoutPercent: 85,
  status: "active",
  description: "",
};

export function CommissionRuleDrawer({
  open,
  onClose,
  rule,
  onSave,
  isSaving = false,
}: CommissionRuleDrawerProps) {
  const [formData, setFormData] = useState<Partial<CommissionRuleRecord>>(EMPTY);

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
      setFormData(EMPTY);
    }
  }, [rule]);

  const isEditing = Boolean(rule?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tierName?.trim()) return;
    onSave?.(formData);
  };

  // Technician share always mirrors 100 - platform fee
  const handlePlatformRateChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setFormData({
      ...formData,
      platformTakeRatePercent: clamped,
      technicianPayoutPercent: 100 - clamped,
    });
  };

  const platform = formData.platformTakeRatePercent ?? 15;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? rule?.tierName : "New Commission Tier"}
      subtitle="Volume thresholds and platform take-rate"
      width="md"
      headerIcon={Percent}
      badge={
        isEditing ? (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
            rule?.status === "active"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-muted border-border text-muted-foreground"
          )}>
            {rule?.status}
          </span>
        ) : undefined
      }
      footer={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs rounded-xl">
            Cancel
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            disabled={isSaving || !formData.tierName?.trim()}
            className="flex-1 h-9 text-xs rounded-xl font-bold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {isSaving ? "Saving..." : isEditing ? "Update Tier" : "Create Tier"}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="p-6 space-y-5 font-sans text-xs">
        {/* Tier Name */}
        <div className="space-y-1.5">
          <label className={LABEL}>Tier Name</label>
          <Input
            required
            value={formData.tierName || ""}
            onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
            placeholder="e.g. Master Contractor Tier"
            className={INPUT}
          />
        </div>

        {/* Job Volume Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={LABEL}>Min Monthly Jobs</label>
            <Input
              type="number"
              min="0"
              value={formData.minMonthlyJobs ?? 0}
              onChange={(e) => setFormData({ ...formData, minMonthlyJobs: parseInt(e.target.value) || 0 })}
              className={INPUT}
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL}>Max Monthly Jobs</label>
            <Input
              type="number"
              min="1"
              value={formData.maxMonthlyJobs ?? 50}
              onChange={(e) => setFormData({ ...formData, maxMonthlyJobs: parseInt(e.target.value) || 50 })}
              className={INPUT}
            />
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={LABEL}>Revenue Allocation</span>
            <span className="text-[10px] font-semibold text-muted-foreground">Total 100%</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Platform Fee (%)</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={platform}
                onChange={(e) => handlePlatformRateChange(parseFloat(e.target.value) || 0)}
                className={cn(INPUT, "font-bold")}
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground">Technician Share (%)</span>
              <Input
                type="number"
                disabled
                value={formData.technicianPayoutPercent ?? 85}
                className={cn(INPUT, "font-bold text-emerald-500 bg-muted/40")}
              />
            </div>
          </div>
          {/* Visual split bar */}
          <div className="h-1.5 w-full rounded-full bg-emerald-500/30 overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${platform}%` }} />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className={LABEL}>Rule Status</label>
          <div className="inline-flex p-0.5 rounded-xl border border-border bg-muted/30">
            {(["active", "inactive"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData({ ...formData, status })}
                className={cn(
                  "px-4 h-8 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                  formData.status === status
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className={LABEL}>Policy Description</label>
          <Textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g. Awarded when technician maintains > 4.8 rating over 50 completed bookings."
            className="bg-background border-border text-xs rounded-xl min-h-[80px]"
          />
        </div>
      </form>
    </BaseDrawer>
  );
}

export default CommissionRuleDrawer;
