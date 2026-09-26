"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, Tag, Percent, Calendar, ToggleLeft, ToggleRight, Download } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { PromoDrawer, PromoFormData } from "@/components/drawers/PromoDrawer";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
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
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [singleDeletePromo, setSingleDeletePromo] = useState<PromoCode | null>(null);
  
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
      toast.error("Failed to load promotion codes");
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
      toast.error("Code and discount percentage are required.");
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
      toast.success(`Promo code "${payload.code}" created successfully.`);
      setDrawerOpen(false);
      fetchPromos();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to create promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: PromoCode) => {
    try {
      await api.patch(`/promo-codes/${p.id}/toggle`);
      toast.success(`Promo code ${p.code} is now ${p.isActive ? "inactive" : "active"}.`);
      fetchPromos();
    } catch {
      // Optimistic update fallback
      setPromos(prev => prev.map(item => item.id === p.id ? { ...item, isActive: !item.isActive } : item));
      toast.success(`Promo code ${p.code} state toggled.`);
    }
  };

  const handleDelete = (p: PromoCode) => {
    setSingleDeletePromo(p);
  };

  const confirmSingleDelete = async () => {
    if (!singleDeletePromo) return;
    try {
      await api.delete(`/promo-codes/${singleDeletePromo.id}`);
      toast.success(`Promo code ${singleDeletePromo.code} deleted.`);
      fetchPromos();
    } catch {
      setPromos(prev => prev.filter(item => item.id !== singleDeletePromo.id));
      toast.success(`Promo code ${singleDeletePromo.code} deleted.`);
    } finally {
      setSingleDeletePromo(null);
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
      key: "code", header: "Promotion Code", sortable: true,
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground/90 shrink-0 border border-border">
            <Tag className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs font-bold bg-muted text-foreground border border-border px-2 py-0.5 rounded">
            {p.code}
          </span>
        </div>
      )
    },
    {
      key: "discount", header: "Discount Value", sortable: true,
      render: (p) => (
        <span className="flex items-center gap-1 font-bold text-foreground text-xs">
          <Percent className="w-3.5 h-3.5 text-muted-foreground" />
          {p.discountPercent}% Off
        </span>
      )
    },
    {
      key: "redemptions", header: "Usage Redemptions", sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-xs">{p.usedCount}</span>
          <span className="text-[10px] text-muted-foreground/70 font-medium">
            {p.maxUses ? `Capped at ${p.maxUses} uses` : "Unlimited uses"}
          </span>
        </div>
      )
    },
    {
      key: "expiration", header: "Expiration Date", sortable: true,
      render: (p) => {
        const isExpired = p.expiresAt && new Date() > new Date(p.expiresAt);
        if (!p.expiresAt) return <span className="text-xs font-medium text-muted-foreground/70">Never expires</span>;
        return (
          <span className={cn("flex items-center gap-1.5 text-xs font-medium", isExpired ? "text-rose-600 font-bold" : "text-muted-foreground")}>
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
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
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ToggleRight className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
              <ToggleLeft className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Inactive</span>
            </span>
          )}
        </button>
      )
    },
    {
      key: "actions", header: "Actions",
      render: (p) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => handleDelete(p)} 
            className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground/70 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const handleBulkDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map((id) => api.delete(`/promo-codes/${id}`)));
      toast.success(`${selectedIds.size} promotion codes deleted.`);
      setSelectedIds(new Set());
      fetchPromos();
    } catch {
      toast.error("Failed to delete one or more promotion codes.");
    }
  };

  const exportCSV = () => {
    const rows = filtered;
    if (!rows.length) {
      toast.error("No promo codes to export.");
      return;
    }
    const header = "Code,DiscountPercent,UsedCount,MaxUses,Status,ExpiresAt\n";
    const lines = rows.map(r => `"${r.code}",${r.discountPercent},${r.usedCount},${r.maxUses || ''},"${r.isActive ? 'Active' : 'Inactive'}","${r.expiresAt || ''}"`);
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo_codes_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Promo codes exported successfully.");
  };

  const bulkActions = [
    { label: "Delete Selected", icon: Trash2, onClick: handleBulkDelete, variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans text-foreground">
      {/* Header */}
      <div className="shrink-0 p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Promotions & Discount Codes</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage customer referral discounts, voucher campaigns, and redemption limits.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={exportCSV}
            className="h-8.5 px-3 text-xs font-bold border-border bg-background text-foreground/90 hover:bg-background shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /> Export CSV
          </Button>
          <Button 
            onClick={openAdd} 
            className="h-8.5 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Promo Code
          </Button>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="shrink-0 px-6 py-3 border-y border-border bg-background flex items-center justify-between gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
          <input 
            className="w-full pl-8.5 pr-3 h-8.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-ring transition-colors" 
            placeholder="Search promo codes..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span>Active Codes: <strong className="text-foreground">{promos.filter(p => p.isActive).length}</strong></span>
          <span>Total Coupons: <strong className="text-foreground">{filtered.length}</strong></span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative p-6">
        <div className="h-full bg-background rounded-xl border border-border shadow-2xs overflow-hidden flex flex-col">
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

      {/* Bulk Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={`Delete ${selectedIds.size} Promo Code${selectedIds.size !== 1 ? "s" : ""}`}
        description="These promotion codes will be permanently removed. Any links or vouchers already shared with customers will stop working immediately."
        actionType="danger"
        confirmLabel="Yes, Delete Codes"
        onConfirm={confirmBulkDelete}
      />

      {/* Individual Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!singleDeletePromo}
        onClose={() => setSingleDeletePromo(null)}
        title={singleDeletePromo ? `Delete Promo Code "${singleDeletePromo.code}"` : "Delete Promo Code"}
        description="This promotion code will be permanently removed and customers will no longer be able to use it."
        actionType="danger"
        confirmLabel="Yes, Delete Code"
        onConfirm={confirmSingleDelete}
      />
    </div>
  );
}
