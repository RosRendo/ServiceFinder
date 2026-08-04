"use client";

import { useState } from "react";
import { BaseDrawer } from "./BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";
import { UserPlus, Loader2, Mail, Phone, User, Key } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      title="Create New User"
      subtitle="Add a new user manually to the platform."
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mx-auto mb-6 shadow-sm border border-violet-200">
          <UserPlus className="w-8 h-8" />
        </div>
        
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password *</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="Min 8 characters"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
              placeholder="+1 555-0123"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role</label>
          <select
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10 transition-all"
          >
            <option value="customer">Customer</option>
            <option value="staff">Staff</option>
            <option value="company_admin">Company Admin</option>
            <option value="admin">Platform Admin</option>
          </select>
        </div>

        <div className="pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </BaseDrawer>
  );
}
