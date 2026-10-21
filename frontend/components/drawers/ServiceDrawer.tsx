"use client";

import { BaseDrawer } from "./BaseDrawer";
import { Briefcase, CheckCircle2, XCircle, Settings2, BarChart3, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditServiceModal } from "../company/EditServiceModal";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  onDelete?: (service: ServiceRow) => void;
}

const LABEL = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground";

export function ServiceDrawer({ open, onClose, service, onSuccess, onDelete }: ServiceDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!service) return null;

  const base = Number(service.basePrice || 0);
  const discount = service.discountPrice ? Number(service.discountPrice) : null;
  const hasDiscount = discount !== null && discount > 0 && discount < base;
  const savingsPct = hasDiscount ? Math.round(((base - discount!) / base) * 100) : 0;

  const handleToggleStatus = async () => {
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
    <BaseDrawer
      open={open}
      onClose={onClose}
      title={service.name}
      subtitle={service.serviceType?.name || "Standard Category"}
      headerIcon={Briefcase}
      width="md"
      badge={
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
          service.isActive
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
            : "bg-muted border-border text-muted-foreground"
        )}>
          {service.isActive ? "Active" : "Inactive"}
        </span>
      }
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            router.push(`/company/analytics?service=${service.id}`);
            onClose();
          }}
          className="h-8 text-[11px] rounded-xl"
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics ↗
        </Button>
      }
      footer={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={toggling}
            className={cn(
              "h-9 text-xs rounded-xl",
              service.isActive
                ? "border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500"
            )}
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : service.isActive ? (
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            {service.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button onClick={() => setEditModalOpen(true)} className="flex-1 h-9 text-xs rounded-xl font-bold">
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Edit Service
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(service)}
              className="h-9 px-3 text-xs rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
              title="Delete Service"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      }
    >
      <div className="p-6 space-y-4 font-sans text-xs">
        {/* Hero: image + pricing */}
        <div className="bg-card border border-border rounded-2xl p-4 flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {service.image ? (
              <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-8 h-8 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className={LABEL}>Price</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-foreground">
                ${(hasDiscount ? discount! : base).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-muted-foreground line-through">${base.toFixed(2)}</span>
              )}
            </div>
            {hasDiscount && (
              <span className="mt-1 self-start text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {savingsPct}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className={cn(LABEL, "mb-2")}>Description</p>
          <p className="text-xs text-foreground leading-relaxed">
            {service.description || "No description provided for this service."}
          </p>
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
