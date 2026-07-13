"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, User, Mail, Lock, Phone, MapPin, Map, Save, Loader2, Info, UploadCloud, Briefcase, Clock, DollarSign } from "lucide-react";
import Image from "next/image";

export default function AddCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

  const [formData, setFormData] = useState({
    ownerName: "", ownerEmail: "", ownerPassword: "", ownerPhone: "",
    companyName: "", companyDescription: "", companyAddress: "", companyCity: "", companyPhone: "", companyEmail: "",
    logoUrl: "", registrationNumber: "", latitude: "", longitude: "", coverImageUrl: "", verificationDocumentUrl: "", establishedYear: "", cardHighlights: "", detailHighlights: "",
  });

  const [services, setServices] = useState<{ name: string; typeId: string; basePrice: string; durationMin: string; description: string }[]>([]);

  useEffect(() => { fetchServiceTypes(); }, []);

  const fetchServiceTypes = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/service-types`);
      if (res.ok) {
        const json = await res.json();
        let list: any[] = [];
        const payload = json?.data ?? json;
        if (Array.isArray(payload)) list = payload;
        else if (Array.isArray(payload?.data)) list = payload.data;
        setServiceTypes(list);
      }
    } catch (err) { console.error("Failed to fetch service types", err); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    } catch (err) { console.error("Upload failed", err); }
    finally { setUploading((prev) => ({ ...prev, [fieldName]: false })); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      ...formData,
      establishedYear: formData.establishedYear ? Number(formData.establishedYear) : undefined,
      cardHighlights: formData.cardHighlights ? formData.cardHighlights.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      detailHighlights: formData.detailHighlights ? formData.detailHighlights.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      services: services.filter(s => s.name && s.typeId).map(s => ({
        name: s.name,
        typeId: Number(s.typeId),
        basePrice: s.basePrice ? Number(s.basePrice) : undefined,
        durationMin: s.durationMin ? Number(s.durationMin) : undefined,
        description: s.description || undefined
      })),
    };
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create company");
      router.push("/admin/companies");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors`}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add New Company</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create an owner account, company profile, and initial service</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section: Owner */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">Owner Details</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {field("Full Name", "ownerName", "text", "John Doe", true, <User className="w-3.5 h-3.5" />)}
            {field("Email Address", "ownerEmail", "email", "john@example.com", true, <Mail className="w-3.5 h-3.5" />)}
            {field("Password", "ownerPassword", "password", "Min. 6 characters", true, <Lock className="w-3.5 h-3.5" />)}
            {field("Phone Number", "ownerPhone", "text", "+855 XX XXX XXXX", false, <Phone className="w-3.5 h-3.5" />)}
          </div>
        </div>

        {/* Section: Company */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-900">Company Profile</h2>
          </div>
          <div className="p-5 space-y-4">

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
                  {formData.verificationDocumentUrl ? <Info className="w-5 h-5 text-green-500" /> : <Briefcase className="w-5 h-5 text-gray-300" />}
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
              {field("Company Name", "companyName", "text", "Acme Services", true, <Building2 className="w-3.5 h-3.5" />)}
              {field("Company Email", "companyEmail", "email", "support@acme.com", false, <Mail className="w-3.5 h-3.5" />)}
              {field("Company Phone", "companyPhone", "text", "+855 XX XXX XXXX", false, <Phone className="w-3.5 h-3.5" />)}
              {field("City", "companyCity", "text", "Phnom Penh", false, <Map className="w-3.5 h-3.5" />)}
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
                  name="companyAddress" value={formData.companyAddress} onChange={handleChange} rows={2}
                  placeholder="123 Business Ave..." 
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Card Highlights (Comma-separated)</label>
                <input
                  type="text" name="cardHighlights" value={formData.cardHighlights} onChange={handleChange}
                  placeholder="Certified, Fast Service"
                  className="w-full pl-3 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Detail Highlights (Comma-separated)</label>
                <input
                  type="text" name="detailHighlights" value={formData.detailHighlights} onChange={handleChange}
                  placeholder="24/7 Support, Eco-friendly"
                  className="w-full pl-3 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Initial Services */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Initial Services <span className="text-gray-400 font-normal">(Optional)</span></h2>
            </div>
            <button
              type="button"
              onClick={() => setServices([...services, { name: "", typeId: "", basePrice: "", durationMin: "60", description: "" }])}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
            >
              + Add Service
            </button>
          </div>
          
          {services.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No services added yet. Click "+ Add Service" to include services during creation.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {services.map((svc, index) => (
                <div key={index} className="p-5 relative group">
                  <button
                    type="button"
                    onClick={() => setServices(services.filter((_, i) => i !== index))}
                    className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Service"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Service Category *</label>
                      <select
                        required
                        value={svc.typeId}
                        onChange={(e) => {
                          const newServices = [...services];
                          newServices[index].typeId = e.target.value;
                          setServices(newServices);
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                      >
                        <option value="">Select a category</option>
                        {serviceTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Service Name *</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          required
                          type="text"
                          value={svc.name}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].name = e.target.value;
                            setServices(newServices);
                          }}
                          placeholder="e.g. Deep Cleaning"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Base Price ($)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="number"
                          value={svc.basePrice}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].basePrice = e.target.value;
                            setServices(newServices);
                          }}
                          placeholder="49.99"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Duration (min)</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="number"
                          value={svc.durationMin}
                          onChange={(e) => {
                            const newServices = [...services];
                            newServices[index].durationMin = e.target.value;
                            setServices(newServices);
                          }}
                          placeholder="60"
                          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-gray-600">Service Description</label>
                      <textarea
                        rows={2}
                        value={svc.description}
                        onChange={(e) => {
                          const newServices = [...services];
                          newServices[index].description = e.target.value;
                          setServices(newServices);
                        }}
                        placeholder="Describe what this service includes..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white resize-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            Cancel
          </button>
          <button
            type="submit" disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Company"}
          </button>
        </div>

      </form>
    </div>
  );
}
