"use client";

import { useState, useEffect } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { CategoryDrawer, CategoryFormData } from "@/components/drawers/CategoryDrawer";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { toast } from "sonner";
import api from "@/lib/api/client";

interface CategoryRow {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  useImageAsBadge?: boolean;
  status: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<CategoryRow | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      const payload = res.data?.data || res.data;
      setCategories(Array.isArray(payload) ? payload : payload.data || []);
    } catch {
      toast.error("Failed to load category taxonomy.");
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

  const openEdit = (c: CategoryRow) => {
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
      toast.error("Category name is required.");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast.success("Category updated successfully.");
      } else {
        await api.post("/categories", formData);
        toast.success("Category created successfully.");
      }
      setDrawerOpen(false);
      fetchCategories();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (c: CategoryRow) => {
    setDeleteTargetCategory(c);
  };

  const confirmDelete = async () => {
    if (!deleteTargetCategory) return;
    try {
      await api.delete(`/categories/${deleteTargetCategory.id}`);
      toast.success("Category deleted.");
      fetchCategories();
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setDeleteTargetCategory(null);
    }
  };

  const columns: ColumnDef<CategoryRow>[] = [
    {
      id: "name",
      header: "Category",
      sortable: true,
      accessorFn: (c) => c.name,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center text-sm shrink-0 overflow-hidden">
            {c.imageUrl ? (
              <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <span>{c.icon || "📁"}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{c.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{c.slug}</span>
          </div>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorFn: (c) => c.description || "—",
      cell: (c) => (
        <span className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
          {c.description || "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessorFn: (c) => c.status,
      cell: (c) => (
        <StatusPill status={c.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => openEdit(c)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => handleDelete(c)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Top-level taxonomy defining consumer discovery categories across web and mobile apps
          </p>
        </div>
        <div>
          <Button
            onClick={openAdd}
            size="sm"
            className="h-8 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Category
          </Button>
        </div>
      </div>

      {/* DataGrid */}
      <ManagementDataGrid
        data={filtered}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter categories by name or slug..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={15}
        totalItems={filtered.length}
        onPageChange={setPage}
        onRowClick={(row) => openEdit(row)}
        emptyState={{
          title: "No categories found",
          description: "No categories match the active filter or search criteria.",
        }}
      />

      {/* Slideout Category Form Drawer */}
      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        category={editingCategory}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        loading={saving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTargetCategory}
        onClose={() => setDeleteTargetCategory(null)}
        title={deleteTargetCategory ? `Delete Category "${deleteTargetCategory.name}"` : "Delete Category"}
        description="Are you sure you want to delete this category? Linked services and catalog listings may be affected."
        actionType="danger"
        confirmLabel="Delete Category"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
