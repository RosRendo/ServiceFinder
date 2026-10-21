"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Tag, Type, Link, FileText, Loader2, Layers, ShieldAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface ServiceTypeFormData {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  icon: string;
  status: string;
}

interface ServiceTypeDrawerProps {
  open: boolean;
  onClose: () => void;
  serviceType: any | null; // if null, it's "Add" mode, otherwise "Edit" mode
  formData: ServiceTypeFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceTypeFormData>>;
  categories: any[];
  onSave: () => void;
  loading: boolean;
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function ServiceTypeDrawer({ open, onClose, serviceType, formData, setFormData, categories, onSave, loading }: ServiceTypeDrawerProps) {
  const isEditing = !!serviceType;
  const inputCls = "h-9 bg-background border-border text-xs rounded-xl text-foreground";
  const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-wider";

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Service Type" : "Add Service Type"}
      subtitle={isEditing ? "Update this service sub-category." : "Create a new sub-category companies can offer."}
      headerIcon={Tag}
      width="md"
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <Button variant="outline" type="button" onClick={onClose} disabled={loading} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={loading || !formData.name.trim() || !formData.categoryId}
            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 rounded-xl"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Service Type"}
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 text-xs font-sans">
        <div className="space-y-1">
          <Label htmlFor="name" className={labelCls}>
            Name <span className="text-rose-500">*</span>
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
              placeholder="e.g. Deep Cleaning"
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
                placeholder="deep-cleaning"
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className={cn(labelCls, "flex items-center gap-1.5")}>
              <Layers className="w-3.5 h-3.5" /> Parent Category <span className="text-rose-500">*</span>
            </Label>
            <Select value={formData.categoryId} onValueChange={(v) => setFormData((p) => ({ ...p, categoryId: v }))}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id?.toString()} value={c.id?.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className={cn(labelCls, "flex items-center gap-1.5")}>
              <ShieldAlert className="w-3.5 h-3.5" /> Status
            </Label>
            <Select value={formData.status} onValueChange={(v) => setFormData((p) => ({ ...p, status: v }))}>
              <SelectTrigger className={inputCls}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              placeholder="Describe this service type..."
              rows={3}
              className="pl-9 pt-2.5 bg-background border-border text-xs rounded-xl resize-none text-foreground"
            />
          </div>
        </div>
      </div>
    </BaseDrawer>
  );
}

export default ServiceTypeDrawer;
