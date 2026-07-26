"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { UserPlus, Loader2, Mail, Phone, User, Briefcase } from "lucide-react";
import api from "@/lib/api/client";

interface InviteStaffDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteStaffDrawer({ open, onClose, onSuccess }: InviteStaffDrawerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [successData, setSuccessData] = useState<{ password?: string, email: string } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "cleaner",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post("/companies/staff", formData);
      const newStaff = res.data?.data || res.data;
      
      toast({
        title: "Staff Added",
        description: "Staff member successfully added to your company.",
      });
      
      setSuccessData({ 
        password: newStaff.defaultPassword || undefined,
        email: formData.email 
      });
      
      onSuccess();
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
      title="Create Staff Account" 
      subtitle="Add a new member to your workforce."
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mx-auto mb-6 shadow-sm border border-violet-200">
          <UserPlus className="w-8 h-8" />
        </div>
        
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. John Doe" 
              className="w-full h-11 pl-10 pr-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 transition-colors" 
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. john@example.com" 
              className="w-full h-11 pl-10 pr-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 transition-colors" 
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +855 12 345 678" 
              className="w-full h-11 pl-10 pr-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 transition-colors" 
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Job Role</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select 
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-11 pl-10 pr-8 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 appearance-none transition-colors"
            >
              <option value="cleaner">Cleaning Specialist</option>
              <option value="plumber">Plumber</option>
              <option value="electrician">Electrician</option>
              <option value="technician">AC Technician</option>
              <option value="driver">Driver</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Staff Account"}
          </button>
        </div>
      </form>

      {successData && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-sm border border-emerald-200">
            <UserPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Account Created!</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-[280px]">
            {successData.password 
              ? "Share these login details securely with your new staff member."
              : "They were successfully linked to your company."}
          </p>

          <div className="w-full bg-muted border border-border rounded-xl p-4 mb-8 text-left space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Login Email</p>
              <p className="font-medium text-foreground">{successData.email}</p>
            </div>
            {successData.password && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Temporary Password</p>
                <div className="flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 mt-1">
                  <p className="font-mono text-sm font-medium text-foreground">{successData.password}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(successData.password!);
                      toast({ title: "Copied!", description: "Password copied to clipboard." });
                    }}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-100 px-2 py-1 rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setSuccessData(null);
              setFormData({ fullName: "", email: "", phone: "", role: "cleaner" });
              onClose();
            }}
            className="w-full h-11 flex items-center justify-center rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-all"
          >
            Done
          </button>
        </div>
      )}
    </BaseDrawer>
  );
}
