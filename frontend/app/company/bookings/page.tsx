"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar, Eye, CheckCircle2, XCircle, Clock, UserPlus, Loader2, CheckCircle, Search, Download
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BookingDrawer } from "@/components/drawers/BookingDrawer";

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<string>("all");
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

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const r = await api.get(`/companies/my-company/staff`);
      const d = r.data.data || r.data;
      setStaffMembers(Array.isArray(d) ? d : d.staff || []);
    } catch { }
    finally { setLoadingStaff(false); }
  };

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const openAssignDialog = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking); setSelectedStaffId(""); setAssignmentNotes("");
    setAssignOpen(true); fetchStaff();
  };

  const handleAssignStaff = async () => {
    if (!selectedBooking || !selectedStaffId) return;
    setAssigning(true);
    try {
      await api.patch(`/bookings/${selectedBooking.id}/assign-staff`, { staffId: selectedStaffId, notes: assignmentNotes || undefined });
      const staff = staffMembers.find((s) => s.id === selectedStaffId);
      toast({ title: "Staff Assigned", description: `${staff?.fullName} has been assigned.` });
      setAssignOpen(false); fetchBookings();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to assign staff", variant: "destructive" });
    } finally { setAssigning(false); }
  };

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
          <button onClick={(e) => openAssignDialog(e, r)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-600 bg-violet-600/10 hover:bg-violet-600/20 rounded-md transition-colors">
            <UserPlus className="w-3.5 h-3.5" /> Assign Staff
          </button>
        )
      )
    },
    { key: "totalPrice", header: "Amount", sortable: true, render: (r) => <span className="font-medium text-sm text-foreground">${Number(r.totalPrice).toFixed(2)}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filter Bar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bookings..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "pending", "confirmed", "in_progress", "completed", "cancelled"].map((s) => (
            <button key={s} onClick={() => setActiveTab(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === s ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"}`}>
              {s === "all" ? "All Bookings" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Link href="/company/bookings/calendar">
            <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
              <Calendar className="w-3.5 h-3.5" /> Calendar View
            </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-background">
        {[
          { label: "Total", value: bookings.length, color: "text-foreground" },
          { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, color: "text-amber-400" },
          { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length, color: "text-blue-400" },
          { label: "In Progress", value: bookings.filter((b) => b.status === "in_progress").length, color: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
         {loading ? (
           <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
         ) : (
           <DataGrid columns={columns} data={filtered} onRowClick={(r) => openDrawer(r.id)}
             selectedIds={selectedIds} onSelectRow={toggleRow} onSelectAll={toggleAll} emptyMessage="No bookings found." />
         )}
      </div>

      <BulkActionBar selectedCount={selectedIds.size} onClear={() => setSelectedIds(new Set())}
        actions={[
          { icon: Download, label: "Export Selected", onClick: () => toast({ title: "Exported", description: "Bookings exported to CSV." }) },
          { icon: UserPlus, label: "Bulk Assign", onClick: () => toast({ title: "Coming Soon", description: "Bulk assignment is not yet available." }) }
        ]} />

      <BookingDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} bookingId={activeBookingId} onBookingUpdated={fetchBookings} />

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md rounded-lg border border-border bg-background shadow-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-foreground">Assign Staff</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">Select a team member for this booking</DialogDescription>
            </DialogHeader>
          </div>
          {selectedBooking && (
            <div className="px-6 py-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 border border-border flex items-center justify-between">
                <div>
                    <div className="font-medium text-foreground text-sm">{selectedBooking.service.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(selectedBooking.bookingDate).toLocaleDateString()} · {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Select Staff Member</label>
                {loadingStaff ? (
                  <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-primary opacity-50" /></div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                    {staffMembers.map((staff) => (
                      <label key={staff.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${selectedStaffId === staff.id ? "border-violet-500/50 bg-violet-500/10" : "border-border hover:bg-muted/50"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" className="sr-only" checked={selectedStaffId === staff.id} onChange={() => setSelectedStaffId(staff.id)} />
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {staff.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                          </div>
                          <div><div className="text-sm font-medium text-foreground">{staff.fullName}</div><div className="text-xs text-muted-foreground">{staff.role}</div></div>
                        </div>
                        {selectedStaffId === staff.id && <CheckCircle className="w-4 h-4 text-violet-500" />}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notes (Optional)</label>
                <Textarea placeholder="Special instructions for the staff..." value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} className="resize-none text-sm border-border focus:border-violet-500/50 rounded-lg h-20 bg-muted/50" />
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
            <button onClick={() => setAssignOpen(false)} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-all">Cancel</button>
            <button onClick={handleAssignStaff} disabled={!selectedStaffId || assigning} className="px-4 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2">
              {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
