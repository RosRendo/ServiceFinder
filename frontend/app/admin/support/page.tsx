"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, User, MessageSquare, Download, Filter } from "lucide-react";
import { toast } from "sonner";
import { useSupportTickets } from "@/lib/hooks/useSupportTickets";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { SupportDrawer } from "@/components/drawers/SupportDrawer";

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

export default function AdminSupportPage() {
  const { tickets: fetchedTickets, loading, updateTicketStatus, addTicketReply } = useSupportTickets();
  const [localTickets, setLocalTickets] = useState<UISupportTicket[]>([]);

  useEffect(() => {
    if (fetchedTickets && fetchedTickets.length > 0) {
      const mapped = fetchedTickets.map(t => ({
        ...t,
        messages: (t as any).messages || [],
        userType: (t as any).userType || "customer"
      })) as UISupportTicket[];
      setLocalTickets(mapped);
    }
  }, [fetchedTickets]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [selectedTicket, setSelectedTicket] = useState<UISupportTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredTickets = localTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filteredTickets.length ? new Set() : new Set(filteredTickets.map((t) => t.id)));
  }, [filteredTickets]);

  const openTicket = (ticket: UISupportTicket) => {
    setSelectedTicket(ticket);
    setDrawerOpen(true);
  };

  const columns: Column<UISupportTicket>[] = [
    {
      key: "subject", header: "Subject", sortable: true,
      render: (t) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground">{t.subject}</span>
          <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{t.id}</span>
        </div>
      )
    },
    {
      key: "requester", header: "Requester", sortable: true,
      render: (t) => (
        <span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-sm">
          <User className="w-3.5 h-3.5" />
          {t.userName}
        </span>
      )
    },
    {
      key: "priority", header: "Priority", sortable: true,
      render: (t) => {
        let colorClass = "bg-muted/50 text-muted-foreground border-transparent";
        if (t.priority === "high" || t.priority === "urgent") colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20";
        else if (t.priority === "medium") colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
        
        return (
          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
            {t.priority}
          </span>
        );
      }
    },
    {
      key: "status", header: "Status", sortable: true,
      render: (t) => {
        let colorClass = "bg-muted/50 text-muted-foreground border-transparent";
        if (t.status === "open") colorClass = "bg-blue-500/10 text-blue-600 border-blue-500/20";
        else if (t.status === "resolved") colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        else if (t.status === "pending" || t.status === "in_progress") colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
        
        return (
          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
            {t.status.replace("_", " ")}
          </span>
        );
      }
    },
    {
      key: "updatedAt", header: "Last Updated", sortable: true,
      render: (t) => <span className="text-sm font-semibold text-muted-foreground">{new Date(t.updatedAt).toLocaleDateString()}</span>
    }
  ];

  const bulkActions = [
    { label: "Mark Resolved", icon: MessageSquare, onClick: () => toast.info("Bulk resolve coming soon") },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "open", "pending", "resolved", "closed"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background transition-colors">
          <Download className="w-3.5 h-3.5 opacity-70" /> Export
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Total Tickets", value: filteredTickets.length, color: "text-foreground" },
          { label: "Open", value: filteredTickets.filter((t) => t.status === "open").length, color: "text-blue-500" },
          { label: "Pending", value: filteredTickets.filter((t) => t.status === "pending").length, color: "text-amber-500" },
          { label: "Resolved", value: filteredTickets.filter((t) => t.status === "resolved").length, color: "text-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Full-height DataGrid */}
      <div className="flex-1 overflow-hidden relative">
        <DataGrid<UISupportTicket>
          data={filteredTickets}
          columns={columns}
          loading={loading}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          onRowClick={openTicket}
          emptyMessage="No tickets found matching your criteria."
        />
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
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
