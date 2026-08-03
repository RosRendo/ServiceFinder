"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, Loader2, Tag, Percent, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { PromoDrawer, PromoFormData } from "@/components/drawers/PromoDrawer";
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
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PromoFormData>({
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
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.discountPercent) {
      toast({ title: "Error", description: "Code and Discount Percent are required", variant: "destructive" });
      return;
    }

    setSaving(true);
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
      setDrawerOpen(false);
      fetchPromos();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to create promo code", variant: "destructive" });
    } finally {
      setSaving(false);
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

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  }, [filtered]);

  const columns: Column<PromoCode>[] = [
    {
      key: "code", header: "Promo Code", sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0 border border-violet-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <span className="font-mono text-sm font-bold bg-muted/50 text-foreground border border-border px-2.5 py-1 rounded-lg">
            {p.code}
          </span>
        </div>
      )
    },
    {
      key: "discount", header: "Discount", sortable: true,
      render: (p) => (
        <span className="flex items-center gap-1 font-bold text-foreground">
          <Percent className="w-3.5 h-3.5 text-violet-500" />
          {p.discountPercent}% Off
        </span>
      )
    },
    {
      key: "redemptions", header: "Redemptions", sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{p.usedCount}</span>
          {p.maxUses ? <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">of {p.maxUses} uses</span> : <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">Unlimited</span>}
        </div>
      )
    },
    {
      key: "expiration", header: "Expiration Date", sortable: true,
      render: (p) => {
        const isExpired = p.expiresAt && new Date() > new Date(p.expiresAt);
        if (!p.expiresAt) return <span className="text-sm font-medium text-muted-foreground">—</span>;
        return (
          <span className={cn("flex items-center gap-1.5 text-xs font-bold", isExpired ? "text-rose-500" : "text-muted-foreground")}>
            <Calendar className="w-3.5 h-3.5" />
            {new Date(p.expiresAt).toLocaleDateString()} {isExpired && "(Expired)"}
          </span>
        );
      }
    },
    {
      key: "status", header: "Status",
      render: (p) => (
        <button type="button" onClick={(e) => { e.stopPropagation(); handleToggle(p); }} className="hover:opacity-80 transition-opacity">
          {p.isActive ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <ToggleRight className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ToggleLeft className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Inactive</span>
            </span>
          )}
        </button>
      )
    },
    {
      key: "actions", header: "Actions", align: "right",
      render: (p) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleDelete(p)} 
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const bulkActions = [
    { label: "Delete Selected", icon: Trash2, onClick: () => toast({ title: "Info", description: "Bulk delete coming soon" }), variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
            placeholder="Search promo codes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex-1" />
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Promo Code
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Coupons", value: filtered.length, color: "text-foreground" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Full-height DataGrid */}
      <div className="flex-1 overflow-hidden relative">
        <DataGrid
          columns={columns}
          data={filtered}
          loading={loading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          emptyIcon={Tag}
          emptyMessage="No active promotions matching this search."
        />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      {/* Drawer */}
      <PromoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        loading={saving}
      />
    </div>
  );
}
