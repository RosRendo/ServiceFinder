"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Layers, Type, Link, FileText, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
}

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  category: any | null; // if null, it's "Add" mode, otherwise "Edit" mode
  formData: CategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSave: () => void;
  loading: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-200 px-8 py-5">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
      {children}
    </div>
  );
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function CategoryDrawer({ open, onClose, category, formData, setFormData, onSave, loading }: CategoryDrawerProps) {
  const isEditing = !!category;

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Add Category"}
      subtitle={isEditing ? "Update existing category details" : "Create a new top-level service category"}
      headerIcon={Layers}
      footer={
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 h-12 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-12 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Category"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col">
        <Section title="Basic Details">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-700">Category Name <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((p) => ({ ...p, name: v, slug: isEditing ? p.slug : slugify(v) }));
                  }}
                  placeholder="e.g. Cleaning Services" 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 font-medium rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold text-slate-700">URL Slug <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    id="slug" 
                    value={formData.slug} 
                    onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))} 
                    placeholder="cleaning-services" 
                    className="pl-10 h-11 font-mono text-xs bg-slate-50 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 rounded-xl" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-xs font-bold text-slate-700">Icon (Emoji)</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 text-sm">
                    {formData.icon || "✨"}
                  </div>
                  <Input 
                    id="icon" 
                    value={formData.icon} 
                    onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))} 
                    placeholder="🧹" 
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 font-medium rounded-xl" 
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Additional Information">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-700">Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} 
                placeholder="Describe this category..." 
                rows={4} 
                className="pl-10 pt-2.5 bg-slate-50 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 font-medium rounded-xl resize-none"
              />
            </div>
          </div>
        </Section>
      </div>
    </BaseDrawer>
  );
}
