"use client";

import { useState, useMemo } from "react";
import { Star, Plus, ShieldCheck, Check, Search, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeaturedListing {
  id: string;
  companyName: string;
  category: string;
  bidPerClick: number;
  impressions: number;
  clicks: number;
  status: "Active" | "Paused" | "Expired";
}

const FILTER_TABS = [
  { id: "all", label: "All Campaigns" },
  { id: "Active", label: "Active" },
  { id: "Paused", label: "Paused" },
  { id: "Expired", label: "Expired" },
];

export default function AdminFeaturedListingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<FeaturedListing | null>(null);
  const [newCompany, setNewCompany] = useState("");
  const [newCategory, setNewCategory] = useState("Deep Cleaning");
  const [newBid, setNewBid] = useState("0.85");
  const [page, setPage] = useState(1);
  const pageSize = 15;

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

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const matchesSearch = 
        l.companyName.toLowerCase().includes(search.toLowerCase()) ||
        l.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [listings, search, statusFilter]);

  const paginatedListings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const columns: ColumnDef<FeaturedListing>[] = [
    {
      id: "companyName",
      header: "Sponsor Provider",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          <span className="font-bold text-xs text-foreground">{row.companyName}</span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">{row.category}</span>
      ),
    },
    {
      id: "bidPerClick",
      header: "CPC Bid",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          ${row.bidPerClick.toFixed(2)}
        </span>
      ),
    },
    {
      id: "impressions",
      header: "Impressions",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.impressions.toLocaleString()}
        </span>
      ),
    },
    {
      id: "clicks",
      header: "Clicks",
      isSortable: true,
      align: "right",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-foreground">
          {row.clicks.toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => (
        <span className={cn(
          "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
          row.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
          row.status === 'Paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
          'bg-muted text-muted-foreground border-border'
        )}>
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleStatus(row.id)} 
            className="h-7 text-xs font-semibold border-border text-foreground hover:bg-muted"
          >
            {row.status === 'Active' ? 'Pause' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Sponsored Listings & Priority Ranking"
        description="Manage search priority bids, sponsored merchant placements, and impression metrics."
        data={paginatedListings}
        columns={columns}
        getRowId={(r) => r.id}
        onRowClick={(row) => setSelectedListing(row)}
        primaryAction={{
          label: "Sponsor Provider",
          icon: <Plus className="w-3.5 h-3.5" />,
          onClick: () => setIsModalOpen(true),
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search sponsored merchants or categories..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filtered.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No sponsored merchants found",
          description: search
            ? "No sponsored listings match your search criteria."
            : "No merchants are currently sponsored under this category.",
          actionLabel: "Sponsor Provider",
          onActionClick: () => setIsModalOpen(true),
        }}
      />

      {/* Sponsor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border text-foreground rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">Sponsor Service Provider</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Grant elevated placement in user search results and category discovery.
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleCreateSponsorship} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company Name</label>
              <Input
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="e.g. Master Plumbers Co."
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none"
                >
                  <option value="Deep Cleaning">Deep Cleaning</option>
                  <option value="HVAC & Aircon">HVAC & Aircon</option>
                  <option value="Plumbing repairs">Plumbing repairs</option>
                  <option value="Electrical Services">Electrical Services</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">CPC Bid ($)</label>
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
                className="h-8.5 text-xs border-border text-muted-foreground hover:text-foreground"
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
          <div className="p-4 space-y-6 text-sm font-sans">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category Placement</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{selectedListing.category}</p>
              </div>
              <span className={cn(
                "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                selectedListing.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                selectedListing.status === 'Paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-muted text-muted-foreground border-border'
              )}>
                {selectedListing.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">CPC Bid</span>
                <span className="text-base font-bold text-foreground font-mono">${selectedListing.bidPerClick.toFixed(2)}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Impressions</span>
                <span className="text-base font-bold text-foreground font-mono">{selectedListing.impressions.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl border border-border bg-card text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Clicks</span>
                <span className="text-base font-bold text-foreground font-mono">{selectedListing.clicks.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Performance & Metrics</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Click-Through Rate (CTR)</span>
                <span className="font-bold text-emerald-600 font-mono">
                  {selectedListing.impressions > 0 
                    ? ((selectedListing.clicks / selectedListing.impressions) * 100).toFixed(2) + "%"
                    : "0.00%"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Accrued Cost</span>
                <span className="font-bold text-foreground font-mono">
                  ${(selectedListing.clicks * selectedListing.bidPerClick).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex gap-3">
              <Button
                onClick={() => {
                  toggleStatus(selectedListing.id);
                  setSelectedListing(prev => prev ? { ...prev, status: prev.status === 'Active' ? 'Paused' : 'Active' } : null);
                }}
                className={cn(
                  "flex-1 font-bold text-xs h-9",
                  selectedListing.status === 'Active' 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
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
