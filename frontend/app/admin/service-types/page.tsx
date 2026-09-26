"use client";

import { useState, useEffect } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { ServiceTypeDrawer, ServiceTypeFormData } from "@/components/drawers/ServiceTypeDrawer";
import { Plus, Edit2, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { toast } from "sonner";
import api from "@/lib/api/client";

interface ServiceTypeRow {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  categoryId: string | number;
  icon?: string;
  status: string;
  category?: { id: string | number; name: string };
}

export default function AdminServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeRow[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTypeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeRow | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
      const payload = res.data?.data || res.data;
      setServiceTypes(Array.isArray(payload) ? payload : payload.data || []);
    } catch {
      toast.error("Failed to load service types catalog.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const payload = res.data?.data || res.data;
      setCategories(Array.isArray(payload) ? payload : payload.data || []);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
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

  const openEdit = (type: ServiceTypeRow) => {
    setEditing(type);
    setFormData({
      name: type.name,
      slug: type.slug,
      description: type.description || "",
      categoryId: String(type.categoryId),
      icon: type.icon || "",
      status: type.status || "active"
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error("Name and parent category are required.");
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
        toast.success("Service type updated successfully.");
      } else {
        await api.post("/service-types", payload);
        toast.success("Service type created successfully.");
      }
      setDrawerOpen(false);
      fetchServiceTypes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to save service type.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ServiceTypeRow) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/service-types/${deleteTarget.id}`);
      toast.success("Service type deleted.");
      fetchServiceTypes();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to delete service type.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns: ColumnDef<ServiceTypeRow>[] = [
    {
      id: "name",
      header: "Service Type",
      sortable: true,
      accessorFn: (r) => r.name,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{r.name}</span>
          {r.description ? (
            <span className="text-xs text-muted-foreground line-clamp-1">{r.description}</span>
          ) : null}
        </div>
      ),
    },
    {
      id: "slug",
      header: "URL Slug",
      accessorFn: (r) => r.slug,
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.slug}
        </span>
      ),
    },
    {
      id: "category",
      header: "Parent Category",
      sortable: true,
      accessorFn: (r) => r.category?.name || "Uncategorized",
      cell: (r) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
          {r.category?.name || "Unassigned"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessorFn: (r) => r.status,
      cell: (r) => (
        <StatusPill status={r.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => openEdit(r)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            onClick={() => handleDelete(r)}
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Service Types</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global service type definitions categorizing company offerings across the marketplace
          </p>
        </div>
        <div>
          <Button
            onClick={openAdd}
            size="sm"
            className="h-8 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Service Type
          </Button>
        </div>
      </div>

      {/* DataGrid */}
      <ManagementDataGrid
        data={filtered}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter service types by name, slug, or category..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={15}
        totalItems={filtered.length}
        onPageChange={setPage}
        onRowClick={(row) => openEdit(row)}
        emptyState={{
          title: "No service types found",
          description: "No service type definitions match the current search query.",
        }}
      />

      {/* Slideout Form Drawer */}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? `Delete Service Type "${deleteTarget.name}"` : "Delete Service Type"}
        description="Permanently delete this service type? Existing services mapped to this type may be affected."
        actionType="danger"
        confirmLabel="Permanently Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
