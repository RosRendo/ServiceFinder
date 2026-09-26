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
  imageUrl: string;
  useImageAsBadge: boolean;
  status: string;
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
    <div className="border-b border-border px-8 py-5">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">{title}</p>
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
            className="flex-1 bg-background hover:bg-muted border border-border text-foreground h-11 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl font-bold flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm gap-2"
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
              <Label htmlFor="name" className="text-xs font-bold text-foreground">Category Name <span className="text-rose-500">*</span></Label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => {
                    const v = e.target.value;
                    setFormData((p) => ({ ...p, name: v, slug: isEditing ? p.slug : slugify(v) }));
                  }}
                  placeholder="e.g. Cleaning Services" 
                  className="pl-10 h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-bold text-foreground">URL Slug <span className="text-rose-500">*</span></Label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="slug" 
                    value={formData.slug} 
                    onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))} 
                    placeholder="cleaning-services" 
                    className="pl-10 h-11 font-mono text-xs bg-muted/20 border-border focus:border-primary focus:ring-primary/20 rounded-xl" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-xs font-bold text-foreground">Icon (Emoji)</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-muted-foreground text-sm">
                    {formData.icon || "✨"}
                  </div>
                  <Input 
                    id="icon" 
                    value={formData.icon} 
                    onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))} 
                    placeholder="🧹" 
                    className="pl-10 h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs font-bold text-foreground">Category Image URL</Label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="imageUrl" 
                  value={formData.imageUrl || ""} 
                  onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))} 
                  placeholder="https://images.unsplash.com/photo-..." 
                  className="pl-10 h-11 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl mt-4">
              <div>
                <Label htmlFor="status" className="text-xs font-bold text-foreground block">Active Status</Label>
                <span className="text-[10px] text-muted-foreground font-medium">Toggle whether this category is visible to customers.</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, status: p.status === "active" ? "inactive" : "active" }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.status === "active" ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.status === "active" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border rounded-xl mt-4">
              <div>
                <Label htmlFor="useImageAsBadge" className="text-xs font-bold text-foreground block">Render Category as Image</Label>
                <span className="text-[10px] text-muted-foreground font-medium">Show the category cover image instead of the vector icon/emoji throughout the app.</span>
              </div>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, useImageAsBadge: !p.useImageAsBadge }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formData.useImageAsBadge ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formData.useImageAsBadge ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Section>

        <Section title="Additional Information">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-foreground">Description</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} 
                placeholder="Describe this category..." 
                rows={4} 
                className="pl-10 pt-2.5 bg-muted/20 border-border focus:border-primary focus:ring-primary/20 font-medium rounded-xl resize-none"
              />
            </div>
          </div>
        </Section>
      </div>
    </BaseDrawer>
  );
}
