"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Tag, Percent, Calendar, ToggleLeft, ToggleRight, Download, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { PromoDrawer, PromoFormData } from "@/components/drawers/PromoDrawer";
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

const FILTER_TABS = [
  { id: "all", label: "All Promos" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired / Inactive" },
];

export default function PromotionsPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [formData, setFormData] = useState<PromoFormData>({
    code: "",
    discountPercent: "",
    maxUses: "",
    expiresAt: "",
    isActive: true,
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/promo-codes");
      const payload = res.data.data || res.data;
      setPromos(Array.isArray(payload) ? payload : payload.data || []);
      setError(null);
    } catch {
      setError("Failed to load promotion codes. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openAdd = () => {
    setActivePromo(null);
    setFormData({ code: "", discountPercent: "", maxUses: "", expiresAt: "", isActive: true });
    setDrawerOpen(true);
  };

  const openEdit = (p: PromoCode) => {
    setActivePromo(p);
    setFormData({
      code: p.code,
      discountPercent: String(p.discountPercent),
      maxUses: p.maxUses ? String(p.maxUses) : "",
      expiresAt: p.expiresAt ? p.expiresAt.split("T")[0] : "",
      isActive: p.isActive,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, p: PromoCode) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete promo code "${p.code}"?`)) return;
    try {
      await api.delete(`/promo-codes/${p.id}`);
      toast.success(`Promo code "${p.code}" deleted.`);
      fetchPromos();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete promo code");
    }
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
        isActive: formData.isActive,
      };
      await api.post("/promo-codes", payload);
      toast.success(`Promo code "${payload.code}" saved successfully.`);
      setDrawerOpen(false);
      fetchPromos();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save promo code");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent, p: PromoCode) => {
    e.stopPropagation();
    try {
      await api.patch(`/promo-codes/${p.id}/toggle`);
      toast.success(`Promo code ${p.code} is now ${p.isActive ? "inactive" : "active"}.`);
      fetchPromos();
    } catch {
      toast.error("Failed to toggle promotion status");
    }
  };

  // Filter & Search Logic
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
      if (statusFilter === "active" && (!p.isActive || isExpired)) return false;
      if (statusFilter === "expired" && p.isActive && !isExpired) return false;

      if (!search) return true;
      return p.code?.toLowerCase().includes(search.toLowerCase());
    });
  }, [promos, statusFilter, search]);

  const paginatedPromos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPromos.slice(start, start + pageSize);
  }, [filteredPromos, page, pageSize]);

  // Unified Column Definitions
  const columns: ColumnDef<PromoCode>[] = [
    {
      id: "code",
      header: "Promo Code",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold text-xs text-foreground tracking-wider">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      id: "discount",
      header: "Discount",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
          {row.discountPercent}% OFF
        </span>
      ),
    },
    {
      id: "usage",
      header: "Redemption Usage",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-muted-foreground">
          {row.usedCount} / {row.maxUses ? `${row.maxUses} max` : "Unlimited"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
        const effectiveStatus = !row.isActive ? "cancelled" : isExpired ? "pending" : "completed";
        const label = !row.isActive ? "Inactive" : isExpired ? "Expired" : "Active";

        return (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                row.isActive && !isExpired
                  ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                  : "text-muted-foreground bg-muted border-border"
              )}
            >
              {label}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleToggle(e, row)}
              className="h-6 px-1 text-muted-foreground hover:text-foreground"
              title="Toggle Status"
            >
              {row.isActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
            </Button>
          </div>
        );
      },
    },
    {
      id: "expiresAt",
      header: "Expiration Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.expiresAt
            ? new Date(row.expiresAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
            : "Never (Perpetual)"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => openEdit(row)}
            title="Edit Promo"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={(e) => handleDelete(e, row)}
            title="Delete Promo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Promotions & Discount Codes"
        description="Configure customer acquisition coupons, seasonal campaign vouchers, and track redemption limits."
        data={paginatedPromos}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(row) => openEdit(row)}
        isLoading={loading}
        error={error}
        onRetry={fetchPromos}
        primaryAction={{
          label: "New Promo Code",
          icon: <Plus className="w-4 h-4" />,
          onClick: openAdd,
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search promo codes by voucher name..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filteredPromos.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No promotion codes found",
          description: search
            ? "No promo codes match your search query."
            : "No active discount codes created yet. Click 'New Promo Code' to create one.",
        }}
      />

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
