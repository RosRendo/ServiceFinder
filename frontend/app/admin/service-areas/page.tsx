"use client";

import { useState } from "react";
import { Map, MapPin, Plus, Check, X, Edit2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ServiceAreaDrawer, ServiceAreaRecord } from "@/components/drawers/ServiceAreaDrawer";

export default function AdminServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceAreaRecord[]>([
    { id: "1", name: "Khan Chamkarmon", city: "Phnom Penh", coverageRadiusKm: 12, status: "active", baseDeliveryFee: 3.5, surgeMultiplier: 1.0, notes: "Central district coverage" },
    { id: "2", name: "Khan Daun Penh", city: "Phnom Penh", coverageRadiusKm: 10, status: "active", baseDeliveryFee: 3.0, surgeMultiplier: 1.0, notes: "High contractor density" },
    { id: "3", name: "Khan Tuol Kouk", city: "Phnom Penh", coverageRadiusKm: 14, status: "active", baseDeliveryFee: 3.5, surgeMultiplier: 1.1, notes: "Residential corridor" },
    { id: "4", name: "Siem Reap Central", city: "Siem Reap", coverageRadiusKm: 20, status: "active", baseDeliveryFee: 4.0, surgeMultiplier: 1.0, notes: "Tourism and hospitality zone" },
    { id: "5", name: "Battambang Town", city: "Battambang", coverageRadiusKm: 18, status: "pending", baseDeliveryFee: 4.5, surgeMultiplier: 1.0, notes: "New regional expansion" },
  ]);

  const [activeArea, setActiveArea] = useState<ServiceAreaRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setActiveArea(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (area: ServiceAreaRecord) => {
    setActiveArea(area);
    setDrawerOpen(true);
  };

  const handleSaveArea = (data: Partial<ServiceAreaRecord>) => {
    setIsSaving(true);
    setTimeout(() => {
      if (activeArea?.id) {
        setAreas(prev => prev.map(a => a.id === activeArea.id ? { ...a, ...data } as ServiceAreaRecord : a));
        toast.success(`Service area "${data.name}" updated successfully.`);
      } else {
        const newArea: ServiceAreaRecord = {
          id: String(Date.now()),
          name: data.name || "New Zone",
          city: data.city || "Phnom Penh",
          coverageRadiusKm: data.coverageRadiusKm || 15,
          status: data.status || "active",
          baseDeliveryFee: data.baseDeliveryFee ?? 3.5,
          surgeMultiplier: data.surgeMultiplier ?? 1.0,
          notes: data.notes || "",
        };
        setAreas(prev => [newArea, ...prev]);
        toast.success(`New service area "${newArea.name}" created.`);
      }
      setIsSaving(false);
      setDrawerOpen(false);
    }, 300);
  };

  const toggleStatus = (id: string | number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    setAreas(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === "active" ? "inactive" : "active";
        toast.success(`Zone ${a.name} is now ${nextStatus}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans bg-background text-foreground">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Service Coverage & Territory Management</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Define geographical service boundaries, delivery surcharge tiers, and operational dispatch zones.</p>
        </div>
        <Button 
          onClick={handleOpenCreate}
          className="rounded-lg h-8.5 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Operational Zone
        </Button>
      </div>

      {/* Territory Grid */}
      <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4.5 border-b border-border/60 bg-background/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Active Service Territories ({areas.length})</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click any row to inspect operating radius, surge rules, and boundaries.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-background border-b border-border text-muted-foreground">
              <tr>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Territory Name</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Municipality</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Coverage Radius</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Base Surcharge</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Surge Multiplier</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Status</th>
                <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {areas.map((a) => (
                <tr 
                  key={a.id} 
                  onClick={() => handleOpenEdit(a)}
                  className="hover:bg-background transition-colors cursor-pointer"
                >
                  <td className="px-4.5 py-3 font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                    {a.name}
                  </td>
                  <td className="px-4.5 py-3 text-muted-foreground font-medium">{a.city}</td>
                  <td className="px-4.5 py-3 text-right text-foreground/90 font-semibold">{a.coverageRadiusKm} km</td>
                  <td className="px-4.5 py-3 text-right text-foreground font-semibold">${Number(a.baseDeliveryFee ?? 3.5).toFixed(2)}</td>
                  <td className="px-4.5 py-3 text-right text-foreground/90 font-mono font-medium">{Number(a.surgeMultiplier ?? 1.0).toFixed(1)}x</td>
                  <td className="px-4.5 py-3">
                    <button
                      onClick={(e) => toggleStatus(a.id, e)}
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                        a.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
                        a.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                        'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {a.status}
                    </button>
                  </td>
                  <td className="px-4.5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(a)}
                      className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1 text-muted-foreground/70" /> Configure
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Territory Drawer */}
      <ServiceAreaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        area={activeArea}
        onSave={handleSaveArea}
        isSaving={isSaving}
      />
    </div>
  );
}
