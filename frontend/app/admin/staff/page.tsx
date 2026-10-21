"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { Search, Download, Star, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { useSocket } from "@/lib/hooks/useSocket";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { id: "all", label: "All Technicians" },
  { id: "online", label: "Online Now" },
  { id: "on_job", label: "Active on Job" },
  { id: "offline", label: "Offline" },
];

const STATUS_DOT: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-muted-foreground/40",
  on_job: "bg-sky-500",
};

export default function StaffPage() {
  const router = useRouter();
  const { socket } = useSocket();

  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const exportCSV = () => {
    const rows = filteredStaff;
    if (!rows.length) {
      toast.error("No technician records available to export.");
      return;
    }
    const header = "ID,Name,Email,Status,Company\n";
    const lines = rows.map((s: any) =>
      `"${s.id}","${s.fullName || ''}","${s.email || ''}","${s.status || ''}","${s.staffMemberships?.[0]?.company?.name || ''}"`
    );
    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_registry_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} technician records.`);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users?role=staff&limit=150');
      const payload = response.data.data || response.data;
      setStaff(payload.users || []);
      setError(null);
    } catch {
      setError("Failed to load staff roster. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStatusChange = (data: { userId: string; status: string; lastSeen: string }) => {
      setStaff((prev) =>
        prev.map((s) => {
          if (s.id?.toString() === data.userId) {
            return {
              ...s,
              workingStatus: data.status,
              lastSeen: data.lastSeen,
            };
          }
          return s;
        })
      );
    };

    socket.on('user_status_changed', handleStatusChange);
    return () => {
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [socket]);

  // Filter & Search Logic
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const working = s.workingStatus || s.status || "offline";
      if (statusFilter !== "all" && working !== statusFilter) return false;

      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.id?.toString().includes(q)
      );
    });
  }, [staff, statusFilter, search]);

  const paginatedStaff = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, page, pageSize]);

  // Unified Column Definitions
  const columns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Technician / Staff Member",
      isSortable: true,
      cell: ({ row }) => {
        const initials = row.fullName
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "ST";
        const working = row.workingStatus || row.status || "offline";

        return (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {initials}
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                  STATUS_DOT[working] || "bg-muted-foreground/40"
                )}
              />
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground">{row.fullName || "Technician"}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "company",
      header: "Assigned Company",
      cell: ({ row }) => {
        const companyName = row.staffMemberships?.[0]?.company?.name;
        return (
          <span className="text-xs text-foreground/90 font-medium">
            {companyName || "Direct Contractor"}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Live Working Status",
      cell: ({ row }) => (
        <StatusPill status={row.workingStatus || row.status || "offline"} />
      ),
    },
    {
      id: "rating",
      header: "Customer Rating",
      isSortable: true,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 font-mono font-bold text-xs text-foreground">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          {row.rating ? Number(row.rating).toFixed(1) : "5.0"}
        </span>
      ),
    },
    {
      id: "jobsCompleted",
      header: "Completed Jobs",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {row._count?.bookingsAsStaff || row._count?.bookingsAsCustomer || 0} jobs
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Field Technicians & Staff Directory"
        description="Vetting verification, skill assignments, active company contracts, and live availability tracking."
        data={paginatedStaff}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={error}
        onRetry={fetchStaff}
        onRowClick={(r) => {
          setActiveStaff(r);
          setDrawerOpen(true);
        }}
        secondaryActions={[
          {
            label: "Export CSV",
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: exportCSV,
          },
        ]}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search technicians by name, email, or ID..."
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
        totalCount={filteredStaff.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No technicians found",
          description: search
            ? "No staff members match your search query."
            : "No field technicians registered in this category.",
        }}
      />

      <StaffDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        staff={activeStaff}
        onSuccess={fetchStaff}
      />
    </div>
  );
}
