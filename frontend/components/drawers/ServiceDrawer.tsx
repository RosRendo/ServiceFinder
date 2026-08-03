"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Briefcase, Tag, CheckCircle2, XCircle, FileText, Settings2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditServiceModal } from "../company/EditServiceModal";

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
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!service) return null;

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
                service.isActive ? "text-emerald-500 bg-emerald-500/10" : "text-slate-500 bg-slate-500/10"
              )}>
                {service.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-2xl font-black text-foreground">
              ${Number(service.basePrice).toFixed(2)}
            </div>
            {service.discountPrice && (
              <div className="text-xs text-rose-500 line-through">
                Discount: ${Number(service.discountPrice).toFixed(2)}
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
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <button onClick={onClose} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
             <BarChart3 className="w-4 h-4" /> View Analytics
          </button>
          
          <button onClick={() => setEditModalOpen(true)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
            <Settings2 className="w-4 h-4" /> Edit Details
          </button>
          
          {service.isActive ? (
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-slate-500/10 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20 transition-colors">
              <XCircle className="w-4 h-4" /> Deactivate
            </button>
          ) : (
            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Activate
            </button>
          )}
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
