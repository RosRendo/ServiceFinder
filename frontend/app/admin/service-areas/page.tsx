"use client";

import { useState, useMemo } from "react";
import { MapPin, Plus, Edit2, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { ServiceAreaDrawer, ServiceAreaRecord } from "@/components/drawers/ServiceAreaDrawer";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { id: "all", label: "All Territories" },
  { id: "active", label: "Active Coverage" },
  { id: "pending", label: "Pending Setup" },
  { id: "inactive", label: "Inactive" },
];

export default function AdminServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceAreaRecord[]>([
    { id: "1", name: "Khan Chamkarmon", city: "Phnom Penh", coverageRadiusKm: 12, status: "active", baseDeliveryFee: 3.5, surgeMultiplier: 1.0, notes: "Central district coverage" },
    { id: "2", name: "Khan Daun Penh", city: "Phnom Penh", coverageRadiusKm: 10, status: "active", baseDeliveryFee: 3.0, surgeMultiplier: 1.0, notes: "High contractor density" },
    { id: "3", name: "Khan Tuol Kouk", city: "Phnom Penh", coverageRadiusKm: 14, status: "active", baseDeliveryFee: 3.5, surgeMultiplier: 1.1, notes: "Residential corridor" },
    { id: "4", name: "Siem Reap Central", city: "Siem Reap", coverageRadiusKm: 20, status: "active", baseDeliveryFee: 4.0, surgeMultiplier: 1.0, notes: "Tourism and hospitality zone" },
    { id: "5", name: "Battambang Town", city: "Battambang", coverageRadiusKm: 18, status: "pending", baseDeliveryFee: 4.5, surgeMultiplier: 1.0, notes: "New regional expansion" },
  ]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeArea, setActiveArea] = useState<ServiceAreaRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const handleOpenCreate = () => {
    setActiveArea(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (area: ServiceAreaRecord) => {
    setActiveArea(area);
    setDrawerOpen(true);
  };

  const handleSaveArea = (data: Partial<ServiceAreaRecord>) => {
    setIsSaving(true);
    setTimeout(() => {
      if (activeArea?.id) {
        setAreas(prev => prev.map(a => a.id === activeArea.id ? { ...a, ...data } as ServiceAreaRecord : a));
        toast.success(`Service area "${data.name}" updated successfully.`);
      } else {
        const newArea: ServiceAreaRecord = {
          id: String(Date.now()),
          name: data.name || "New Zone",
          city: data.city || "Phnom Penh",
          coverageRadiusKm: data.coverageRadiusKm || 15,
          status: data.status || "active",
          baseDeliveryFee: data.baseDeliveryFee ?? 3.5,
          surgeMultiplier: data.surgeMultiplier ?? 1.0,
          notes: data.notes || "",
        };
        setAreas(prev => [newArea, ...prev]);
        toast.success(`New service area "${newArea.name}" created.`);
      }
      setIsSaving(false);
      setDrawerOpen(false);
    }, 300);
  };

  const toggleStatus = (id: string | number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    setAreas(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === "active" ? "inactive" : "active";
        toast.success(`Zone ${a.name} is now ${nextStatus}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  const handleDeleteArea = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove territory "${name}"?`)) return;
    setAreas(prev => prev.filter(a => String(a.id) !== id));
    toast.success(`Territory "${name}" deleted.`);
  };

  const filtered = useMemo(() => {
    return areas.filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        (a.city || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.notes || "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [areas, search, statusFilter]);

  const paginatedAreas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: ColumnDef<ServiceAreaRecord>[] = [
    {
      id: "name",
      header: "Territory Name",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-bold text-xs text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      id: "city",
      header: "Municipality",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">{row.city}</span>
      ),
    },
    {
      id: "coverageRadiusKm",
      header: "Coverage Radius",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground/90 font-mono">
          {row.coverageRadiusKm} km
        </span>
      ),
    },
    {
      id: "baseDeliveryFee",
      header: "Base Surcharge",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground font-mono">
          ${Number(row.baseDeliveryFee ?? 3.5).toFixed(2)}
        </span>
      ),
    },
    {
      id: "surgeMultiplier",
      header: "Surge Rate",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="text-xs font-mono font-medium text-foreground/90">
          {Number(row.surgeMultiplier ?? 1.0).toFixed(1)}x
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => (
        <button
          onClick={(e) => toggleStatus(row.id, e)}
          className={cn(
            "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors",
            row.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' :
            row.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20' :
            'bg-muted text-muted-foreground border-border hover:bg-muted/80'
          )}
        >
          {row.status}
        </button>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1 text-muted-foreground" /> Configure
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteArea(String(row.id), row.name)}
            className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            title="Delete Territory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Service Coverage & Territory Management"
        description="Define geographical service boundaries, delivery surcharge tiers, and operational dispatch zones."
        data={paginatedAreas}
        columns={columns}
        getRowId={(r) => String(r.id)}
        onRowClick={(row) => handleOpenEdit(row)}
        primaryAction={{
          label: "Add Operational Zone",
          icon: <Plus className="w-3.5 h-3.5" />,
          onClick: handleOpenCreate,
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search zones, cities, or territory notes..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filtered.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No territories found",
          description: search
            ? "No operational zones match your search query."
            : "No service areas defined in this filter category.",
          actionLabel: "Add Operational Zone",
          onActionClick: handleOpenCreate,
        }}
      />

      {/* Territory Drawer */}
      <ServiceAreaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        area={activeArea}
        onSave={handleSaveArea}
        isSaving={isSaving}
      />
    </div>
  );
}
