"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Tag, Layers } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function slugify(t: string) { return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-"); }

interface ServiceType { id: string; name: string; slug: string; description: string; categoryId: string; category?: { id: string; name: string }; icon?: string; status: string; }
interface Category { id: string; name: string; }

export default function AdminServiceTypesPage() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", categoryId: "", icon: "", status: "active" });

  useEffect(() => { fetchServiceTypes(); fetchCategories(); }, []);

  const fetchServiceTypes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/service-types`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setServiceTypes(data.data?.data || data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      const data = await res.json();
      if (res.ok) {
        const cats = data.data?.data || data.data || data.categories || [];
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch {}
  };

  const openModal = (type: ServiceType | null) => {
    setEditing(type);
    setFormData(type ? { name: type.name, slug: type.slug, description: type.description || "", categoryId: type.categoryId, icon: type.icon || "", status: type.status } : { name: "", slug: "", description: "", categoryId: "", icon: "", status: "active" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editing ? `${process.env.NEXT_PUBLIC_API_URL}/api/service-types/${editing.id}` : `${process.env.NEXT_PUBLIC_API_URL}/api/service-types`;
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(formData) });
      if (res.ok) { toast.success(editing ? "Updated" : "Created"); setShowModal(false); fetchServiceTypes(); }
      else { const e = await res.json(); toast.error(e.message || "Failed"); }
    } catch { toast.error("Error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service type?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/service-types/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { toast.success("Deleted"); fetchServiceTypes(); } else toast.error("Failed to delete");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Service Types</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage service sub-categories for companies</p>
        </div>
        <button onClick={() => openModal(null)} className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors">
          <Plus className="w-4 h-4" /> Add Service Type
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : serviceTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Tag className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-3">No service types yet</p>
            <button onClick={() => openModal(null)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">Add Service Type</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Service Type</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Slug</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {serviceTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => openModal(type)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{type.icon || "✨"}</span>
                        <div>
                          <div className="font-medium text-gray-900">{type.name}</div>
                          {type.description && <div className="text-xs text-gray-400 truncate max-w-[200px]">{type.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />{type.category?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{type.slug}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${type.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{type.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(type)} className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md flex items-center gap-1 transition-colors"><Edit2 className="w-3 h-3" /> Edit</button>
                        <button onClick={() => handleDelete(type.id)} className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-md transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-gray-900">{editing ? "Edit Service Type" : "Add Service Type"}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">{editing ? "Update this service type." : "Create a new service type."}</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSave}>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: "Name *", key: "name", placeholder: "e.g. Deep Cleaning", required: true },
                { label: "Slug *", key: "slug", placeholder: "deep-cleaning", mono: true, required: true },
                { label: "Icon (Emoji)", key: "icon", placeholder: "🧹" },
              ].map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                  <input required={f.required} value={(formData as any)[f.key]}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (f.key === "name") setFormData((p) => ({ ...p, name: v, slug: editing ? p.slug : slugify(v) }));
                      else setFormData((p) => ({ ...p, [f.key]: f.key === "slug" ? slugify(v) : v }));
                    }}
                    placeholder={f.placeholder}
                    className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors ${f.mono ? "font-mono" : ""}`}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Status</label>
                <select value={formData.status} onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Describe this service type..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-colors" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">{editing ? "Save Changes" : "Create"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
