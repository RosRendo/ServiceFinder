"use client";

import { useState } from "react";
import { Star, Plus, ShieldCheck, Check, Search, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { toast } from "sonner";

interface FeaturedListing {
  id: string;
  companyName: string;
  category: string;
  bidPerClick: number;
  impressions: number;
  clicks: number;
  status: "Active" | "Paused" | "Expired";
}

export default function AdminFeaturedListingsPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<FeaturedListing | null>(null);
  const [newCompany, setNewCompany] = useState("");
  const [newCategory, setNewCategory] = useState("Deep Cleaning");
  const [newBid, setNewBid] = useState("0.85");

  const [listings, setListings] = useState<FeaturedListing[]>([
    { id: "1", companyName: "Phnom Penh Cleaners Ltd", category: "Deep Cleaning", bidPerClick: 0.75, impressions: 14500, clicks: 1200, status: "Active" },
    { id: "2", companyName: "Angkor Aircon Repair", category: "HVAC & Aircon", bidPerClick: 0.90, impressions: 8400, clicks: 950, status: "Active" },
    { id: "3", companyName: "Siem Reap Plumbing Pros", category: "Plumbing repairs", bidPerClick: 0.50, impressions: 3200, clicks: 180, status: "Paused" },
  ]);

  const toggleStatus = (id: string) => {
    setListings(prev => prev.map(l => {
      if (l.id === id) {
        const nextStatus = l.status === "Active" ? "Paused" : "Active";
        toast.success(`Featured campaign for "${l.companyName}" is now ${nextStatus.toLowerCase()}.`);
        return { ...l, status: nextStatus };
      }
      return l;
    }));
  };

  const handleCreateSponsorship = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim()) {
      toast.error("Please enter a company name.");
      return;
    }
    const created: FeaturedListing = {
      id: String(Date.now()),
      companyName: newCompany.trim(),
      category: newCategory,
      bidPerClick: parseFloat(newBid) || 0.75,
      impressions: 0,
      clicks: 0,
      status: "Active",
    };
    setListings([created, ...listings]);
    toast.success(`Sponsored listing for "${created.companyName}" activated.`);
    setIsModalOpen(false);
    setNewCompany("");
  };

  const filtered = listings.filter(l => l.companyName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 font-sans bg-background text-foreground">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-foreground/90" /> Sponsored Listings & Priority Ranking
          </h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">Manage search priority bids, sponsored merchant placements, and impression metrics.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg h-8.5 px-3.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Sponsor Provider
        </Button>
      </div>

      {/* Analytics widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="p-4 bg-background border border-border rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Total Impressions</p>
          <p className="text-xl font-extrabold text-foreground mt-1">
            {listings.reduce((s, l) => s + l.impressions, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-background border border-border rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Total Sponsored Clicks</p>
          <p className="text-xl font-extrabold text-foreground mt-1">
            {listings.reduce((s, l) => s + l.clicks, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-background border border-border rounded-xl shadow-2xs">
          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">Average CTR</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">8.92%</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background border border-border rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/70" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search sponsored merchants..." 
              className="pl-8.5 pr-3 w-full h-8.5 border border-border bg-background rounded-lg text-xs outline-none focus:border-ring" 
            />
          </div>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-background text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Sponsor Provider</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider">Category</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">CPC Bid</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Impressions</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Clicks</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-center">Status</th>
              <th className="px-4.5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((l) => (
              <tr 
                key={l.id} 
                onClick={() => setSelectedListing(l)}
                className="hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <td className="px-4.5 py-3 font-bold text-foreground">{l.companyName}</td>
                <td className="px-4.5 py-3 font-medium text-muted-foreground">{l.category}</td>
                <td className="px-4.5 py-3 text-right font-semibold text-foreground">${l.bidPerClick.toFixed(2)}</td>
                <td className="px-4.5 py-3 text-right text-muted-foreground">{l.impressions.toLocaleString()}</td>
                <td className="px-4.5 py-3 text-right font-bold text-foreground">{l.clicks.toLocaleString()}</td>
                
                <td className="px-4.5 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    l.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    l.status === 'Paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-muted text-muted-foreground border-border'
                  }`}>
                    {l.status}
                  </span>
                </td>

                <td className="px-4.5 py-3 text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(l.id);
                    }} 
                    className="h-7 text-xs font-semibold border-border text-foreground/90 hover:bg-background"
                  >
                    {l.status === 'Active' ? 'Pause' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sponsor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border text-foreground rounded-xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-border/60 bg-background/50">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">Sponsor Service Provider</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Grant elevated placement in user search results and category discovery.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleCreateSponsorship} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Company Name</label>
              <Input
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Master Plumbers Co."
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground/90 outline-none"
                >
                  <option value="Deep Cleaning">Deep Cleaning</option>
                  <option value="HVAC & Aircon">HVAC & Aircon</option>
                  <option value="Plumbing repairs">Plumbing repairs</option>
                  <option value="Electrical Services">Electrical Services</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground/90 uppercase tracking-wider">CPC Bid ($)</label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.10"
                  value={newBid}
                  onChange={(e) => setNewBid(e.target.value)}
                  className="bg-background border-border text-xs font-mono"
                />
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-8.5 text-xs border-border text-foreground/90"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-8.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                Confirm Placement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Featured Campaign Inspection Drawer */}
      <BaseDrawer
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title="Sponsored Merchant Campaign"
        subtitle={selectedListing ? selectedListing.companyName : undefined}
      >
        {selectedListing && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Placement</p>
                <p className="text-xl font-bold text-foreground mt-1">{selectedListing.category}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                selectedListing.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                selectedListing.status === 'Paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-muted text-muted-foreground border-border'
              }`}>
                {selectedListing.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">CPC Bid</span>
                <span className="text-base font-bold text-foreground">${selectedListing.bidPerClick.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Impressions</span>
                <span className="text-base font-bold text-foreground">{selectedListing.impressions.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/10 text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Clicks</span>
                <span className="text-base font-bold text-foreground">{selectedListing.clicks.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border bg-muted/10 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Performance & CTR</span>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Click-Through Rate (CTR)</span>
                <span className="text-sm font-bold text-emerald-600">
                  {selectedListing.impressions > 0 
                    ? ((selectedListing.clicks / selectedListing.impressions) * 100).toFixed(2) + "%"
                    : "0.00%"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Accrued Cost</span>
                <span className="text-sm font-bold text-foreground">
                  ${(selectedListing.clicks * selectedListing.bidPerClick).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex gap-3">
              <Button
                onClick={() => {
                  toggleStatus(selectedListing.id);
                  setSelectedListing(prev => prev ? { ...prev, status: prev.status === 'Active' ? 'Paused' : 'Active' } : null);
                }}
                className={`flex-1 font-bold ${
                  selectedListing.status === 'Active' 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {selectedListing.status === 'Active' ? 'Pause Campaign' : 'Activate Campaign'}
              </Button>
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
