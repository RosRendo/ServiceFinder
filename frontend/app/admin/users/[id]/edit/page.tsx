"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Shield, Save, Loader2, Info, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EditUserPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", role: "customer", avatar: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, { headers });
        if (!res.ok) throw new Error("User not found");
        
        const resData = await res.json();
        const user = resData.data?.user || resData.data || resData;

        setFormData({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          role: user.role || "customer",
          avatar: user.avatar || "",
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setFormData((prev) => ({ ...prev, avatar: data.url || data.data?.url }));
        toast.success("Avatar uploaded");
      }
      else throw new Error("Upload failed");
    } catch (err) { 
      console.error("Upload failed", err);
      toast.error("File upload failed");
    } finally { 
      setUploading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to update user");
      
      toast.success("User updated successfully");
      router.push(`/admin/users/${id}`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, name: string, type = "text", required = false, icon?: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}{required && " *"}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          required={required} type={type} name={name} value={(formData as any)[name]}
          onChange={handleChange}
          className={`w-full ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors`}
        />
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pb-20 bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:h-16 gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="h-9 w-9 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Edit User</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium flex items-center gap-2">
            <Info className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">User Details</h2>
          </div>
          
          <div className="p-5 space-y-6">
            
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 rounded-full border border-gray-200 bg-gray-50">
                {formData.avatar && <AvatarImage src={formData.avatar} alt={formData.fullName} />}
                <AvatarFallback className="text-xl text-indigo-700 bg-indigo-50 font-semibold">
                  {formData.fullName?.split(" ").map((n) => n[0]).join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors text-gray-700">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading..." : "Upload New Avatar"}
                </label>
                <p className="text-[11px] text-gray-500 mt-2">Square image, recommended size 256x256px.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("Full Name", "fullName", "text", true, <User className="w-3.5 h-3.5" />)}
              {field("Email", "email", "email", false, <Mail className="w-3.5 h-3.5" />)}
              {field("Phone", "phone", "text", false, <Phone className="w-3.5 h-3.5" />)}
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Role *</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                  <select
                    name="role" value={formData.role} onChange={handleChange} required
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors appearance-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
}
