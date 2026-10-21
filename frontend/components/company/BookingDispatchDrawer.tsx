"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { StatusPill } from "@/components/admin/StatusPill";
import { User, Calendar, Clock, MapPin, Phone, Check, Loader2, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/client";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface BookingDispatchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string | null;
  onAssigned?: () => void;
}

export function BookingDispatchDrawer({
  isOpen,
  onClose,
  bookingId,
  onAssigned,
}: BookingDispatchDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen || !bookingId) {
      setBooking(null);
      setSelectedStaffId("");
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [bookingRes, staffRes] = await Promise.all([
          api.get(`/bookings/${bookingId}`),
          api.get("/companies/my-company/staff").catch(() => api.get("/staff")),
        ]);

        const bData = bookingRes.data.data?.booking || bookingRes.data.data || bookingRes.data;
        const sPayload = staffRes?.data?.data || staffRes?.data || [];
        const sData = Array.isArray(sPayload) ? sPayload : (sPayload.staff || []);

        setBooking(bData);
        setSelectedStaffId(bData.assignedStaff?.id || "");

        // Sort staff: available first, then fewest active jobs
        const sorted = [...sData].sort((a, b) => {
          const aAvail = a.status === "available" || a.isAvailable || a.status === "active";
          const bAvail = b.status === "available" || b.isAvailable || b.status === "active";
          if (aAvail && !bAvail) return -1;
          if (!aAvail && bAvail) return 1;
          return (a.activeJobsCount || 0) - (b.activeJobsCount || 0);
        });
        setStaffList(sorted);
      } catch {
        toast({ title: "Error", description: "Failed to load booking dispatch data", variant: "destructive" });
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen, bookingId]);

  const handleAssign = async () => {
    if (!selectedStaffId || !bookingId) return;
    setIsAssigning(true);
    try {
      await api.patch(`/bookings/${bookingId}/assign-staff`, {
        staffId: String(selectedStaffId),
      });
      toast({ title: "Success", description: "Technician dispatched successfully" });
      onAssigned?.();
      onClose();
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err.response?.data?.message || err.message || "Failed to assign technician",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const isClosed = booking?.status === "completed" || booking?.status === "cancelled";
  const selectedMember = staffList.find((s) => s.id === selectedStaffId);

  return (
    <BaseDrawer
      open={isOpen}
      onClose={onClose}
      title={booking ? `Dispatch #${booking.id.slice(-6).toUpperCase()}` : "Dispatch Booking"}
      subtitle={booking?.service?.name || "Home Service Order"}
      badge={booking?.status && <StatusPill status={booking.status} />}
      headerActions={
        booking && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              router.push(`/company/bookings/${booking.id}`);
              onClose();
            }}
            className="h-8 px-3 text-xs font-semibold gap-1.5"
          >
            <span>Full Profile</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </Button>
        )
      }
      footer={
        !isClosed && (
          <Button
            disabled={!selectedStaffId || isLoading || isAssigning}
            onClick={handleAssign}
            className="w-full h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-2xs gap-1.5"
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Confirming Dispatch...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>
                  {selectedMember
                    ? `Confirm Dispatch (${selectedMember.user?.fullName || selectedMember.fullName || "Technician"})`
                    : "Select a Technician to Dispatch"}
                </span>
              </>
            )}
          </Button>
        )
      }
      width="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : !booking ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Booking details unavailable.</div>
      ) : (
        <div className="p-6 space-y-5 font-sans">
          {/* Customer & Job Brief */}
          <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-xs text-foreground">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.customer?.fullName || "Client"}</span>
              </div>
              {booking.customer?.phone && (
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>{booking.customer.phone}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2.5 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : "Today"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {booking.startTime
                    ? new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Flexible"}
                </span>
              </div>
            </div>

            {booking.address && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="line-clamp-2">{booking.address}</span>
              </div>
            )}
          </div>

          {/* Technician Assignment Queue */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Technician for Dispatch
              </label>
              <span className="text-[11px] font-semibold text-emerald-600 font-mono">
                {staffList.filter((s) => s.status === "available" || s.isAvailable || s.status === "active").length} Available
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {staffList.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                  No registered technicians available.
                </div>
              ) : (
                staffList.map((member) => {
                  const isSelected = selectedStaffId === member.id;
                  const isAvailable = member.status === "available" || member.isAvailable || member.status === "active";
                  const displayName = member.user?.fullName || member.fullName || "Technician";
                  const initials = displayName.slice(0, 2).toUpperCase() || "ST";
                  const activeJobs = member.activeJobsCount ?? member.assignedBookings?.length ?? 0;

                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaffId(member.id)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                          : "border-border bg-card hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center font-bold text-xs text-foreground border border-border">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-xs">{displayName}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className={cn("font-semibold", isAvailable ? "text-emerald-600" : "text-muted-foreground")}>
                              {isAvailable ? "Available" : member.status || "Offline"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">{activeJobs} active jobs</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition",
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">Service Total</span>
            <span className="font-mono font-extrabold text-sm text-foreground">
              ${Number(booking.totalPrice || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </BaseDrawer>
  );
}

export default BookingDispatchDrawer;
