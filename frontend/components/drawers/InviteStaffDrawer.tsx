"use client";

import { useState, useEffect } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { UserPlus, Loader2, Mail, Phone, User, Briefcase, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/client";

interface InviteStaffDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: any;
}

export function InviteStaffDrawer({ open, onClose, onSuccess, staff }: InviteStaffDrawerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [successData, setSuccessData] = useState<{ password?: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "cleaner",
  });

  useEffect(() => {
    if (open) {
      if (staff) {
        setFormData({
          fullName: staff.user?.fullName || staff.fullName || "",
          email: staff.user?.email || staff.email || "",
          phone: staff.user?.phone || staff.phone || "",
          role: staff.role || "cleaner",
        });
      } else {
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          role: "cleaner",
        });
      }
      setSuccessData(null);
      setCopied(false);
    }
  }, [open, staff]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      if (staff?.id) {
        await api.put(`/companies/my-company/staff/${staff.id}`, formData);
        toast({
          title: "Staff Updated",
          description: "Staff details have been updated successfully.",
        });
        onSuccess();
        onClose();
      } else {
        const res = await api.post("/companies/staff", formData);
        const newStaff = res.data?.data || res.data;

        toast({
          title: "Staff Added",
          description: "Staff member successfully added to your company.",
        });

        setSuccessData({
          password: newStaff.defaultPassword || undefined,
          email: formData.email,
        });

        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || "Failed to invite staff.",
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
      title={staff ? "Edit Staff Account" : "Add Technician"}
      subtitle={staff ? "Update credentials and designation." : "Onboard a new field member to your company workforce."}
      headerIcon={UserPlus}
      width="md"
      footer={
        !successData ? (
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
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              {loading ? "Saving..." : staff ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-medium"
              placeholder="e.g. Sothea Chan"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-medium"
              placeholder="sothea@company.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Mobile Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-mono"
              placeholder="+855 12 345 678"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Trade Specialization</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary appearance-none text-foreground font-medium"
            >
              <option value="cleaner">Cleaning Specialist</option>
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="technician">AC / HVAC Technician</option>
              <option value="driver">Driver & Delivery</option>
            </select>
          </div>
        </div>
      </form>

      {/* Account Created Success Dialog */}
      {successData && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 border border-emerald-500/20">
            <UserPlus className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">Technician Account Created!</h3>
          <p className="text-xs text-muted-foreground mb-6 max-w-[280px]">
            {successData.password
              ? "Share these login credentials securely with your new crew technician."
              : "They were successfully linked to your company."}
          </p>

          <div className="w-full bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Login Email</p>
              <p className="font-semibold text-xs text-foreground font-mono">{successData.email}</p>
            </div>
            {successData.password && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Temporary Password</p>
                <div className="flex items-center justify-between bg-muted/30 border border-border rounded-xl px-3 py-2">
                  <p className="font-mono text-xs font-bold text-foreground">{successData.password}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successData.password!);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      toast({ title: "Copied!", description: "Password copied to clipboard." });
                    }}
                    className="text-[11px] font-bold text-primary hover:text-primary/80 bg-primary/10 px-2 py-0.5 rounded-lg flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => {
              setSuccessData(null);
              setFormData({ fullName: "", email: "", phone: "", role: "cleaner" });
              onClose();
            }}
            className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
          >
            Done
          </Button>
        </div>
      )}
    </BaseDrawer>
  );
}

export default InviteStaffDrawer;
