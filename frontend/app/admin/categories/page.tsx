"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2, Layers } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({ 
    name: "", 
    slug: "", 
    description: "", 
    icon: "" 
  });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
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
    setFormData({ name: "", slug: "", description: "", icon: "" }); 
    setDialogOpen(true); 
  };

  const openEdit = (c: any) => { 
    setEditingCategory(c); 
    setFormData({ 
      name: c.name || "", 
      slug: c.slug || "", 
      description: c.description || "", 
      icon: c.icon || "" 
    }); 
    setDialogOpen(true); 
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { 
      toast({ title: "Error", description: "Name is required", variant: "destructive" }); 
      return; 
    }
    
    setLoading(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, formData);
        toast({ title: "Success", description: "Category updated successfully" });
      } else {
        await api.post("/categories", formData);
        toast({ title: "Success", description: "Category created successfully" });
      }
      setDialogOpen(false); 
      fetchCategories();
    } catch (e: any) { 
      toast({ title: "Error", description: e.response?.data?.message || "Failed to save category", variant: "destructive" }); 
    } finally {
      setLoading(false);
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

  return (
    <div className="flex flex-col h-full overflow-hidden relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage top-level service categories</p>
        </div>
        <Button onClick={openAdd} className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add Category
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" 
            placeholder="Search categories..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium ml-auto">{filtered.length} categories</div>
      </div>

      {/* Table Content */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Layers className="w-10 h-10 text-muted/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-3">No categories found</p>
            <Button onClick={openAdd} variant="outline" size="sm">Add Category</Button>
          </div>
        ) : (
          <div className="overflow-auto h-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3.5 text-left w-20">Icon</th>
                  <th className="px-6 py-3.5 text-left">Name</th>
                  <th className="px-6 py-3.5 text-left">Slug</th>
                  <th className="px-6 py-3.5 text-left">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4 text-xl">{cat.icon || "📁"}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{cat.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{cat.slug}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">{cat.description || "—"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" onClick={() => openEdit(cat)} className="h-8 text-xs font-semibold text-violet-600 hover:text-violet-700 border-violet-100 hover:border-violet-200">
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(cat)} className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 border-rose-100 hover:border-rose-200">
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update details for this service category." : "Create a new top-level service category."}
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
                  setFormData((p) => ({ ...p, name: v, slug: editingCategory ? p.slug : slugify(v) }));
                }}
                placeholder="e.g. Cleaning Services" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug <span className="text-rose-500">*</span></Label>
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))} 
                  placeholder="cleaning-services" 
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
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} 
                placeholder="Describe this category..." 
                rows={3} 
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="font-bold">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

