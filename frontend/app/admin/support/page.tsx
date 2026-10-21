"use client";

import { useState, useEffect, useMemo } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { SupportDrawer } from "@/components/drawers/SupportDrawer";
import { ConfirmationDialog } from "@/components/admin/ConfirmationDialog";
import { Download, MessageSquare, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSupportTickets } from "@/lib/hooks/useSupportTickets";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "pending" | "resolved" | "closed" | "in_progress";
type TicketPriority = "low" | "medium" | "high" | "urgent";

interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "company" | "admin" | "staff";
  content: string;
  createdAt: string;
}

export interface UISupportTicket {
  id: string;
  subject: string;
  userType: "customer" | "company" | "staff";
  userName: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

const FILTER_TABS = [
  { id: "all", label: "All Tickets" },
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In Progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export default function AdminSupportPage() {
  const { tickets: fetchedTickets, loading, updateTicketStatus } = useSupportTickets();
  const [localTickets, setLocalTickets] = useState<UISupportTicket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<UISupportTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    if (fetchedTickets && fetchedTickets.length > 0) {
      const mapped = fetchedTickets.map((t) => ({
        ...t,
        messages: (t as any).messages || [],
        userType: (t as any).userType || "customer",
      })) as UISupportTicket[];
      setLocalTickets(mapped);
    }
  }, [fetchedTickets]);

  const exportCSV = () => {
    const rows = filteredTickets;
    if (!rows.length) {
      toast.error("No support tickets to export.");
      return;
    }
    const header = ["ID", "Subject", "User", "User Type", "Status", "Priority", "Created At"];
    const csvRows = [
      header.join(","),
      ...rows.map((t) =>
        `"${t.id}","${t.subject}","${t.userName}","${t.userType}","${t.status}","${t.priority}","${new Date(t.createdAt).toLocaleDateString()}"`
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `support-tickets-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} support ticket records.`);
  };

  const filteredTickets = useMemo(() => {
    return localTickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        ticket.subject.toLowerCase().includes(q) ||
        ticket.id.toLowerCase().includes(q) ||
        ticket.userName.toLowerCase().includes(q)
      );
    });
  }, [localTickets, statusFilter, search]);

  const paginatedTickets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, page, pageSize]);

  const columns: ColumnDef<UISupportTicket>[] = [
    {
      id: "subject",
      header: "Ticket Ref & Subject",
      isSortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-xs text-foreground truncate max-w-[280px]">
            {row.subject}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase mt-0.5">
            #{row.id.slice(-6).toUpperCase()}
          </div>
        </div>
      ),
    },
    {
      id: "requester",
      header: "Requester",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-medium">{row.userName}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground capitalize">
            {row.userType}
          </span>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      isSortable: true,
      cell: ({ row }) => {
        let colorClass = "bg-muted text-muted-foreground border-border";
        if (row.priority === "high" || row.priority === "urgent") {
          colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/25";
        } else if (row.priority === "medium") {
          colorClass = "bg-sky-500/10 text-sky-600 border-sky-500/25";
        }
        return (
          <span className={cn("inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", colorClass)}>
            {row.priority}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      isSortable: true,
      cell: ({ row }) => {
        let colorClass = "bg-muted text-muted-foreground border-border";
        if (row.status === "open") colorClass = "bg-sky-500/10 text-sky-600 border-sky-500/25";
        else if (row.status === "resolved") colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/25";
        else if (row.status === "pending" || row.status === "in_progress") colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/25";
        
        return (
          <span className={cn("inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider", colorClass)}>
            {row.status.replace("_", " ")}
          </span>
        );
      },
    },
    {
      id: "updatedAt",
      header: "Last Activity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Help Desk & Support Center"
        description="Mediate customer support requests, company operational escalations, and platform inquiries."
        data={paginatedTickets}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        onRowClick={(ticket) => {
          setSelectedTicket(ticket);
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
        searchPlaceholder="Search tickets by subject, ref, or user name..."
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
        totalCount={filteredTickets.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No support tickets found",
          description: search
            ? "No tickets match your search query."
            : "No active support inquiries in this filter category.",
        }}
      />

      {selectedTicket && (
        <SupportDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ticket={selectedTicket as any}
        />
      )}
    </div>
  );
}
