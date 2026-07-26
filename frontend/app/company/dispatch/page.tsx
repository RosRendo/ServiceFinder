"use client";
import { useState, useEffect } from "react";
import { Search, Loader2, Calendar, Clock, Map, UserPlus, RefreshCw, AlertCircle, MessageCircle } from "lucide-react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";

export default function DispatchCenter() {
  const [activeTab, setActiveTab] = useState<string>("active");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const fetchDispatchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === "unassigned") {
        params.append("status", "pending,accepted");
      } else if (activeTab === "active") {
        params.append("status", "in_progress");
      }
      const response = await api.get(`/bookings?${params.toString()}`);
      const payload = response.data.data || response.data;
      setBookings(payload.bookings || []);
    } catch {
      toast({ title: "Error", description: "Failed to load dispatch board", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const r = await api.get(`/companies/my-company/staff`);
      const d = r.data.data || r.data;
      setStaffMembers(Array.isArray(d) ? d : d.staff || []);
    } catch { }
    finally { setLoadingStaff(false); }
  };

  useEffect(() => { fetchDispatchBookings(); }, [activeTab]);

  const openAssignDialog = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setSelectedStaffId("");
    setAssignmentNotes("");
    setAssignOpen(true);
    fetchStaff();
  };

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast({ title: "Required", description: "Please select a staff member", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      await api.patch(`/bookings/${selectedBooking.id}/assign-staff`, {
        staffId: selectedStaffId,
        notes: assignmentNotes
      });
      toast({ title: "Success", description: "Staff assigned successfully!" });
      setAssignOpen(false);
      fetchDispatchBookings();
    } catch (err: any) {
      toast({
        title: "Assignment Failed",
        description: err.response?.data?.message || err.message || "Could not assign staff.",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return b.customer?.fullName?.toLowerCase().includes(query) || 
           b.service?.name?.toLowerCase().includes(query) || 
           b.assignedStaff?.user?.fullName?.toLowerCase().includes(query) || 
           b.id.toLowerCase().includes(query);
  });

  const columns: Column<any>[] = [
    { key: "id", header: "#ID", width: "w-20", sortable: true, render: (r) => <span className="text-violet-400 font-mono text-xs">#{r.id}</span> },
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
               {r.assignedStaff.user?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
            </div>
            <span className="text-sm font-medium text-foreground">{r.assignedStaff.user?.fullName}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Unassigned
          </span>
        )
      )
    },
    {
      key: "actions", header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!r.assignedStaff && r.status !== "cancelled" ? (
            <button onClick={(e) => openAssignDialog(e, r)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-600 bg-violet-600/10 hover:bg-violet-600/20 rounded-md transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Assign
            </button>
          ) : (
            <>
              <button onClick={(e) => openAssignDialog(e, r)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border rounded-md transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Reassign
              </button>
              <button className="flex items-center justify-center w-7 h-7 text-violet-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-md transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-border bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Map className="w-6 h-6 text-violet-500" />
              Dispatch Center
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage active jobs and dispatch staff in real-time.</p>
          </div>
          <button
            onClick={fetchDispatchBookings}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Board
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dispatch..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveTab("active")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === "active" ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
            Active & In-Progress
          </button>
          <button onClick={() => setActiveTab("unassigned")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${activeTab === "unassigned" ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
            Pending Assignment
            {bookings.filter(b => !b.assignedStaffId).length > 0 && activeTab !== "unassigned" && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            )}
          </button>
          <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === "all" ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
            All Today
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden p-6 pt-0 mt-6 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid
            columns={columns}
            data={filtered}
            selectedIds={selectedIds}
            onSelectRow={(id) => {
              setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
            }}
            onSelectAll={() => {
              setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(b => b.id)));
            }}
            onRowClick={(row) => {
              setActiveBookingId(row.id);
              setDrawerOpen(true);
            }}
            emptyMessage={search ? "No dispatch items match your search." : "No dispatch items found."}
          />
        )}
      </div>

      {/* Booking Drawer */}
      <BookingDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bookingId={activeBookingId || ""}
        onBookingUpdated={fetchDispatchBookings}
      />

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedBooking?.assignedStaff ? "Reassign Staff" : "Assign Staff"}</DialogTitle>
            <DialogDescription>
              Select an available staff member for booking #{selectedBooking?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Staff</label>
              {loadingStaff ? (
                <div className="text-sm text-gray-500">Loading staff...</div>
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Staff --</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.fullName} ({s.status})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dispatch Notes (Optional)</label>
              <Textarea
                value={assignmentNotes}
                onChange={(e: any) => setAssignmentNotes(e.target.value)}
                placeholder="Any special instructions..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning || !selectedStaffId} className="bg-blue-600 hover:bg-blue-700">
              {assigning ? "Assigning..." : "Confirm Dispatch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      

    </div>
  );
}
