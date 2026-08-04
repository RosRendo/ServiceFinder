"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { CalendarPlus, Loader2, MapPin, AlignLeft, Building2, Wrench } from "lucide-react";
import api from "@/lib/api/client";

interface CreateBookingDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId?: string; // If provided, pre-fills the company
}

export function CreateBookingDrawer({ open, onClose, onSuccess, companyId }: CreateBookingDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyId: companyId || "",
    serviceId: "",
    bookingDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    serviceAddress: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (!companyId) {
        api.get("/admin/companies?limit=100").then(res => {
          const payload = res.data?.data?.companies || res.data?.companies || res.data?.data || [];
          setCompanies(Array.isArray(payload) ? payload : []);
        }).catch(() => {});
      } else {
        fetchServices(companyId);
      }
    }
  }, [open, companyId]);

  const fetchServices = async (cid: string) => {
    try {
      const res = await api.get(`/companies/${cid}/services`);
      const payload = res.data?.data || res.data || [];
      setServices(Array.isArray(payload) ? payload : []);
    } catch (e) {
      setServices([]);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, companyId: val, serviceId: "" });
    if (val) fetchServices(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.serviceId || !formData.bookingDate || !formData.startTime || !formData.serviceAddress) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    try {
      await api.post("/bookings", formData);
      toast({
        title: "Booking Created",
        description: "The manual booking has been successfully added.",
      });
      setFormData({
        companyId: companyId || "",
        serviceId: "",
        bookingDate: new Date().toISOString().split("T")[0],
        startTime: "09:00",
        serviceAddress: "",
        notes: "",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || "Failed to create booking.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseDrawer 
      open={open} 
      onClose={onClose} 
      title="Create Manual Booking"
      subtitle="Manually dispatch a booking. This bypasses normal customer scheduling rules."
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mx-auto mb-6 shadow-sm border border-violet-200">
          <CalendarPlus className="w-8 h-8" />
        </div>
        
        {!companyId && (
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Company *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                required
                value={formData.companyId}
                onChange={handleCompanyChange}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all appearance-none"
              >
                <option value="">Select a company</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service *</label>
          <div className="relative">
            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {services.length > 0 ? (
              <select
                required
                value={formData.serviceId}
                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all appearance-none"
              >
                <option value="">Select a service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.serviceType?.name || s.name || `Service #${s.id}`}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={formData.serviceId}
                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
                placeholder="Enter Service ID directly"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date *</label>
            <input
              type="date"
              required
              value={formData.bookingDate}
              onChange={e => setFormData({...formData, bookingDate: e.target.value})}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Time *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service Address *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              required
              value={formData.serviceAddress}
              onChange={e => setFormData({...formData, serviceAddress: e.target.value})}
              className="w-full pl-9 pr-4 py-2 h-20 resize-none bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="Full address for the worker..."
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Customer Notes</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full pl-9 pr-4 py-2 h-20 resize-none bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="Manual override instructions..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Booking"}
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
}
