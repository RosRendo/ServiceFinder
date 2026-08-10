"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, Tag, Layers } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { ServiceTypeDrawer, ServiceTypeFormData } from "@/components/drawers/ServiceTypeDrawer";
import { StatusBadge } from "@/components/grid/StatusBadge";

export default function AdminServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [formData, setFormData] = useState<ServiceTypeFormData>({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    icon: "",
    status: "active"
  });

  const fetchServiceTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/service-types");
      const payload = res.data.data || res.data;
      setServiceTypes(Array.isArray(payload) ? payload : payload.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load service types", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const payload = res.data.data || res.data;
      setCategories(Array.isArray(payload) ? payload : payload.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchServiceTypes();
    fetchCategories();
  }, []);

  const filtered = serviceTypes.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.slug?.toLowerCase().includes(search.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setFormData({ name: "", slug: "", description: "", categoryId: "", icon: "", status: "active" });
    setDrawerOpen(true);
  };

  const openEdit = (type: any) => {
    setEditing(type);
    setFormData({
      name: type.name,
      slug: type.slug,
      description: type.description || "",
      categoryId: type.categoryId.toString(),
      icon: type.icon || "",
      status: type.status || "active"
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast({ title: "Error", description: "Name and Category are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId
      };
      if (editing) {
        await api.put(`/service-types/${editing.id}`, payload);
        toast({ title: "Success", description: "Service type updated successfully" });
      } else {
        await api.post("/service-types", payload);
        toast({ title: "Success", description: "Service type created successfully" });
      }
      setDrawerOpen(false);
      fetchServiceTypes();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to save service type", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service type?")) return;
    try {
      await api.delete(`/service-types/${id}`);
      toast({ title: "Success", description: "Service type deleted successfully" });
      fetchServiceTypes();
    } catch {
      toast({ title: "Error", description: "Failed to delete service type", variant: "destructive" });
    }
  };

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const columns: Column<any>[] = [
    {
      key: "name", header: "Service Type", sortable: true,
      render: (s) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl shrink-0 border border-violet-500/20">
            {s.icon || "✨"}
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">{s.name}</div>
            <div className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{s.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: "category", header: "Category", sortable: true,
      render: (s) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg inline-flex">
          <Layers className="w-3.5 h-3.5 text-muted-foreground/70" />
          {s.category?.name || "—"}
        </span>
      )
    },
    {
      key: "status", header: "Status",
      render: (s) => <StatusBadge status={s.status || "active"} />
    },
    {
      key: "actions", header: "Actions",
      render: (s) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => openEdit(s)} 
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-violet-600 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(s.id)} 
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} service type(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => api.delete(`/service-types/${id}`)));
      toast({ title: "Deleted", description: `${selectedIds.size} service type(s) deleted.` });
      setSelectedIds(new Set());
      fetchServiceTypes();
    } catch {
      toast({ title: "Error", description: "Failed to delete one or more service types.", variant: "destructive" });
    }
  };

  const bulkActions = [
    { label: "Delete Selected", icon: Trash2, onClick: handleBulkDelete, variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
            placeholder="Search service types..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex-1" />
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Service Type
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Service Types", value: filtered.length, color: "text-foreground" },
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
          onRowClick={(type) => openEdit(type)}
          emptyIcon={Tag}
          emptyMessage="No service types found matching your search."
        />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      {/* Drawer */}
      <ServiceTypeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        serviceType={editing}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        onSave={handleSave}
        loading={saving}
      />
    </div>
  );
}
