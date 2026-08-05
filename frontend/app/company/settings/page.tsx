"use client";

import { useState, useEffect } from "react";
import { Save, MapPin, Clock, Upload, Building2, Loader2, Landmark, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";

const CoverageMap = dynamic(() => import("@/components/map/CoverageMap"), { ssr: false });

type Tab = "profile" | "hours" | "bank" | "coverage" | "operations";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Company Profile", icon: Building2 },
  { key: "hours", label: "Business Hours", icon: Clock },
  { key: "bank", label: "Bank Details", icon: Landmark },
  { key: "coverage", label: "Coverage Area", icon: MapPin },
  { key: "operations", label: "Operations", icon: Settings2 },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function CompanySettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [bookingMode, setBookingMode] = useState<"dispatch" | "open_pool">("dispatch");
  const [savingMode, setSavingMode] = useState(false);

  const [companyId, setCompanyId] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    city: "Phnom Penh",
    latitude: "11.5564",
    longitude: "104.9282",
    coverageRadiusKm: 15,
    bankAccountName: "",
    bankName: "ABA Bank",
    bankAccountNumber: "",
    verificationDocumentUrl: "",
  });

  const [hours, setHours] = useState(
    DAYS.reduce((acc: any, d: any) => ({ ...acc, [d]: { open: d !== "Sunday", from: "09:00", to: "18:00" } }), {} as Record<string, { open: boolean; from: string; to: string }>)
  );

  const fetchCompanyDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get("/companies/my-company");
      const company = res.data.data || res.data;
      if (company) {
        setCompanyId(company.id.toString());
        
        // Read radius from first service area if exists
        const radius = company.serviceAreas?.[0]?.coverageRadiusKm || 15;
        
        setBookingMode((company.bookingMode as any) || "dispatch");
        setForm({
          name: company.name || "",
          description: company.description || "",
          phone: company.phone || "",
          email: company.email || "",
          address: company.address || "",
          city: company.city || "Phnom Penh",
          latitude: company.latitude?.toString() || "11.5564",
          longitude: company.longitude?.toString() || "104.9282",
          coverageRadiusKm: Number(radius),
          bankAccountName: company.bankAccountName || "",
          bankName: company.bankName || "ABA Bank",
          bankAccountNumber: company.bankAccountNumber || "",
          verificationDocumentUrl: company.verificationDocumentUrl || "",
        });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load company settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const handleUpdateField = (key: keyof typeof form, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await api.put(`/companies/${companyId}`, {
        ...form,
        // Convert coords to string for DTO validation
        latitude: form.latitude.toString(),
        longitude: form.longitude.toString(),
        coverageRadiusKm: Number(form.coverageRadiusKm),
      });
      toast({ title: "Success", description: "Company settings updated successfully" });
      fetchCompanyDetails();
    } catch {
      toast({ title: "Error", description: "Failed to save company settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBookingMode = async (mode: "dispatch" | "open_pool") => {
    if (!companyId) return;
    setBookingMode(mode);
    setSavingMode(true);
    try {
      await api.put(`/companies/${companyId}`, { bookingMode: mode });
      toast({ title: "Saved", description: `Booking mode set to ${mode === "dispatch" ? "Dispatch" : "Open Pool"}` });
    } catch {
      toast({ title: "Error", description: "Failed to save booking mode", variant: "destructive" });
    } finally {
      setSavingMode(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden p-6 gap-6">
      {/* Left tabs */}
      <div className="w-52 shrink-0 border border-border bg-card rounded-xl p-3 flex flex-col gap-1">
        <h3 className="px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Portal Settings</h3>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-colors",
              tab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 border border-border bg-card rounded-xl flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            <div className="max-w-2xl flex-1 space-y-6">
              {tab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Company Profile</h2>
                    <p className="text-sm text-muted-foreground">Manage how your company appears to prospective customers.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-5 pb-4 border-b border-border/60">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-bold shrink-0 border border-primary/20">
                        {form.name?.[0] || "A"}
                      </div>
                      <div>
                        <button className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors">
                          <Upload className="w-3.5 h-3.5" /> Upload Logo
                        </button>
                        <p className="text-[10px] text-muted-foreground mt-1">PNG or JPG, max 2MB</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyName">Company Name</Label>
                      <input 
                        id="companyName" 
                        value={form.name} 
                        onChange={e => handleUpdateField("name", e.target.value)}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="companyDesc">Description</Label>
                      <textarea 
                        id="companyDesc" 
                        rows={3} 
                        value={form.description} 
                        onChange={e => handleUpdateField("description", e.target.value)}
                        className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary resize-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="companyPhone">Phone</Label>
                        <input 
                          id="companyPhone" 
                          value={form.phone} 
                          onChange={e => handleUpdateField("phone", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="companyEmail">Email</Label>
                        <input 
                          id="companyEmail" 
                          value={form.email} 
                          onChange={e => handleUpdateField("email", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60 mt-4">
                      <Label htmlFor="verificationDoc">Verification Document URL (PDF / Image link)</Label>
                      <input 
                        id="verificationDoc" 
                        value={form.verificationDocumentUrl} 
                        onChange={e => handleUpdateField("verificationDocumentUrl", e.target.value)}
                        placeholder="https://example.com/my-license.pdf"
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Upload a link to your Business Registration or Identity Document to get Verified.</p>
                    </div>
                  </div>
                </div>
              )}

              {tab === "hours" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Business Hours</h2>
                    <p className="text-sm text-muted-foreground">Adjust shifts matching booking availabilities.</p>
                  </div>
                  <div className="space-y-2.5">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setHours((h: any) => ({ ...h, [day]: { ...h[day], open: !h[day].open } }))}
                            className={cn("w-10 h-6 rounded-full transition-colors relative shrink-0",
                              hours[day].open ? "bg-primary" : "bg-muted-foreground/30")}>
                            <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background transition-transform shadow-sm",
                              hours[day].open && "translate-x-4")} />
                          </button>
                          <span className={cn("text-sm font-semibold w-24 shrink-0", hours[day].open ? "text-foreground" : "text-muted-foreground")}>{day}</span>
                        </div>
                        {hours[day].open ? (
                          <div className="flex items-center gap-2">
                            <input type="time" defaultValue={hours[day].from}
                              className="h-8 px-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary" />
                            <span className="text-muted-foreground text-xs">to</span>
                            <input type="time" defaultValue={hours[day].to}
                              className="h-8 px-2 bg-muted/20 border border-border rounded-lg text-xs text-foreground outline-none focus:border-primary" />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-muted-foreground/50 uppercase">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "bank" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Bank Account details</h2>
                    <p className="text-sm text-muted-foreground">Earnings payouts are deposited directly to this account.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <select 
                        value={form.bankName} 
                        onChange={e => handleUpdateField("bankName", e.target.value)}
                        className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none"
                      >
                        <option value="ABA Bank">ABA Bank</option>
                        <option value="ACLEDA Bank">ACLEDA Bank</option>
                        <option value="Wing Bank">Wing Bank</option>
                        <option value="Canadia Bank">Canadia Bank</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="acctName">Account Holder Name</Label>
                        <input 
                          id="acctName" 
                          value={form.bankAccountName} 
                          onChange={e => handleUpdateField("bankAccountName", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="acctNum">Account Number</Label>
                        <input 
                          id="acctNum" 
                          value={form.bankAccountNumber} 
                          onChange={e => handleUpdateField("bankAccountNumber", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "coverage" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Interactive Geofencing Circle</h2>
                    <p className="text-sm text-muted-foreground">Visual coverage bounds matching search results around your coordinates.</p>
                  </div>

                  <div className="h-64 border border-border bg-muted/10 rounded-2xl flex items-center justify-center relative overflow-hidden z-0">
                    <CoverageMap 
                      lat={parseFloat(form.latitude) || 11.5564}
                      lng={parseFloat(form.longitude) || 104.9282}
                      radiusKm={form.coverageRadiusKm}
                      onChange={(lat, lng) => {
                        handleUpdateField("latitude", lat.toFixed(6));
                        handleUpdateField("longitude", lng.toFixed(6));
                      }}
                    />
                    <div className="absolute bottom-3 left-3 bg-background border border-border rounded-lg p-2 shadow-sm text-[10px] font-medium text-muted-foreground z-[1000]">
                      Lat: {form.latitude} <br />
                      Lng: {form.longitude}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="covRadius">Coverage Limit (Radius)</Label>
                        <span className="text-sm font-bold text-primary">{form.coverageRadiusKm} km</span>
                      </div>
                      <input 
                        id="covRadius" 
                        type="range"
                        min="5" 
                        max="100" 
                        value={form.coverageRadiusKm} 
                        onChange={e => handleUpdateField("coverageRadiusKm", Number(e.target.value))}
                        className="w-full accent-violet-600" 
                      />
                      <p className="text-xs text-muted-foreground">Drag to increase your operational coverage. Jobs outside this radius will be blocked.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="hqLat">HQ Latitude</Label>
                        <input 
                          id="hqLat" 
                          value={form.latitude} 
                          onChange={e => handleUpdateField("latitude", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="hqLng">HQ Longitude</Label>
                        <input 
                          id="hqLng" 
                          value={form.longitude} 
                          onChange={e => handleUpdateField("longitude", e.target.value)}
                          className="w-full h-9 px-3 bg-muted/20 border border-border rounded-lg text-sm text-foreground outline-none focus:border-primary" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "operations" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Operations</h2>
                    <p className="text-sm text-muted-foreground">Control how bookings are assigned to your staff members.</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Booking Assignment Mode</h3>
                    <div className="grid grid-cols-1 gap-3">

                      {/* Dispatch Mode Card */}
                      <button
                        id="mode-dispatch"
                        onClick={() => handleSaveBookingMode("dispatch")}
                        disabled={savingMode}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          bookingMode === "dispatch"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", bookingMode === "dispatch" ? "bg-primary/10" : "bg-muted")}>
                            <Settings2 className={cn("w-5 h-5", bookingMode === "dispatch" ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">Dispatch Mode</span>
                              {bookingMode === "dispatch" && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">You review each incoming booking and manually assign the best available staff member. Full control over who takes each job.</p>
                          </div>
                        </div>
                      </button>

                      {/* Open Pool Mode Card */}
                      <button
                        id="mode-open-pool"
                        onClick={() => handleSaveBookingMode("open_pool")}
                        disabled={savingMode}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          bookingMode === "open_pool"
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/20 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", bookingMode === "open_pool" ? "bg-primary/10" : "bg-muted")}>
                            <MapPin className={cn("w-5 h-5", bookingMode === "open_pool" ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">Open Pool Mode</span>
                              {bookingMode === "open_pool" && <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">New bookings go into a shared job pool. Any available staff member from your company can claim and accept a job directly from their app. Ideal for high-volume, hands-off operations.</p>
                          </div>
                        </div>
                      </button>

                    </div>
                    {savingMode && <p className="text-xs text-muted-foreground animate-pulse">Saving...</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Save Action — hidden on Operations tab since it auto-saves */}
            {tab !== "operations" && (
              <div className="border-t border-border mt-8 pt-4 max-w-2xl flex justify-end shrink-0">
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-white font-bold">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

