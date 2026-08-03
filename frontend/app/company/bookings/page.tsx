"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Eye, CheckCircle2, XCircle, Clock, UserPlus, Loader2, CheckCircle, Search, Download, Edit, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";

export default function Bookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();


  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.append("status", activeTab);
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data.data || response.data;
      setBookings(payload.bookings || []);
    } catch {
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return b.customer?.fullName?.toLowerCase().includes(query) || 
           b.service?.name?.toLowerCase().includes(query) || 
           b.id.toLowerCase().includes(query);
  });

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }, [filtered]);

  const openDrawer = (id: string) => {
      setActiveBookingId(id);
      setDrawerOpen(true);
  };

  const columns: Column<any>[] = [
    {
      key: "customer", header: "Customer & Service", sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {r.customer?.avatar ? (
              <img src={r.customer.avatar} alt="avatar" className="w-7 h-7 rounded-full shrink-0 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {r.customer?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-sm text-foreground leading-tight">{r.customer?.fullName}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{r.service?.name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "bookingDate", header: "Schedule", sortable: true,
      render: (r) => (
        <div>
          <div className="font-medium text-foreground text-sm">{new Date(r.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(r.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "assignedStaff", header: "Assigned Staff", sortable: true,
      render: (r) => (
        r.assignedStaff ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
               {r.assignedStaff.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
            </div>
            <span className="text-sm font-medium text-foreground">{r.assignedStaff.fullName}</span>
          </div>
        ) : (
          <span className="text-sm font-medium text-muted-foreground italic">Unassigned</span>
        )
      )
    },
    { key: "totalPrice", header: "Amount", sortable: true, render: (r) => <span className="font-medium text-sm text-foreground">${Number(r.totalPrice).toFixed(2)}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search bookings..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" 
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s === "all" ? "All Bookings" : s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Link href="/company/bookings/calendar">
          <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm bg-background">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Calendar
          </button>
        </Link>

        <span className="text-xs text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ml-1">
          <Clock className="w-3 h-3" />
          {bookings.filter(b => b.status === 'pending').length} pending
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
         {loading ? (
           <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
         ) : (
           <DataGrid
            selectedIds={selectedIds}
            onToggleRow={(id) => setSelectedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; })}
            onToggleAll={() => setSelectedIds(p => p.size === filtered.length ? new Set() : new Set(filtered.map((x: any) => x.id)))}
            columns={columns} 
             data={filtered} 
             onRowClick={(r) => openDrawer(r.id)}
             emptyMessage="No bookings found." 
           />
         )}
      </div>

      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} bookingId={activeBookingId} onBookingUpdated={fetchBookings} />
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            icon: Eye,
            label: "View Detail",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              if (id) {
                router.push(`/company/bookings/${id}`);
              }
  
            }
          },
          {
            icon: Edit2,
            label: "Edit",
            onClick: () => {
              const id = Array.from(selectedIds)[0];

              const b = filtered.find((x: any) => x.id === id);
              if (b) {
                setActiveBookingId(b.id);
                setDrawerOpen(true);
              }
  
            }
          },
          {
            icon: Trash2,
            label: "Delete",
            variant: "danger",
            onClick: () => {
              setSelectedIds(new Set());
            }
          }
        ]}
      />
    </div>
  );
}
