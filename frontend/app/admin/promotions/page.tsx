"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, Loader2, Tag, Percent, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    code: "",
    discountPercent: "",
    maxUses: "",
    expiresAt: "",
    isActive: true
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/promo-codes");
      const payload = res.data.data || res.data;
      setPromos(Array.isArray(payload) ? payload : payload.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load promotions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const filtered = promos.filter((p) =>
    p.code?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setFormData({ code: "", discountPercent: "", maxUses: "", expiresAt: "", isActive: true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.discountPercent) {
      toast({ title: "Error", description: "Code and Discount Percent are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        discountPercent: Number(formData.discountPercent),
        maxUses: formData.maxUses ? Number(formData.maxUses) : undefined,
        expiresAt: formData.expiresAt || undefined,
        isActive: formData.isActive
      };
      await api.post("/promo-codes", payload);
      toast({ title: "Success", description: "Promo code created successfully" });
      setDialogOpen(false);
      fetchPromos();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create promo code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (p: PromoCode) => {
    try {
      await api.patch(`/promo-codes/${p.id}/toggle`);
      toast({ title: "Success", description: `Promo code ${p.isActive ? "deactivated" : "activated"}` });
      fetchPromos();
    } catch {
      toast({ title: "Error", description: "Failed to toggle promo code state", variant: "destructive" });
    }
  };

  const handleDelete = async (p: PromoCode) => {
    if (!confirm(`Delete promo code "${p.code}"?`)) return;
    try {
      await api.delete(`/promo-codes/${p.id}`);
      toast({ title: "Success", description: "Promo code deleted successfully" });
      fetchPromos();
    } catch {
      toast({ title: "Error", description: "Failed to delete promo code", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promo Codes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate platform-wide discount coupons to drive customer acquisition</p>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Promo Code
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60"
            placeholder="Search promo codes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium ml-auto">{filtered.length} coupons</div>
      </div>

      {/* Table Content */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Tag className="w-10 h-10 text-muted/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-3">No active promotions</p>
            <Button onClick={openAdd} variant="outline" size="sm">Create Promo Code</Button>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5 text-left">Promo Code</th>
                  <th className="px-6 py-3.5 text-left">Discount</th>
                  <th className="px-6 py-3.5 text-left">Redemptions</th>
                  <th className="px-6 py-3.5 text-left">Expiration Date</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((p) => {
                  const isExpired = p.expiresAt && new Date() > new Date(p.expiresAt);
                  return (
                    <tr key={p.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20 px-2.5 py-1 rounded-lg">
                          {p.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Percent className="w-4 h-4 opacity-70 text-violet-600" />
                          {p.discountPercent}% Off
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{p.usedCount}</span>
                        {p.maxUses ? <span className="text-xs"> / {p.maxUses} uses</span> : <span className="text-xs"> uses (unlimited)</span>}
                      </td>
                      <td className="px-6 py-4">
                        {p.expiresAt ? (
                          <span className={cn("flex items-center gap-1 text-xs font-semibold", isExpired ? "text-rose-500" : "text-muted-foreground")}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(p.expiresAt).toLocaleDateString()} {isExpired && "(Expired)"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button type="button" onClick={() => handleToggle(p)} className="hover:opacity-85 transition-opacity">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <ToggleRight className="w-6 h-6 text-emerald-500" />
                              <span className="text-xs font-bold uppercase">Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <ToggleLeft className="w-6 h-6 text-muted-foreground/50" />
                              <span className="text-xs font-bold uppercase">Inactive</span>
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" onClick={() => handleDelete(p)} className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 border-rose-100 hover:border-rose-200">
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Promo Code</DialogTitle>
            <DialogDescription>
              Create a new promotion code to distribute to platform customers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo Code <span className="text-rose-500">*</span></Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%) <span className="text-rose-500">*</span></Label>
                <Input
                  id="discount"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
                  placeholder="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData((p) => ({ ...p, maxUses: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration Date (optional)</Label>
              <Input
                id="expiry"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData((p) => ({ ...p, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="font-bold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Promo Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
