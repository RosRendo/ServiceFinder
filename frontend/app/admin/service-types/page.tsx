"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, Tag, Layers } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

interface ServiceType {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: { id: string; name: string };
  icon?: string;
  status: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
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

  const openModal = (type: ServiceType | null) => {
    setEditing(type);
    setFormData(
      type
        ? {
            name: type.name,
            slug: type.slug,
            description: type.description || "",
            categoryId: type.categoryId.toString(),
            icon: type.icon || "",
            status: type.status || "active"
          }
        : { name: "", slug: "", description: "", categoryId: "", icon: "", status: "active" }
    );
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.categoryId) {
      toast({ title: "Error", description: "Name and Category are required", variant: "destructive" });
      return;
    }

    setLoading(true);
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
      setShowModal(false);
      fetchServiceTypes();
    } catch (e: any) {
      toast({ title: "Error", description: e.response?.data?.message || "Failed to save service type", variant: "destructive" });
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-col h-full overflow-hidden relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Service Types</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage service sub-categories for companies</p>
        </div>
        <Button onClick={() => openModal(null)} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Service Type
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60"
            placeholder="Search service types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium ml-auto">{filtered.length} items</div>
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
            <p className="text-sm font-medium text-muted-foreground mb-3">No service types found</p>
            <Button onClick={() => openModal(null)} variant="outline" size="sm">Add Service Type</Button>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5 text-left">Service Type</th>
                  <th className="px-6 py-3.5 text-left">Category</th>
                  <th className="px-6 py-3.5 text-left">Slug</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((type) => (
                  <tr key={type.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{type.icon || "✨"}</span>
                        <div>
                          <div className="font-semibold text-foreground">{type.name}</div>
                          {type.description && <div className="text-xs text-muted-foreground truncate max-w-[250px]">{type.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Layers className="w-3.5 h-3.5 opacity-70" />
                        {type.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{type.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${type.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {type.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" onClick={() => openModal(type)} className="h-8 text-xs font-semibold text-violet-600 hover:text-violet-700 border-violet-100 hover:border-violet-200">
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(type.id)} className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 border-rose-100 hover:border-rose-200">
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service Type" : "Add Service Type"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update details for this service sub-category." : "Create a new service sub-category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-rose-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((p) => ({ ...p, name: v, slug: editing ? p.slug : slugify(v) }));
                }}
                placeholder="e.g. Deep Cleaning"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug <span className="text-rose-500">*</span></Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))}
                  placeholder="deep-cleaning"
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                  placeholder="🧹"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parent Category <span className="text-rose-500">*</span></Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData((p) => ({ ...p, categoryId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Parent Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe this service type..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="font-bold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Service Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
