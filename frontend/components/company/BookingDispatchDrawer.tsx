"use client";

import React, { useState, useEffect } from 'react';
import { SlideoverDrawer } from '@/components/admin/SlideoverDrawer';
import { StatusPill } from '@/components/admin/StatusPill';
import { User, Calendar, Clock, MapPin, Phone, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api/client';
import { useToast } from '@/lib/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  const [booking, setBooking] = useState<any | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (!isOpen || !bookingId) {
      setBooking(null);
      setSelectedStaffId('');
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [bookingRes, staffRes] = await Promise.all([
          api.get(`/bookings/${bookingId}`),
          api.get('/staff'),
        ]);

        const bData = bookingRes.data.data?.booking || bookingRes.data.data || bookingRes.data;
        const sData = staffRes.data.data?.staff || staffRes.data.data || staffRes.data || [];

        setBooking(bData);
        setSelectedStaffId(bData.assignedStaff?.id || '');

        // Sort staff: available first, then fewest active jobs
        const sorted = [...sData].sort((a, b) => {
          if (a.status === 'available' && b.status !== 'available') return -1;
          if (a.status !== 'available' && b.status === 'available') return 1;
          return (a.activeJobsCount || 0) - (b.activeJobsCount || 0);
        });
        setStaffList(sorted);
      } catch {
        toast({ title: 'Error', description: 'Failed to load booking dispatch data', variant: 'destructive' });
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
      await api.patch(`/bookings/${bookingId}`, {
        assignedStaffId: selectedStaffId,
        status: 'confirmed',
      });
      toast({ title: 'Success', description: 'Technician dispatched successfully' });
      onAssigned?.();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to assign technician', variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <SlideoverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={booking ? `Booking #${booking.id.slice(-6).toUpperCase()}` : 'Dispatch Booking'}
      subtitle={booking?.service?.name || 'Home Service Order'}
      badge={booking?.status && <StatusPill status={booking.status} />}
      width="lg"
      footer={{
        primaryAction: {
          label: isAssigning ? 'Dispatching...' : 'Confirm Dispatch',
          onClick: handleAssign,
          isLoading: isAssigning,
          disabled: !selectedStaffId || isLoading,
        },
        secondaryAction: {
          label: 'Cancel',
          onClick: onClose,
        },
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
        </div>
      ) : !booking ? (
        <div className="text-center py-12 text-slate-500 text-sm">Booking details unavailable.</div>
      ) : (
        <div className="space-y-6 text-sm">
          {/* Section 1: Customer & Job Brief */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                <User className="h-4 w-4 text-slate-400" />
                <span>{booking.customer?.fullName || 'Customer'}</span>
              </div>
              {booking.customer?.phone && (
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="text-xs font-semibold text-[#0A192F] dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  <span>{booking.customer.phone}</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Flexible'}</span>
              </div>
            </div>

            {booking.address && (
              <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{booking.address}</span>
              </div>
            )}
          </div>

          {/* Section 2: Technician Assignment Queue */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Technician
              </label>
              <span className="text-xs text-slate-400">
                {staffList.filter((s) => s.status === 'available').length} Available Now
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {staffList.length === 0 ? (
                <div className="p-4 text-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                  No registered staff available. Add staff in the Staff Roster.
                </div>
              ) : (
                staffList.map((member) => {
                  const isSelected = selectedStaffId === member.id;
                  const isAvailable = member.status === 'available';
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaffId(member.id)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border transition cursor-pointer',
                        isSelected
                          ? 'border-[#0A192F] bg-slate-50 dark:bg-slate-800 dark:border-sky-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                          {member.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {member.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className={cn('font-medium', isAvailable ? 'text-emerald-600' : 'text-slate-400')}>
                              {isAvailable ? 'Available' : member.status || 'Offline'}
                            </span>
                            <span>•</span>
                            <span>{member.activeJobsCount || 0} active jobs</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border flex items-center justify-center transition',
                          isSelected
                            ? 'bg-[#0A192F] border-[#0A192F] text-white dark:bg-sky-400 dark:border-sky-400 dark:text-slate-900'
                            : 'border-slate-300 dark:border-slate-600'
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

          {/* Section 3: Financial Summary */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Service Total</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
              ${Number(booking.totalPrice || 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </SlideoverDrawer>
  );
}

export default BookingDispatchDrawer;
