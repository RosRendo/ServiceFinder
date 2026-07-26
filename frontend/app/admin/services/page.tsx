"use client";

import { useState } from "react";
import { Search, Plus, ToggleLeft, ToggleRight, Layers } from "lucide-react";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { useToast } from "@/lib/hooks/use-toast";

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  basePrice: string;
  active: boolean;
  bookings: number;
  icon: string;
}

const ALL_SERVICES: ServiceItem[] = [
  { id: "1", name: "Deep Cleaning", category: "Cleaning", basePrice: "$35/hr", active: true, bookings: 284, icon: "🧹" },
  { id: "2", name: "AC Repair", category: "Appliance", basePrice: "$60 flat", active: true, bookings: 156, icon: "❄️" },
  { id: "3", name: "Plumbing", category: "Maintenance", basePrice: "$45/hr", active: true, bookings: 98, icon: "🔧" },
  { id: "4", name: "Electrical", category: "Maintenance", basePrice: "$55/hr", active: true, bookings: 74, icon: "⚡" },
  { id: "5", name: "Pest Control", category: "Cleaning", basePrice: "$80 flat", active: false, bookings: 42, icon: "🐛" },
  { id: "6", name: "Painting", category: "Renovation", basePrice: "$40/hr", active: true, bookings: 31, icon: "🎨" },
  { id: "7", name: "Lawn Care", category: "Outdoor", basePrice: "$30/hr", active: false, bookings: 22, icon: "🌿" },
  { id: "8", name: "Pool Cleaning", category: "Outdoor", basePrice: "$70 flat", active: true, bookings: 18, icon: "🏊" },
];

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [services, setServices] = useState(ALL_SERVICES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<ServiceItem | null>(null);
  const { toast } = useToast();

  const filtered = services.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleService = (id: string) => {
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">Service Catalog</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{services.filter((s) => s.active).length} active · {services.filter((s) => !s.active).length} inactive</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..."
              className="pl-9 pr-3 h-9 w-56 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
          </div>
          <button 
            onClick={() => {
              setActive(null);
              setDrawerOpen(true);
            }}
            className="flex items-center gap-2 h-9 px-3 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service
          </button>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((service) => (
          <div
            key={service.id}
            onClick={() => { setActive(service); setDrawerOpen(true); }}
            className="bg-background border border-border rounded-xl p-5 cursor-pointer hover:border-violet-500/40 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{service.icon}</div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleService(service.id); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {service.active
                  ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                  : <ToggleLeft className="w-6 h-6 text-muted-foreground/50" />
                }
              </button>
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{service.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{service.category}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-violet-400">{service.basePrice}</span>
              <span className="text-xs text-muted-foreground">{service.bookings} bookings</span>
            </div>
            {!service.active && (
              <div className="mt-3 text-[10px] font-semibold text-red-400 bg-red-400/10 rounded-lg px-2 py-1 text-center">Inactive — Hidden from app</div>
            )}
          </div>
        ))}

        {/* Add new card */}
        <div 
          onClick={() => {
            setActive(null);
            setDrawerOpen(true);
          }}
          className="border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-violet-500/40 transition-colors group min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground group-hover:text-violet-400" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground">Add Service</span>
        </div>
      </div>

      {/* Service Edit Drawer */}
      <BaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        title={active?.name ?? "Create New Service"} subtitle={active ? `${active.category} · ${active.bookings} bookings` : "Configure a new service offering"}>
        <div className="p-6 space-y-5">
          <div className="text-6xl text-center py-4">{active?.icon ?? "✨"}</div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Service Name</label>
            <input defaultValue={active?.name ?? ""} placeholder="e.g. Deep Cleaning" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Category</label>
            <input defaultValue={active?.category ?? ""} placeholder="e.g. Cleaning" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Base Price</label>
            <input defaultValue={active?.basePrice ?? ""} placeholder="e.g. $50/hr" className="w-full h-10 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea rows={3} placeholder="Describe this service..." className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground outline-none focus:border-violet-500/60 resize-none" />
          </div>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Visible in app</p>
              <p className="text-xs text-muted-foreground">Customers can book this service</p>
            </div>
            <button onClick={() => active && toggleService(active.id)} className="text-muted-foreground hover:text-foreground">
              {(active?.active ?? true) ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground/50" />}
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              toast({ title: active ? "Service Updated" : "Service Created", description: "Changes have been saved." });
              setDrawerOpen(false);
            }} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">Save Changes</button>
            {active && (
              <button onClick={() => {
                toast({ title: "Service Deleted", variant: "destructive" });
                setDrawerOpen(false);
              }} className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">Delete</button>
            )}
          </div>
        </div>
      </BaseDrawer>
    </div>
  );
}
