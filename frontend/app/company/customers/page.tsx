"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { Users, Mail, Phone, ShieldAlert, Eye, MessageSquare, ArrowUpRight } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { useSocket } from "@/lib/hooks/useSocket";
import { CustomerDrawer } from "@/components/drawers/CustomerDrawer";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { id: "all", label: "All Customers" },
  { id: "active", label: "Active" },
  { id: "with_bookings", label: "With Bookings" },
  { id: "with_disputes", label: "With Disputes" },
];

export default function CustomersCRM() {
  const router = useRouter();
  const { toast } = useToast();
  const { socket } = useSocket();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`/companies/my-company/customers?${params.toString()}`);
      const payload = res.data.data || res.data;
      setCustomers(payload.customers || []);
      setError(null);
    } catch {
      setError("Failed to load customer directory. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!socket) return;
    
    const handleStatusChange = (data: { userId: string; status: string; lastSeen: string }) => {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id?.toString() === data.userId) {
            return {
              ...c,
              workingStatus: data.status,
              lastSeen: data.lastSeen,
            };
          }
          return c;
        })
      );
    };

    socket.on("user_status_changed", handleStatusChange);
    return () => {
      socket.off("user_status_changed", handleStatusChange);
    };
  }, [socket]);

  // Filter & Search Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (activeTab === "active" && c.status !== "active") return false;
      if (activeTab === "with_bookings" && (c.stats?.totalBookings || 0) === 0) return false;
      if (activeTab === "with_disputes" && (c.stats?.activeDisputes || 0) === 0) return false;

      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.fullName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.id?.toString().includes(q)
      );
    });
  }, [customers, activeTab, search]);

  // Pagination Slice
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  // Unified ManagementDataGrid Column Definitions
  const columns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Customer",
      isSortable: true,
      cell: ({ row }) => {
        const initials = row.fullName
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CU";

        const isOnline = (row.workingStatus || row.status) === "online";

        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {row.profilePictureUrl ? (
                  <img src={row.profilePictureUrl} alt={row.fullName} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
                  isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs">{row.fullName || "Customer"}</div>
              <div className="text-[11px] text-muted-foreground capitalize">
                {isOnline ? "Online Now" : row.status || "active"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact Info",
      cell: ({ row }) => (
        <div className="space-y-0.5 text-xs text-muted-foreground">
          {row.email && (
            <div className="flex items-center gap-1.5 truncate max-w-[190px]">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{row.email}</span>
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "ltv",
      header: "Lifetime Value (LTV)",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
          ${Number(row.stats?.ltv || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "bookings",
      header: "Completed Jobs",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
          {row.stats?.totalBookings || 0} jobs
        </span>
      ),
    },
    {
      id: "disputes",
      header: "Dispute Health",
      cell: ({ row }) => {
        const disputes = row.stats?.activeDisputes || 0;
        if (disputes === 0) {
          return <span className="text-xs text-muted-foreground">None (Clean)</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/25">
            <ShieldAlert className="w-3 h-3" />
            {disputes} Active
          </span>
        );
      },
    },
    {
      id: "lastActivity",
      header: "Last Activity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.stats?.lastActivity
            ? new Date(row.stats.lastActivity).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
            : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Customer Directory"
        description="Comprehensive client roster, lifetime value telemetry, and dispute records."
        data={paginatedCustomers}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={error}
        onRetry={fetchCustomers}
        onRowClick={(row) => {
          setActiveCustomer({
            ...row,
            totalBookings: row.stats?.totalBookings || 0,
            activeDisputes: row.stats?.activeDisputes || 0,
            ltv: row.stats?.ltv || 0,
            recentBookings: row.stats?.recentBookings || [],
          });
          setDrawerOpen(true);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search customers by name, email, or phone..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filteredCustomers.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No customers found",
          description: search
            ? "No customers match your search query."
            : "No clients have completed bookings with your company yet.",
        }}
      />

      <CustomerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        customer={activeCustomer}
      />
    </div>
  );
}
