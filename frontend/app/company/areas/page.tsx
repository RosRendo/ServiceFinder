"use client";
import { useState, useEffect } from "react";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Plus, MapPin, MoreVertical, CheckCircle2, Search,
  Edit, Loader2, RefreshCw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const CoverageMap = dynamic(() => import("@/components/map/CoverageMap"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
      <span className="text-xs font-medium">Loading map...</span>
    </div>
  )
});

type ServiceArea = {
  id: string;
  city: string;
  state: string;
  zipCodes: string[];
  coverageRadiusKm: number;
  status: "active" | "inactive";
  bookingsCount: number;
  customersCount: number;
};

export default function Areas() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [newAreaOpen, setNewAreaOpen] = useState(false);
  const [newAreaForm, setNewAreaForm] = useState({ city: "", state: "", zipCodes: "", radius: "" });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/companies/my-company');
      const company = res.data?.data || res.data;
      if (company?.serviceAreas) {
        const mapped = company.serviceAreas.map((a: any) => ({
          id: a.id, city: a.city, state: "N/A",
          zipCodes: [], coverageRadiusKm: a.coverageRadiusKm || 0,
          status: "active", bookingsCount: 0, customersCount: 0,
        }));
        setAreas(mapped);
      }
    } catch (error) {
      setError("Could not load your service areas.");
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = areas.filter(area => {
    const matchesSearch = area.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.zipCodes.some(z => z.includes(searchQuery));
    const matchesStatus = statusFilter === "all" || area.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeAreas = areas.filter(a => a.status === "active").length;

  // Persists via PUT /companies/my-company (backend upserts the company's
  // service area from city + coverageRadiusKm).
  const handleAddArea = async () => {
    if (!newAreaForm.city.trim()) { toast.error("City is required."); return; }
    setSaving(true);
    try {
      await api.put('/companies/my-company', {
        city: newAreaForm.city.trim(),
        coverageRadiusKm: newAreaForm.radius ? Number(newAreaForm.radius) : undefined,
      });
      toast.success("Service area saved!");
      setNewAreaOpen(false);
      setNewAreaForm({ city: "", state: "", zipCodes: "", radius: "" });
      fetchAreas();
    } catch {
      toast.error("Failed to save service area.");
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            setNewAreaForm(prev => ({
              ...prev,
              city: data.address.city || data.address.town || data.address.village || "",
              state: data.address.state || "",
              zipCodes: data.address.postcode || prev.zipCodes
            }));
            toast.success("Location detected!");
          } else {
            toast.error("Could not determine address");
          }
        } catch {
          toast.error("Failed to fetch address details");
        } finally {
          setLocationLoading(false);
        }
      },
      () => { toast.error("Failed to get location."); setLocationLoading(false); }
    );
  };

  return (
    <div className="space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Service Areas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your coverage zones, territories, and geographical reach</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAreas} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-md bg-background hover:bg-muted/50 text-muted-foreground transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Dialog open={newAreaOpen} onOpenChange={setNewAreaOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md h-11 shadow-sm gap-2 font-semibold px-6">
                  <Plus className="w-4 h-4" /> Add Area
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border border-border shadow-xl bg-background sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">Add Service Area</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  <Button type="button" variant="outline" className="w-full gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md h-12 font-bold transition-colors" onClick={handleUseCurrentLocation} disabled={locationLoading}>
                    {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {locationLoading ? "Detecting Location..." : "Use My Current Location"}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                      <span className="bg-background px-3 text-slate-400 rounded-full">Or enter manually</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</Label>
                      <Input id="city" placeholder="Manhattan" value={newAreaForm.city} onChange={(e) => setNewAreaForm({...newAreaForm, city: e.target.value})} className="rounded-md border-border bg-background h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</Label>
                      <Input id="state" placeholder="NY" value={newAreaForm.state} onChange={(e) => setNewAreaForm({...newAreaForm, state: e.target.value})} className="rounded-md border-border bg-background h-11" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zipCodes" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ZIP Codes</Label>
                    <Input id="zipCodes" placeholder="10001, 10002" value={newAreaForm.zipCodes} onChange={(e) => setNewAreaForm({...newAreaForm, zipCodes: e.target.value})} className="rounded-md border-border bg-background h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="radius" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Radius (km)</Label>
                    <Input id="radius" type="number" placeholder="15" value={newAreaForm.radius} onChange={(e) => setNewAreaForm({...newAreaForm, radius: e.target.value})} className="rounded-md border-border bg-background h-11" />
                  </div>

                  {/* Added Coverage Map for better visualization */}
                  <div className="h-[200px] w-full border border-border bg-muted/10 rounded-xl relative overflow-hidden mt-4">
                    <CoverageMap 
                      lat={11.5564} 
                      lng={104.9282}
                      radiusKm={newAreaForm.radius ? Number(newAreaForm.radius) : 15}
                      onChange={(lat, lng) => {
                        // The user can drag the marker to adjust the center
                        // In a real app we might reverse geocode this to a city/state
                      }} 
                    />
                  </div>

                  <Button className="w-full rounded-md h-12 bg-blue-600 hover:bg-blue-700 shadow-sm font-bold text-white mt-4" disabled={saving} onClick={handleAddArea}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {saving ? "Saving..." : "Add Area"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Areas", value: areas.length, sub: "zones", icon: MapPin, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
            { label: "Active", value: activeAreas, sub: "serving customers", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-background rounded-xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">{stat.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border shadow-sm`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-background rounded-xl border border-border shadow-sm p-2 sticky top-4 z-40">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search areas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-muted/50 border-border rounded-xl h-11 shadow-sm" />
            </div>
            <div className="flex bg-muted/50 p-1 rounded-xl border border-border shrink-0">
              {(["all", "active", "inactive"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold capitalize transition-all flex-1 sm:flex-none ${
                    statusFilter === status ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-slate-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="bg-background rounded-xl border border-border p-12 flex justify-center items-center shadow-sm h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <ErrorState title="Couldn't load service areas" message={error} onRetry={fetchAreas} />
        ) : filteredAreas.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl border border-border p-12 text-center shadow-sm h-[400px] flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-muted/50 rounded-xl flex items-center justify-center mb-6 border border-border shadow-sm">
              <MapPin className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">No service areas found</h3>
            <p className="text-muted-foreground text-base mt-2 mb-8 max-w-sm">You haven't defined any service areas yet, or none match your filters.</p>
            <Button onClick={() => setNewAreaOpen(true)} className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm h-11 px-8 font-bold">Add Your First Area</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAreas.map((area, index) => (
                <motion.div 
                  key={area.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-background rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all group ${area.status === "active" ? "border-border" : "border-border opacity-75 grayscale-[0.2]"}`}
                >
                  <div className="p-6 border-b border-border bg-background">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center border shadow-sm ${area.status === "active" ? "bg-blue-50 border-blue-100" : "bg-muted/50 border-border"}`}>
                          <MapPin className={`w-6 h-6 ${area.status === "active" ? "text-blue-600" : "text-slate-400"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-foreground tracking-tight">{area.city}</h3>
                            <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border">{area.state}</span>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground mt-0.5">{area.coverageRadiusKm} km radius</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-foreground hover:bg-background bg-muted/50 border border-transparent hover:border-border transition-all shadow-sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xl min-w-[160px] p-2">
                          <DropdownMenuItem className="rounded-lg font-medium cursor-pointer"><Edit className="w-4 h-4 mr-2 text-muted-foreground" /> Edit Area</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center shadow-sm ${area.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-muted/50 text-muted-foreground border-border"}`}>
                        {area.status === "active" ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Active</> : <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Inactive</>}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center">
                        <p className="text-[10px] font-bold text-muted-foreground font-medium mb-1">Radius</p>
                        <p className="text-xl font-black text-foreground tracking-tight">{area.coverageRadiusKm} km</p>
                      </div>
                      <div className="bg-background p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center">
                        <p className="text-[10px] font-bold text-muted-foreground font-medium mb-1">Coverage</p>
                        <p className="text-xl font-black text-foreground tracking-tight">{area.city}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
    </div>
  );
}

