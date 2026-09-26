"use client";

import { useState, useEffect } from "react";
import { Briefcase, Plus, Edit2, Tag } from "lucide-react";
import { useAPI } from "@/lib/hooks/useAPI";
import api from "@/lib/api/client";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { useToast } from "@/lib/hooks/use-toast";
import { ServiceDrawer, ServiceRow } from "@/components/drawers/ServiceDrawer";
import { EditServiceModal } from "@/components/company/EditServiceModal";

export default function CompanyServicesPage() {
  const { toast } = useToast();
  const { data, loading, refetch } = useAPI<any>("/api/companies/my-company/services");
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeService, setActiveService] = useState<ServiceRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceRow | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setServices(data);
    } else if (data?.data) {
      setServices(data.data);
    }
  }, [data]);

  const handleToggleActive = async (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/companies/my-company/services/${s.id}`, {
        isActive: !s.isActive,
      });
      toast({ title: "Updated", description: `Service ${!s.isActive ? "activated" : "deactivated"}` });
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to update service status", variant: "destructive" });
    }
  };

  const filteredServices = services.filter((s) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const name = (s.name || "").toLowerCase();
    const cat = (s.serviceType?.name || "").toLowerCase();
    return name.includes(query) || cat.includes(query);
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Service",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center shrink-0 overflow-hidden">
            {row.image ? (
              <img src={row.image} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-xs text-foreground dark:text-foreground">{row.name}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{row.description || "Standard service offering"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      isSortable: true,
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground dark:text-muted-foreground/70 bg-muted dark:bg-muted px-2 py-0.5 rounded-md border border-border dark:border-border">
          <Tag className="w-3 h-3 text-muted-foreground/70" />
          <span>{row.serviceType?.name || "General"}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: "Base Price",
      align: "right",
      isSortable: true,
      cell: ({ row }) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-foreground dark:text-foreground">${Number(row.basePrice || 0).toFixed(2)}</span>
          {row.discountPrice && (
            <span className="text-[11px] text-rose-500 line-through ml-1.5 font-medium">
              ${Number(row.discountPrice).toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => (
        <button
          onClick={(e) => handleToggleActive(row, e)}
          className="cursor-pointer hover:opacity-80 transition"
          title="Click to toggle status"
        >
          <StatusPill status={row.isActive ? "active" : "inactive"} />
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditService(row);
              setEditModalOpen(true);
            }}
            className="p-1 rounded text-muted-foreground/70 hover:text-foreground/90 dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ManagementDataGrid
        title="Service Catalog"
        description="Configure your active service offerings, hourly pricing, and promotional discounts."
        primaryAction={{
          label: "Add New Service",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => {
            setEditService(null);
            setEditModalOpen(true);
          },
        }}
        data={filteredServices}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        onRowClick={(r) => {
          setActiveService(r);
          setDrawerOpen(true);
        }}
        searchPlaceholder="Search service name or category..."
        onSearchChange={setSearch}
        totalCount={filteredServices.length}
        pageSize={20}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No services created",
          description: "Define your company's home service offerings to start receiving customer bookings.",
          actionLabel: "Add First Service",
          onActionClick: () => {
            setEditService(null);
            setEditModalOpen(true);
          },
        }}
      />

      {/* Service Detail Drawer */}
      <ServiceDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        service={activeService}
        onSuccess={() => refetch()}
      />

      {/* Edit / Create Modal */}
      {editModalOpen && (
        <EditServiceModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          service={editService}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
