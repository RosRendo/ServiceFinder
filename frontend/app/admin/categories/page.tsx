"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, Layers, Tag } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", icon: "" });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories");
      setCategories(res.data?.data?.data || res.data?.data || res.data || []);
    } catch { toast.error("Failed to load categories"); }
    finally { setLoading(false); }
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingCategory(null); setFormData({ name: "", slug: "", description: "", icon: "" }); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditingCategory(c); setFormData({ name: c.name || "", slug: c.slug || "", description: c.description || "", icon: c.icon || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error("Name is required"); return; }
    try {
      if (editingCategory) await api.put(`/service-types/${editingCategory.id}`, formData);
      else await api.post("/service-types", formData);
      toast.success(editingCategory ? "Category updated" : "Category created");
      setDialogOpen(false); fetchCategories();
    } catch (e: any) { toast.error(e.response?.data?.message || "Failed to save"); }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await api.delete(`/service-types/${c.id}`); toast.success("Deleted"); fetchCategories(); }
    catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage top-level service categories</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="text-xs text-gray-400 font-medium ml-auto">{filtered.length} categories</div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-3">No categories yet</p>
            <button onClick={openAdd} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">Add Category</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                <th className="px-5 py-3 text-left">Icon</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Slug</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3.5 text-xl">{cat.icon || "📁"}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{cat.slug}</td>
                  <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate">{cat.description || "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cat.status !== "inactive" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.status || "active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(cat)} className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(cat)} className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-gray-900">{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">{editingCategory ? "Update category details." : "Create a new service category."}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-6 py-5 space-y-4">
            {[
              { label: "Name *", key: "name", placeholder: "e.g. Deep Cleaning" },
              { label: "Slug *", key: "slug", placeholder: "deep-cleaning", mono: true },
              { label: "Icon (Emoji)", key: "icon", placeholder: "🧹" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                <input
                  value={(formData as any)[f.key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (f.key === "name") setFormData((p) => ({ ...p, name: v, slug: editingCategory ? p.slug : slugify(v) }));
                    else setFormData((p) => ({ ...p, [f.key]: f.key === "slug" ? slugify(v) : v }));
                  }}
                  placeholder={f.placeholder}
                  className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors ${f.mono ? "font-mono" : ""}`}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} placeholder="Describe this category..." rows={3}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-colors" />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
              {editingCategory ? "Save Changes" : "Create Category"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
