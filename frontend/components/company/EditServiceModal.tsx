"use client";

import { useRef, useState, useEffect } from "react";
import { Loader2, Save, Image as ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseDrawer } from "../drawers/BaseDrawer";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";

interface EditServiceModalProps {
    open: boolean;
    onClose: () => void;
    service?: any; 
    onSuccess?: () => void;
}

export function EditServiceModal({ open, onClose, service, onSuccess }: EditServiceModalProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [image, setImage] = useState("");
    const [isActive, setIsActive] = useState(true);
    
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            if (service) {
                setName(service.name || "");
                setDescription(service.description || "");
                setBasePrice(service.basePrice?.toString() || "");
                setDiscountPrice(service.discountPrice?.toString() || "");
                setImage(service.image || "");
                setIsActive(service.isActive ?? true);
            } else {
                setName("");
                setDescription("");
                setBasePrice("");
                setDiscountPrice("");
                setImage("");
                setIsActive(true);
            }
        }
    }, [open, service]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const payload = {
                name,
                description,
                basePrice: Number(basePrice),
                discountPrice: discountPrice ? Number(discountPrice) : null,
                image,
                isActive,
            };

            if (service?.id) {
                await api.put(`/companies/my-company/services/${service.id}`, payload);
                toast({ title: "Service Updated", description: "The service has been updated successfully." });
            } else {
                await api.post(`/companies/my-company/services`, payload);
                toast({ title: "Service Created", description: "The new service has been created." });
            }
            
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to save service", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setImage(res.data.url);
            toast({ title: "Image Uploaded", description: "Your image was successfully uploaded to Cloudinary." });
        } catch (err: any) {
            toast({ title: "Upload Failed", description: err.response?.data?.message || "Failed to upload image", variant: "destructive" });
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <BaseDrawer 
            open={open} 
            onClose={onClose} 
            title={service ? "Edit Service" : "Add Service"}
            subtitle="Manage service details and pricing."
        >
            <div className="flex-1 overflow-y-auto p-6">
                <form id="edit-service-form" onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Name</label>
                        <input 
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Premium House Cleaning"
                            className="w-full h-11 px-3 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Image URL or Upload</label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="url"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full h-11 pl-10 pr-3 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                                />
                            </div>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="h-11 shrink-0" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingImage}
                            >
                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                                {uploadingImage ? "" : "Upload"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe what this service includes..."
                            rows={3}
                            className="w-full p-3 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary outline-none transition-colors resize-none" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Base Price ($)</label>
                            <input 
                                required
                                type="number"
                                step="0.01"
                                min="0"
                                value={basePrice}
                                onChange={(e) => setBasePrice(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-11 px-3 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Discount Price ($)</label>
                            <input 
                                type="number"
                                step="0.01"
                                min="0"
                                value={discountPrice}
                                onChange={(e) => setDiscountPrice(e.target.value)}
                                placeholder="Optional"
                                className="w-full h-11 px-3 bg-muted/50 border border-border rounded-xl text-sm focus:border-primary outline-none transition-colors" 
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="is-active" 
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="is-active" className="text-sm font-medium text-foreground cursor-pointer">
                            Service is active and available for booking
                        </label>
                    </div>
                </form>
            </div>

            <div className="p-4 border-t border-border bg-background flex justify-end gap-3 shrink-0">
                <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
                <Button type="submit" form="edit-service-form" disabled={loading} className="min-w-[100px]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Service</>}
                </Button>
            </div>
        </BaseDrawer>
    );
}
