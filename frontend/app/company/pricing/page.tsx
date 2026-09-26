"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Loader2, DollarSign, Calendar, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { cn } from "@/lib/utils";

interface PricingRule {
  id: string;
  name: string;
  dayOfWeek: number | null;
  startHour: number | null;
  endHour: number | null;
  surchargePercent: number;
  isActive: boolean;
}

const DAYS_MAP = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTargetRule, setDeleteTargetRule] = useState<PricingRule | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    dayOfWeek: "any",
    startHour: "",
    endHour: "",
    surchargePercent: ""
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies/my-company/pricing-rules");
      const payload = res.data.data || res.data;
      setRules(Array.isArray(payload) ? payload : []);
    } catch {
      toast({ title: "Error", description: "Failed to load pricing rules", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const openAdd = () => {
    setFormData({ name: "", dayOfWeek: "any", startHour: "", endHour: "", surchargePercent: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.surchargePercent) {
      toast({ title: "Error", description: "Name and Surcharge Percent are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        dayOfWeek: formData.dayOfWeek === "any" ? undefined : Number(formData.dayOfWeek),
        startHour: formData.startHour ? Number(formData.startHour) : undefined,
        endHour: formData.endHour ? Number(formData.endHour) : undefined,
        surchargePercent: Number(formData.surchargePercent)
      };
      await api.post("/companies/my-company/pricing-rules", payload);
      toast({ title: "Success", description: "Pricing rule created successfully" });
      setDialogOpen(false);
      fetchRules();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create pricing rule", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule: PricingRule) => {
    try {
      await api.patch(`/companies/my-company/pricing-rules/${rule.id}/toggle`);
      toast({ title: "Success", description: `Pricing rule ${rule.isActive ? "deactivated" : "activated"}` });
      fetchRules();
    } catch {
      toast({ title: "Error", description: "Failed to toggle pricing rule", variant: "destructive" });
    }
  };

  const handleDelete = (rule: PricingRule) => {
    setDeleteTargetRule(rule);
  };

  const confirmDelete = async () => {
    if (!deleteTargetRule) return;
    try {
      await api.delete(`/companies/my-company/pricing-rules/${deleteTargetRule.id}`);
      toast({ title: "Success", description: "Pricing rule deleted successfully" });
      setDeleteTargetRule(null);
      fetchRules();
    } catch {
      toast({ title: "Error", description: "Failed to delete pricing rule", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Peak Pricing Rules</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Apply automatic billing surcharges for weekends, holidays, or off-hours</p>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Pricing Rule
        </Button>
      </div>

      {/* Main Grid List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-2xl">
            <DollarSign className="w-10 h-10 text-muted/50 mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No peak pricing rules set</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-4">Introduce weekend or night surcharges to optimize your company's revenue</p>
            <Button onClick={openAdd} variant="outline" size="sm">Create Pricing Rule</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-border bg-card rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow group relative">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="font-bold text-sm text-foreground">{rule.name}</span>
                    <span className="shrink-0 text-xs font-bold text-violet-600 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
                      +{rule.surchargePercent}%
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{rule.dayOfWeek !== null ? `Every ${DAYS_MAP[rule.dayOfWeek]}` : "Any Day"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {rule.startHour !== null && rule.endHour !== null 
                          ? `${rule.startHour}:00 – ${rule.endHour}:00` 
                          : "All Day"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <button type="button" onClick={() => handleToggle(rule)} className="hover:opacity-85 transition-opacity">
                    {rule.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <ToggleLeft className="w-5 h-5 text-muted-foreground/50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                      </span>
                    )}
                  </button>

                  <Button variant="ghost" size="icon" onClick={() => handleDelete(rule)} className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Pricing Rule</DialogTitle>
            <DialogDescription>
              Create surcharges applied automatically when bookings fall within these criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Rule Name <span className="text-rose-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Sunday Rush Hour Surcharge"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dayOfWeek">Applicable Day</Label>
              <select
                id="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData((p) => ({ ...p, dayOfWeek: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none"
              >
                <option value="any">Any Day</option>
                {DAYS_MAP.map((day, idx) => (
                  <option key={day} value={idx}>{day}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startHour">Start Hour (24h format)</Label>
                <Input
                  id="startHour"
                  type="number"
                  min={0}
                  max={23}
                  value={formData.startHour}
                  onChange={(e) => setFormData((p) => ({ ...p, startHour: e.target.value }))}
                  placeholder="e.g. 18"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endHour">End Hour (24h format)</Label>
                <Input
                  id="endHour"
                  type="number"
                  min={0}
                  max={24}
                  value={formData.endHour}
                  onChange={(e) => setFormData((p) => ({ ...p, endHour: e.target.value }))}
                  placeholder="e.g. 23"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="surcharge">Surcharge Percent (%) <span className="text-rose-500">*</span></Label>
              <Input
                id="surcharge"
                type="number"
                min={1}
                max={100}
                value={formData.surchargePercent}
                onChange={(e) => setFormData((p) => ({ ...p, surchargePercent: e.target.value }))}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="font-bold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Rule Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTargetRule}
        onClose={() => setDeleteTargetRule(null)}
        title="Delete Pricing Rule"
        description={deleteTargetRule ? `Are you sure you want to delete the pricing rule "${deleteTargetRule.name}"? Peak surcharges will no longer be applied.` : ""}
        actionType="danger"
        confirmLabel="Delete Rule"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

