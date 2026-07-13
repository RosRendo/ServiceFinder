"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Map, Save, Loader2, Info, UploadCloud, Briefcase, Clock } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

export default function EditCompanyPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    name: "", description: "", address: "", city: "", phone: "", email: "",
    logoUrl: "", registrationNumber: "", latitude: "", longitude: "", 
    coverImageUrl: "", verificationDocumentUrl: "", establishedYear: "", 
    cardHighlights: "", detailHighlights: "",
  });

  const [services, setServices] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch company details
        const companyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${id}`, { headers });
        if (!companyRes.ok) throw new Error("Company not found");
        
        const resData = await companyRes.json();
        const company = resData.data?.company || resData.data || resData;

        // Fetch service types for the dropdown
        const typesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/service-types`);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setServiceTypes(typesData.data || []);
        }

        setFormData({
          name: company.name || "",
          description: company.description || "",
          address: company.address || "",
          city: company.city || "",
          phone: company.phone || "",
          email: company.email || "",
          logoUrl: company.logoUrl || "",
          registrationNumber: company.registrationNumber || "",
          latitude: company.latitude?.toString() || "",
          longitude: company.longitude?.toString() || "",
          coverImageUrl: company.coverImageUrl || "",
          verificationDocumentUrl: company.verificationDocumentUrl || "",
          establishedYear: company.establishedYear?.toString() || "",
          cardHighlights: Array.isArray(company.cardHighlights) ? company.cardHighlights.join(", ") : "",
          detailHighlights: Array.isArray(company.detailHighlights) ? company.detailHighlights.join(", ") : "",
        });

        if (Array.isArray(company.services)) {
          setServices(company.services.map((s: any) => ({
            id: s.id,
            name: s.name || "",
            typeId: s.serviceTypeId || "",
            basePrice: s.basePrice || "",
            durationMin: s.durationMin || "",
            description: s.description || "",
          })));
        }
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company details");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    const newServices = [...services];
    newServices[index][field] = value;
    setServices(newServices);
  };

  const addService = () => {
    setServices([...services, { name: "", typeId: "", basePrice: "", durationMin: "", description: "" }]);
  };

  const removeService = (index: number) => {
    const newServices = [...services];
    newServices.splice(index, 1);
    setServices(newServices);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (res.ok) setFormData((prev) => ({ ...prev, [fieldName]: data.url || data.data?.url }));
      else throw new Error("Upload failed");
    } catch (err) { 
      console.error("Upload failed", err);
      toast.error("File upload failed");
    } finally { 
      setUploading((prev) => ({ ...prev, [fieldName]: false })); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...formData,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
      cardHighlights: formData.cardHighlights ? formData.cardHighlights.split(',').map((s) => s.trim()).filter(Boolean) : [],
      detailHighlights: formData.detailHighlights ? formData.detailHighlights.split(',').map((s) => s.trim()).filter(Boolean) : [],
      services: services.filter(s => s.name && s.typeId).map((s) => ({
        id: s.id,
        name: s.name,
        typeId: Number(s.typeId),
        basePrice: Number(s.basePrice) || 0,
        durationMin: Number(s.durationMin) || 60,
        description: s.description,
      })),
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to update company");
      
      toast.success("Company updated successfully");
      router.push(`/admin/companies/${id}`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, name: string, type = "text", placeholder = "", required = false, icon?: React.ReactNode) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}{required && " *"}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          required={required} type={type} name={name} value={(formData as any)[name]}
          onChange={handleChange} placeholder={placeholder}
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
                <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Edit Company</h1>
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
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">Company Profile</h2>
          </div>
          
          <div className="p-5 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Logo Upload */}
              <div className="p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden mb-3">
                  {formData.logoUrl ? <Image src={formData.logoUrl} alt="Logo" width={48} height={48} className="w-full h-full object-cover" /> : <Building2 className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="text-sm font-medium text-gray-700">Logo</div>
                <label className="mt-2 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors text-gray-700">
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "logoUrl")} accept="image/*" />
                  {uploading["logoUrl"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {uploading["logoUrl"] ? "Uploading..." : "Upload Logo"}
                </label>
              </div>

              {/* Cover Upload */}
              <div className="p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden mb-3">
                  {formData.coverImageUrl ? <Image src={formData.coverImageUrl} alt="Cover" width={64} height={48} className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="text-sm font-medium text-gray-700">Cover Image</div>
                <label className="mt-2 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors text-gray-700">
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "coverImageUrl")} accept="image/*" />
                  {uploading["coverImageUrl"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {uploading["coverImageUrl"] ? "Uploading..." : "Upload Cover"}
                </label>
              </div>

              {/* Document Upload */}
              <div className="p-4 border border-dashed border-gray-200 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden mb-3">
                  {formData.verificationDocumentUrl ? <Info className="w-5 h-5 text-emerald-500" /> : <Briefcase className="w-5 h-5 text-gray-300" />}
                </div>
                <div className="text-sm font-medium text-gray-700">Verification Doc</div>
                <label className="mt-2 cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors text-gray-700">
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "verificationDocumentUrl")} />
                  {uploading["verificationDocumentUrl"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {uploading["verificationDocumentUrl"] ? "Uploading..." : "Upload Document"}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("Company Name", "name", "text", "Acme Services", true, <Building2 className="w-3.5 h-3.5" />)}
              {field("Company Email", "email", "email", "support@acme.com", false, <Mail className="w-3.5 h-3.5" />)}
              {field("Company Phone", "phone", "text", "+855 XX XXX XXXX", false, <Phone className="w-3.5 h-3.5" />)}
              {field("City", "city", "text", "Phnom Penh", false, <Map className="w-3.5 h-3.5" />)}
              {field("Registration No.", "registrationNumber", "text", "REG-839201", false, <Briefcase className="w-3.5 h-3.5" />)}
              {field("Established Year", "establishedYear", "number", "2015", false, <Clock className="w-3.5 h-3.5" />)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("Latitude", "latitude", "number", "11.5564", false, <MapPin className="w-3.5 h-3.5" />)}
              {field("Longitude", "longitude", "number", "104.9282", false, <MapPin className="w-3.5 h-3.5" />)}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400" />
                <textarea
                  name="address" value={formData.address} onChange={handleChange} rows={2}
                  placeholder="123 Business Ave..." 
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <div className="relative">
                <textarea
                  name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="Tell us about the company..." 
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Card Highlights (Comma-separated)</label>
                <input
                  type="text" name="cardHighlights" value={formData.cardHighlights} onChange={handleChange}
                  placeholder="Certified, Fast Service"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Detail Highlights (Comma-separated)</label>
                <input
                  type="text" name="detailHighlights" value={formData.detailHighlights} onChange={handleChange}
                  placeholder="24/7 Support, Eco-friendly"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-semibold text-gray-900">Services</h2>
            </div>
            <button type="button" onClick={addService} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors">
              + Add Service
            </button>
          </div>
          
          <div className="p-5 space-y-6">
            {services.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No services added yet. Click "Add Service" to start.</div>
            ) : (
              services.map((service, index) => (
                <div key={index} className="relative p-5 border border-gray-100 bg-gray-50/50 rounded-lg space-y-4">
                  <div className="absolute top-4 right-4">
                    <button type="button" onClick={() => removeService(index)} className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">
                      Remove
                    </button>
                  </div>

                  <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">Service #{index + 1}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Service Name *</label>
                      <input
                        required type="text" value={service.name} onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        placeholder="e.g. Standard House Cleaning"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Service Category *</label>
                      <select
                        required value={service.typeId} onChange={(e) => handleServiceChange(index, "typeId", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors appearance-none"
                      >
                        <option value="">Select a category...</option>
                        {Array.isArray(serviceTypes) && serviceTypes.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Base Price ($)</label>
                      <input
                        type="number" value={service.basePrice} onChange={(e) => handleServiceChange(index, "basePrice", e.target.value)}
                        placeholder="45"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Duration (Minutes)</label>
                      <input
                        type="number" value={service.durationMin} onChange={(e) => handleServiceChange(index, "durationMin", e.target.value)}
                        placeholder="60"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-600">Service Description</label>
                    <textarea
                      value={service.description} onChange={(e) => handleServiceChange(index, "description", e.target.value)} rows={2}
                      placeholder="Describe what is included in this service..." 
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-colors"
                    />
                  </div>
                </div>
              ))
            )}
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
