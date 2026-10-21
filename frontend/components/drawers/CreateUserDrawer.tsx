"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { UserPlus, Loader2, Mail, Phone, User, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api/client";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserDrawer({ open, onClose, onSuccess }: CreateUserDrawerProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({ title: "Error", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      await api.post("/users", formData);
      toast({
        title: "User Created",
        description: "The user account has been successfully created.",
      });
      setFormData({ fullName: "", email: "", phone: "", password: "", role: "customer" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || err.message || "Failed to create user.",
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
      title="Create User Account"
      subtitle="Provision a new client, technician, or administrator profile."
      headerIcon={UserPlus}
      width="md"
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
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </div>
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
              placeholder="e.g. Sreymom Meas"
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
              placeholder="sreymom@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Temporary Password *</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary text-foreground font-mono"
              placeholder="Min 8 characters"
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
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Platform Role</label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full pl-9 pr-4 h-9 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary appearance-none text-foreground font-medium"
            >
              <option value="customer">Customer Client</option>
              <option value="staff">Staff Technician</option>
              <option value="company_admin">Merchant Admin</option>
              <option value="admin">Platform Superadmin</option>
            </select>
          </div>
        </div>
      </form>
    </BaseDrawer>
  );
}

export default CreateUserDrawer;
