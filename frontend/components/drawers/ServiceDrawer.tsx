"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Briefcase, CheckCircle2, XCircle, Settings2, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditServiceModal } from "../company/EditServiceModal";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

export interface ServiceRow {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  discountPrice?: number;
  isActive: boolean;
  image?: string;
  serviceType?: { name: string };
}

interface ServiceDrawerProps {
  open: boolean;
  onClose: () => void;
  service: ServiceRow | null;
  onSuccess?: () => void;
}

export function ServiceDrawer({ open, onClose, service, onSuccess }: ServiceDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!service) return null;

  const handleToggleStatus = async () => {
    if (!service) return;
    setToggling(true);
    try {
      await api.put(`/companies/my-company/services/${service.id}`, {
        name: service.name,
        description: service.description,
        basePrice: Number(service.basePrice),
        discountPrice: service.discountPrice ? Number(service.discountPrice) : null,
        isActive: !service.isActive,
      });
      toast({
        title: service.isActive ? "Service Deactivated" : "Service Activated",
        description: `${service.name} is now ${service.isActive ? "inactive" : "active and bookable"}.`,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update service status",
        variant: "destructive",
      });
    } finally {
      setToggling(false);
    }
  };

  return (
    <BaseDrawer open={open} onClose={onClose} title={service.name} subtitle={service.serviceType?.name || "Standard Category"}>
      <div className="p-6 space-y-6">
        
        {/* Header Block */}
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {service.image ? (
              <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                service.isActive ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground bg-muted"
              )}>
                {service.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              ${Number(service.basePrice || 0).toFixed(2)}
            </div>
            {service.discountPrice && (
              <div className="text-xs text-rose-500 line-through">
                Discount: ${Number(service.discountPrice || 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Description</p>
          <p className="text-sm text-foreground leading-relaxed">
            {service.description || "No description provided for this service."}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-border">
          <button 
            onClick={() => {
              router.push(`/company/analytics?service=${service.id}`);
              onClose();
            }} 
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
             <BarChart3 className="w-4 h-4" /> View Analytics
          </button>
          
          <button 
            onClick={() => setEditModalOpen(true)} 
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold bg-muted/60 text-foreground border border-border hover:bg-muted transition-colors"
          >
            <Settings2 className="w-4 h-4" /> Edit Details
          </button>
          
          <button 
            onClick={handleToggleStatus}
            disabled={toggling}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50",
              service.isActive 
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20" 
                : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
            )}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : service.isActive ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {service.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
      
      <EditServiceModal 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        service={service} 
        onSuccess={onSuccess} 
      />
    </BaseDrawer>
  );
}
