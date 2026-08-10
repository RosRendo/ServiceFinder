"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, Layers } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { CategoryDrawer, CategoryFormData } from "@/components/drawers/CategoryDrawer";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CategoryFormData>({ 
    name: "", 
    slug: "", 
    description: "", 
    icon: "",
    imageUrl: "",
    useImageAsBadge: false,
    status: "active"
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories?all=true");
      const payload = res.data.data || res.data;
      setCategories(Array.isArray(payload) ? payload : payload.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCategories(); 
  }, []);

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { 
    setEditingCategory(null); 
    setFormData({ name: "", slug: "", description: "", icon: "", imageUrl: "", useImageAsBadge: false, status: "active" }); 
    setDrawerOpen(true); 
  };

  const openEdit = (c: any) => { 
    setEditingCategory(c); 
    setFormData({ 
      name: c.name || "", 
      slug: c.slug || "", 
      description: c.description || "", 
      icon: c.icon || "",
      imageUrl: c.imageUrl || "",
      useImageAsBadge: !!c.useImageAsBadge,
      status: c.status || "active"
    }); 
    setDrawerOpen(true); 
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { 
      toast({ title: "Error", description: "Name is required", variant: "destructive" }); 
      return; 
    }
    
    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        await api.post("/categories", formData);
        toast({ title: "Success", description: "Category created successfully" });
      }
      setDrawerOpen(false); 
      fetchCategories();
    } catch (e: any) { 
      toast({ title: "Error", description: e.response?.data?.message || "Failed to save category", variant: "destructive" }); 
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try { 
      await api.delete(`/categories/${c.id}`); 
      toast({ title: "Success", description: "Category deleted successfully" }); 
      fetchCategories(); 
    } catch { 
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" }); 
    }
  };

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  }, [filtered]);

  const columns: Column<any>[] = [
    {
      key: "name", header: "Category", sortable: true,
      render: (c) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl shrink-0 border border-violet-500/20 overflow-hidden">
            {c.imageUrl ? (
              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{c.icon || "📁"}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-foreground text-sm">{c.name}</div>
            <div className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{c.slug}</div>
          </div>
        </div>
      )
    },
    {
      key: "description", header: "Description",
      render: (c) => (
        <span className="text-sm font-medium text-muted-foreground max-w-xs truncate block">
          {c.description || "—"}
        </span>
      )
    },
    {
      key: "status", header: "Status", sortable: true,
      render: (c) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          c.status === "active" 
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
            : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
          {c.status === "active" ? "Active" : "Inactive"}
        </span>
      )
    },
    {
      key: "actions", header: "Actions",
      render: (c) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => openEdit(c)} 
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-violet-600 hover:border-violet-500/30 hover:bg-violet-500/5 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(c)} 
            className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} categor${selectedIds.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => api.delete(`/categories/${id}`)));
      toast({ title: "Deleted", description: `${selectedIds.size} categor${selectedIds.size === 1 ? 'y' : 'ies'} deleted.` });
      setSelectedIds(new Set());
      fetchCategories();
    } catch {
      toast({ title: "Error", description: "Failed to delete one or more categories.", variant: "destructive" });
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
            value={search} onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
          />
        </div>
        <div className="flex-1" />
        <button 
          onClick={openAdd} 
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Category
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Categories", value: filtered.length, color: "text-foreground" },
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
          onRowClick={(cat) => openEdit(cat)}
          emptyIcon={Layers}
          emptyMessage="No categories found matching your search."
        />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={editingCategory}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        loading={saving}
      />
    </div>
  );
}
