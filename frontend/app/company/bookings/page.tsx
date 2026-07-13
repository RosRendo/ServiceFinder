"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar, Eye, CheckCircle2, XCircle, Clock, UserPlus, Loader2, CheckCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/lib/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api/client";
import type { BookingStatus } from "@/types/booking.types";

const STATUS_CFG = {
  pending: { label: "Pending", class: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", class: "bg-blue-50 text-blue-700" },
  in_progress: { label: "In Progress", class: "bg-indigo-50 text-indigo-700" },
  completed: { label: "Completed", class: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", class: "bg-rose-50 text-rose-700" },
} as const;

const TABS: Array<"all" | BookingStatus> = ["all", "pending", "confirmed", "in_progress", "completed", "cancelled"];

export default function Bookings() {
  const [activeTab, setActiveTab] = useState<"all" | BookingStatus>("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

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
    } catch {}
    finally { setLoadingStaff(false); }
  };

  useEffect(() => { fetchBookings(); }, [activeTab]);

  const openAssignDialog = (booking: any) => {
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

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === "all" ? bookings.length : bookings.filter((b) => b.status === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage service requests, assign staff, and track status</p>
        </div>
        <Link href="/company/bookings/calendar">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">
            <Calendar className="w-4 h-4" /> Calendar
          </button>
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${activeTab === tab ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Calendar className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Customer & Service</th>
                  <th className="px-5 py-3 text-left">Schedule</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Assigned Staff</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((booking) => {
                  const s = STATUS_CFG[booking.status as keyof typeof STATUS_CFG] || STATUS_CFG.pending;
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 rounded-md border border-gray-100 shrink-0">
                            <AvatarImage src={booking.customer.avatar || undefined} />
                            <AvatarFallback className="text-xs font-bold bg-indigo-50 text-indigo-700 rounded-md">{booking.customer?.fullName?.[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{booking.customer.fullName}</div>
                            <div className="text-xs text-gray-400">{booking.service.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <div className="font-medium text-gray-900">{new Date(booking.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div className="text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.class}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {booking.assignedStaff ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6 rounded border border-gray-100"><AvatarFallback className="text-[10px] bg-gray-100">{booking.assignedStaff.fullName?.[0] ?? "?"}</AvatarFallback></Avatar>
                            <span className="text-xs font-medium text-gray-700">{booking.assignedStaff.fullName}</span>
                          </div>
                        ) : (
                          <button onClick={() => openAssignDialog(booking)} className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                            <UserPlus className="w-3 h-3" /> Assign
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">${Number(booking.totalPrice).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/company/bookings/${booking.id}`}>
                          <button className="p-1.5 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-4 h-4 text-gray-400" /></button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold text-gray-900">Assign Staff</DialogTitle>
              <DialogDescription className="text-xs text-gray-500">Select a team member for this booking</DialogDescription>
            </DialogHeader>
          </div>
          {selectedBooking && (
            <div className="px-6 py-4 space-y-4">
              <div className="bg-gray-50 rounded-md p-3 border border-gray-100 text-sm">
                <div className="font-medium text-gray-900">{selectedBooking.service.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{new Date(selectedBooking.bookingDate).toLocaleDateString()} · {new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Select Staff</label>
                {loadingStaff ? (
                  <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {staffMembers.map((staff) => (
                      <label key={staff.id} className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${selectedStaffId === staff.id ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" className="sr-only" checked={selectedStaffId === staff.id} onChange={() => setSelectedStaffId(staff.id)} />
                          <Avatar className="w-7 h-7 rounded shrink-0"><AvatarFallback className="text-xs bg-gray-100">{staff.fullName?.[0]}</AvatarFallback></Avatar>
                          <div><div className="text-sm font-medium text-gray-900">{staff.fullName}</div><div className="text-xs text-gray-400">{staff.role}</div></div>
                        </div>
                        {selectedStaffId === staff.id && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Notes (Optional)</label>
                <Textarea placeholder="Special instructions..." value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} className="resize-none text-sm border-gray-200" rows={2} />
              </div>
            </div>
          )}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={() => setAssignOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleAssignStaff} disabled={!selectedStaffId || assigning} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-60 flex items-center gap-2">
              {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Assign
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
