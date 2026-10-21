"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { CalendarPlus, Loader2, MapPin, AlignLeft, Building2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/client";

interface CreateBookingDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId?: string;
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
    } catch {
      setServices([]);
    }
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, companyId: val, serviceId: "" });
    if (val) fetchServices(val);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      subtitle="Manually dispatch an appointment. Bypasses regular customer checkout."
      headerIcon={CalendarPlus}
      width="lg"
      footer={
        <div className="flex items-center gap-2.5 w-full">
          <Button variant="outline" type="button" onClick={onClose} className="h-9 px-4 text-xs font-semibold">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit()}
            className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-2 rounded-xl"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
            {loading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
        {!companyId && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Company *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                required
                value={formData.companyId}
                onChange={handleCompanyChange}
                className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all appearance-none text-foreground"
              >
                <option value="">Select a service provider</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Service Item *</label>
          <div className="relative">
            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            {services.length > 0 ? (
              <select
                required
                value={formData.serviceId}
                onChange={e => setFormData({...formData, serviceId: e.target.value})}
                className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary transition-all appearance-none text-foreground"
              >
                <option value="">Select a service catalog item</option>
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
                className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
                placeholder={formData.companyId ? "No services found for this company" : "Select a company first"}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Date *</label>
            <input
              type="date"
              required
              value={formData.bookingDate}
              onChange={e => setFormData({...formData, bookingDate: e.target.value})}
              className="w-full px-3 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Start Time *</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-3 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Service Address *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              required
              value={formData.serviceAddress}
              onChange={e => setFormData({...formData, serviceAddress: e.target.value})}
              className="w-full pl-9 pr-4 py-2.5 h-20 resize-none bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
              placeholder="Full location address for dispatch..."
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Internal Instructions</label>
          <div className="relative">
            <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full pl-9 pr-4 py-2.5 h-18 resize-none bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground"
              placeholder="Gate code, customer notes, special tools required..."
            />
          </div>
        </div>
      </form>
    </BaseDrawer>
  );
}

export default CreateBookingDrawer;
