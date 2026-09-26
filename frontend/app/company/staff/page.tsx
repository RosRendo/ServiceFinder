"use client";

import { useState, useEffect } from "react";
import { UserPlus, Star, Edit2, Phone, Mail } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { useSocket } from "@/lib/hooks/useSocket";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { StaffDrawer } from "@/components/drawers/StaffDrawer";
import { InviteStaffDrawer } from "@/components/drawers/InviteStaffDrawer";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "all", label: "All Staff" },
  { id: "online", label: "Online" },
  { id: "on_job", label: "On Job" },
  { id: "offline", label: "Offline" },
];

export default function CompanyStaffPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<any | null>(null);
  const [editStaff, setEditStaff] = useState<any | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { socket } = useSocket();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get("/companies/my-company/staff");
      const payload = response.data.data || response.data;
      setStaff(Array.isArray(payload) ? payload : payload.staff || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load staff", variant: "destructive" });
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
          if (s.user?.id?.toString() === data.userId) {
            return {
              ...s,
              user: {
                ...s.user,
                workingStatus: data.status,
                lastSeen: data.lastSeen,
              },
            };
          }
          return s;
        })
      );
    };

    socket.on("staff:status_change", handleStatusChange);
    return () => {
      socket.off("staff:status_change", handleStatusChange);
    };
  }, [socket]);

  const filteredStaff = staff.filter((s) => {
    const rawStatus = (s.user?.workingStatus || s.user?.status || s.status || "offline").toLowerCase();
    if (statusFilter !== "all" && rawStatus !== statusFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    const name = (s.user?.fullName || s.name || "").toLowerCase();
    const phone = (s.user?.phone || s.phone || "").toLowerCase();
    const email = (s.user?.email || s.email || "").toLowerCase();
    return name.includes(query) || phone.includes(query) || email.includes(query);
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Staff Member",
      isSortable: true,
      cell: ({ row }) => {
        const name = row.user?.fullName || row.name || "Technician";
        const role = row.role || "Field Technician";
        const initials = name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center font-bold text-xs text-foreground/90 dark:text-muted-foreground/50 shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-foreground dark:text-foreground text-xs">{name}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{role}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const phone = row.user?.phone || row.phone;
        const email = row.user?.email || row.email;
        return (
          <div className="text-xs space-y-0.5">
            {phone && (
              <div className="text-foreground/90 dark:text-muted-foreground/50 flex items-center gap-1">
                <Phone className="w-3 h-3 text-muted-foreground/70" />
                <span>{phone}</span>
              </div>
            )}
            {email && (
              <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                <Mail className="w-3 h-3 text-muted-foreground/70" />
                <span className="truncate max-w-[140px]">{email}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => {
        const rawStatus = row.user?.workingStatus || row.user?.status || row.status || "offline";
        return <StatusPill status={rawStatus} />;
      },
    },
    {
      id: "rating",
      header: "Rating",
      align: "center",
      isSortable: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-semibold text-xs text-foreground dark:text-foreground/90">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {row.rating || "5.0"}
        </span>
      ),
    },
    {
      id: "jobsCompleted",
      header: "Jobs",
      align: "center",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground/90 dark:text-muted-foreground/50">
          {row._count?.assignedBookings || row.jobsCompleted || 0}
        </span>
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
              setEditStaff(row);
              setInviteDrawerOpen(true);
            }}
            className="p-1 rounded text-muted-foreground/70 hover:text-foreground/90 dark:hover:text-foreground hover:bg-muted dark:hover:bg-muted transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const onlineCount = staff.filter(
    (s) => (s.user?.workingStatus || s.user?.status || s.status) === "online"
  ).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ManagementDataGrid
        title="Field Staff Roster"
        description="Monitor staff availability, review performance ratings, and manage technician profiles."
        primaryAction={{
          label: "Add Staff Member",
          icon: <UserPlus className="w-4 h-4" />,
          onClick: () => {
            setEditStaff(null);
            setInviteDrawerOpen(true);
          },
        }}
        data={filteredStaff}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        onRowClick={(r) => {
          setActiveStaff(r);
          setDrawerOpen(true);
        }}
        searchPlaceholder="Search technician name, phone, or email..."
        onSearchChange={setSearch}
        filterSlots={
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  statusFilter === tab.id
                    ? "bg-[#0A192F] text-white shadow-xs font-semibold"
                    : "text-muted-foreground dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
            {onlineCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {onlineCount} Online
              </span>
            )}
          </div>
        }
        totalCount={filteredStaff.length}
        pageSize={20}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No staff members found",
          description: "There are no technicians matching your active filter criteria.",
          actionLabel: "Add First Technician",
          onActionClick: () => {
            setEditStaff(null);
            setInviteDrawerOpen(true);
          },
        }}
      />

      {/* Staff Detail Drawer */}
      {activeStaff && (
        <StaffDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSuccess={fetchStaff}
          staff={{
            id: activeStaff.id,
            name: activeStaff.user?.fullName || activeStaff.name || "Technician",
            role: activeStaff.role,
            status: activeStaff.user?.workingStatus || activeStaff.user?.status || activeStaff.status || "offline",
            lastSeen: activeStaff.user?.lastSeen,
            jobsCompleted: activeStaff._count?.assignedBookings || activeStaff.jobsCompleted || 0,
            pendingPayout: activeStaff.walletBalance || 0,
            phone: activeStaff.user?.phone || activeStaff.phone || "No phone",
            activeJob: undefined,
            splitPercent:
              activeStaff.splitPercent !== undefined && activeStaff.splitPercent !== null
                ? Number(activeStaff.splitPercent)
                : null,
            compliance: [],
            schedule: [],
            currentLocation: "Unknown",
          }}
        />
      )}

      {/* Invite / Edit Staff Drawer */}
      <InviteStaffDrawer
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        onSuccess={() => fetchStaff()}
        staff={editStaff}
      />
    </div>
  );
}
