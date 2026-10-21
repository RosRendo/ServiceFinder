"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { CreateBookingDrawer } from "@/components/drawers/CreateBookingDrawer";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";
import { Download, Plus, Calendar, Clock, AlertCircle } from "lucide-react";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { id: "all", label: "All Bookings" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const exportCSV = () => {
    const rows = filteredBookings.length ? filteredBookings : bookings;
    if (!rows.length) {
      toast({ title: "No data", description: "No bookings to export.", variant: "destructive" });
      return;
    }
    const header = "ID,Customer,Company,Service,Status,Date,Total";
    const lines = rows.map((b: any) =>
      `${b.id},"${b.customer?.fullName || ''}","${b.company?.name || ''}","${b.service?.name || ''}",${b.status},${b.bookingDate || ''},${b.totalPrice || 0}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      params.append("limit", "150");
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data.data || response.data;
      setBookings(payload.bookings || []);
      setError(null);
    } catch {
      setError("Failed to load platform bookings. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const filteredBookings = useMemo(() => {
    if (!search) return bookings;
    const query = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.customer?.fullName?.toLowerCase().includes(query) ||
        b.company?.name?.toLowerCase().includes(query) ||
        b.assignedStaff?.user?.fullName?.toLowerCase().includes(query) ||
        b.service?.name?.toLowerCase().includes(query) ||
        b.id?.toLowerCase().includes(query)
    );
  }, [bookings, search]);

  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, page, pageSize]);

  const columns: ColumnDef<any>[] = [
    {
      id: "id",
      header: "Booking Ref",
      width: "w-28",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground">
          #{row.id?.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      isSortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-xs text-foreground">
            {row.customer?.fullName || "Guest Customer"}
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {row.customer?.phone || row.customer?.email || "No direct phone"}
          </div>
        </div>
      ),
    },
    {
      id: "company",
      header: "Service Provider",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-foreground font-medium">
          {row.company?.name || "Direct Service"}
        </span>
      ),
    },
    {
      id: "service",
      header: "Service",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.service?.name || "Home Service"}
        </span>
      ),
    },
    {
      id: "assignedStaff",
      header: "Technician",
      cell: ({ row }) => {
        const staffName = row.assignedStaff?.user?.fullName || row.assignedStaff?.fullName;
        return staffName ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
              {staffName.charAt(0)}
            </div>
            <span className="text-xs font-medium text-foreground">{staffName}</span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground italic">Unassigned</span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill status={row.status} />,
    },
    {
      id: "amount",
      header: "Total Price",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono font-bold text-xs text-foreground">
          ${Number(row.totalPrice || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "date",
      header: "Scheduled Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.bookingDate
            ? new Date(row.bookingDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
            : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Platform Bookings Directory"
        description="Monitor system-wide service orders, dispute risks, fulfillment status, and company billing."
        data={paginatedBookings}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={error}
        onRetry={fetchBookings}
        onRowClick={(row) => {
          setSelectedBookingId(row.id);
          setDetailDrawerOpen(true);
        }}
        primaryAction={{
          label: "New Booking",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setCreateDrawerOpen(true),
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
        searchPlaceholder="Search bookings by customer, company, service, or ref..."
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
        totalCount={filteredBookings.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No bookings found",
          description: search
            ? "No bookings match your search query."
            : "No bookings recorded in this filter category.",
        }}
      />

      {/* Admin Audit Booking Drawer */}
      <BookingDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        bookingId={selectedBookingId}
        onBookingUpdated={fetchBookings}
        isAdmin={true}
      />

      {/* Create Booking Drawer */}
      <CreateBookingDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={fetchBookings}
      />
    </div>
  );
}
