"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Plus, Clock, UserCheck } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { BookingDispatchDrawer } from "@/components/company/BookingDispatchDrawer";
import { CreateBookingDrawer } from "@/components/drawers/CreateBookingDrawer";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "need_assignment", label: "Need Dispatch" },
  { id: "pending", label: "Pending" },
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export default function CompanyBookingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [dispatchDrawerOpen, setDispatchDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all" && activeTab !== "need_assignment" && activeTab !== "assigned") {
        params.append("status", activeTab);
      } else if (activeTab === "need_assignment" || activeTab === "assigned") {
        params.append("status", "confirmed");
      }
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data.data || response.data;
      setBookings(payload.bookings || []);
    } catch {
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "need_assignment" && (b.status !== "confirmed" || b.assignedStaff)) {
      return false;
    }
    if (activeTab === "assigned" && (b.status !== "confirmed" || !b.assignedStaff)) {
      return false;
    }
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      b.customer?.fullName?.toLowerCase().includes(query) ||
      b.service?.name?.toLowerCase().includes(query) ||
      b.id.toLowerCase().includes(query)
    );
  });

  const handleRowClick = (booking: any) => {
    setSelectedBookingId(booking.id);
    setDispatchDrawerOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "customer",
      header: "Customer",
      isSortable: true,
      cell: ({ row }) => {
        const initials = row.customer?.fullName
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CU";
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center text-xs font-bold text-foreground/90 dark:text-muted-foreground/50 shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-foreground dark:text-foreground text-xs">
                {row.customer?.fullName || "Guest Customer"}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                #{row.id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "service",
      header: "Service",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs font-medium text-foreground dark:text-foreground/90">
          {row.service?.name || "General Service"}
        </span>
      ),
    },
    {
      id: "schedule",
      header: "Schedule",
      isSortable: true,
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium text-foreground dark:text-foreground">
            {row.bookingDate ? new Date(row.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
          </div>
          <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground/70" />
            {row.startTime ? new Date(row.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Flexible"}
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => <StatusPill status={row.status} />,
    },
    {
      id: "staff",
      header: "Technician",
      isSortable: true,
      cell: ({ row }) =>
        row.assignedStaff ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background dark:bg-muted border border-border dark:border-border text-xs font-medium text-foreground/90 dark:text-muted-foreground/50">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>{row.assignedStaff.fullName}</span>
          </div>
        ) : (
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium italic">
            Needs Assignment
          </span>
        ),
    },
    {
      id: "totalPrice",
      header: "Amount",
      align: "right",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-xs text-foreground dark:text-foreground">
          ${Number(row.totalPrice || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  const pendingCount = bookings.filter((b) => b.status === "pending" || (!b.assignedStaff && b.status === "confirmed")).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ManagementDataGrid
        title="Booking Operations"
        description="Monitor active customer orders, dispatch field technicians, and review execution status."
        primaryAction={{
          label: "New Booking",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setCreateDrawerOpen(true),
        }}
        secondaryActions={[
          {
            label: "Calendar View",
            icon: <Calendar className="w-3.5 h-3.5" />,
            onClick: () => window.location.assign("/company/bookings/calendar"),
          },
        ]}
        data={filteredBookings}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        onRowClick={handleRowClick}
        searchPlaceholder="Search customer, service, or booking ID..."
        onSearchChange={setSearch}
        filterSlots={
          <div className="flex items-center gap-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === tab.id
                    ? "bg-[#0A192F] text-white shadow-xs font-semibold"
                    : "text-muted-foreground dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                <Clock className="w-3 h-3 text-amber-600" />
                {pendingCount} Pending Dispatch
              </span>
            )}
          </div>
        }
        totalCount={filteredBookings.length}
        pageSize={20}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No bookings found",
          description: "There are no service bookings matching your current filter criteria.",
          actionLabel: "Create First Booking",
          onActionClick: () => setCreateDrawerOpen(true),
        }}
      />

      {/* Slide-over Inspection & Dispatch Drawer */}
      <BookingDispatchDrawer
        isOpen={dispatchDrawerOpen}
        onClose={() => setDispatchDrawerOpen(false)}
        bookingId={selectedBookingId}
        onAssigned={fetchBookings}
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
