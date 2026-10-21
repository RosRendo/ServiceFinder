"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Layers, Type, Link, FileText, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

function ToggleRow({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-card border border-border rounded-2xl">
      <div>
        <p className="text-xs font-bold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow transition",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export function CategoryDrawer({ open, onClose, category, formData, setFormData, onSave, loading }: CategoryDrawerProps) {
  const isEditing = !!category;
  const inputCls = "h-9 bg-background border-border text-xs rounded-xl text-foreground";
  const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider";

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Add Category"}
      subtitle={isEditing ? "Update top-level category details." : "Create a new top-level service category."}
      headerIcon={Layers}
      width="md"
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={loading || !formData.name.trim()}
            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 rounded-xl"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 text-xs font-sans">
        <div className="space-y-1">
          <Label htmlFor="name" className={labelCls}>
            Category Name <span className="text-rose-500">*</span>
          </Label>
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
              className={cn(inputCls, "pl-9 font-medium")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="slug" className={labelCls}>
              URL Slug <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="cleaning-services"
                className={cn(inputCls, "pl-9 font-mono")}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="icon" className={labelCls}>Icon (Emoji)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{formData.icon || "✨"}</span>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                placeholder="🧹"
                className={cn(inputCls, "pl-9")}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="imageUrl" className={labelCls}>Cover Image URL</Label>
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="imageUrl"
              value={formData.imageUrl || ""}
              onChange={(e) => setFormData((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://images.unsplash.com/photo-..."
              className={cn(inputCls, "pl-9")}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="description" className={labelCls}>Description</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this category..."
              rows={3}
              className="pl-9 pt-2.5 bg-background border-border text-xs rounded-xl resize-none text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <ToggleRow
            label="Visible to Customers"
            hint="Inactive categories are hidden from search and booking."
            checked={formData.status === "active"}
            onToggle={() => setFormData((p) => ({ ...p, status: p.status === "active" ? "inactive" : "active" }))}
          />
          <ToggleRow
            label="Show Cover Image as Badge"
            hint="Use the cover image instead of the emoji icon across the app."
            checked={formData.useImageAsBadge}
            onToggle={() => setFormData((p) => ({ ...p, useImageAsBadge: !p.useImageAsBadge }))}
          />
        </div>
      </div>
    </BaseDrawer>
  );
}

export default CategoryDrawer;
