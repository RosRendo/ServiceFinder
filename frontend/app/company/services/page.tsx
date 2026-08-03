"use client";
import { useState, useEffect } from "react";
import { Briefcase, Loader2, Plus, Edit2, Tag } from "lucide-react";
import { useAPI } from "@/lib/hooks/useAPI";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import { ServiceDrawer, ServiceRow } from "@/components/drawers/ServiceDrawer";
import { EditServiceModal } from "@/components/company/EditServiceModal";

export default function CompanyServicesPage() {
  const { toast } = useToast();
  const { data, loading } = useAPI<any>('/api/companies/my-company/services');
  const [services, setServices] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<ServiceRow | null>(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceRow | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setServices(data);
    } else if (data?.data) {
      setServices(data.data);
    }
  }, [data]);

  const columns: Column<any>[] = [
    { 
      key: "name", 
      header: "Service", 
      sortable: true, 
      render: (s) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {s.image ? (
              <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-4 h-4 text-primary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{s.name}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-1">{s.description || "No description provided"}</p>
          </div>
        </div>
      ) 
    },
    { 
      key: "serviceType", 
      header: "Category", 
      render: (s) => (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-md border border-border">
          <Tag className="w-3 h-3" />
          {s.serviceType?.name || "Standard"}
        </div>
      )
    },
    { 
      key: "basePrice", 
      header: "Price", 
      sortable: true, 
      render: (s) => (
        <div>
          <span className="font-bold text-foreground">${Number(s.basePrice).toFixed(2)}</span>
          {s.discountPrice && (
            <span className="text-xs text-rose-500 line-through ml-2">${Number(s.discountPrice).toFixed(2)}</span>
          )}
        </div>
      ) 
    },
    { 
      key: "isActive", 
      header: "Status", 
      render: (s) => (
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
          s.isActive ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground bg-muted/500/10"
        )}>
          {s.isActive ? "Active" : "Inactive"}
        </span>
      ) 
    },
    {
      key: "actions",
      header: "",
      render: (s) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              setEditService(s);
              setEditModalOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Services</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">Manage the services you offer and their pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-full px-6 shadow-lg shadow-primary/20"
            onClick={() => {
              setEditService(null);
              setEditModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Service
          </Button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-6 relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataGrid 
            columns={columns} 
            data={services} 
            onRowClick={(row) => { setActive(row); setDrawerOpen(true); }}
            emptyMessage="You haven't added any services yet." 
          />
        )}
      </div>

      <ServiceDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        service={active} 
        onSuccess={() => window.location.reload()}
      />

      <EditServiceModal 
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        service={editService}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}

