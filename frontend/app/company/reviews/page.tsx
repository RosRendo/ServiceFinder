"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { ReviewDrawer, ReviewRow } from "@/components/drawers/ReviewDrawer";
import { Search, Star, CheckCircle2, EyeOff, Flag, Loader2, Edit2, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";



const STATUS_COLORS: Record<string, string> = {
  visible: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20",
  hidden: "text-muted-foreground bg-muted/20 border border-border/40",
  flagged: "text-rose-500 bg-rose-500/10 border border-rose-500/20",
};

export default function CompanyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<ReviewRow | null>(null);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`/companies/my-company/reviews?${params.toString()}`);
      const payload = res.data.data || res.data;
      setReviews(payload.reviews || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = reviews.filter((r) => {
    const matchFilter = filter === "all" || r.status === filter;
    return matchFilter;
  });

  const columns: Column<ReviewRow>[] = [
    {
      key: "rating", header: "Rating", sortable: true,
      render: (r) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("w-3 h-3", i < r.rating ? "text-amber-500 fill-current" : "text-muted-foreground/30")} />
          ))}
        </div>
      ),
    },
    { key: "customer", header: "Customer", sortable: true },
    { key: "text", header: "Review", render: (r) => <span className="text-muted-foreground text-xs truncate max-w-[250px] block">{r.text}</span> },
    { key: "service", header: "Service" },
    { key: "staff", header: "Staff" },
    {
      key: "status", header: "Status",
      render: (r) => <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", STATUS_COLORS[r.status])}>{r.status}</span>,
    },
    { key: "date", header: "Date", render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.date).toLocaleDateString()}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "visible", "flagged", "hidden"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === s ? "bg-foreground text-background dark:bg-background dark:text-foreground" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
          <Flag className="w-3 h-3" />
          {reviews.filter((r) => r.status === "flagged").length} flagged
        </span>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
          </div>
        ) : (
          <DataGrid
            selectedIds={selectedIds}
            onToggleRow={(id) => setSelectedIds(p => {
              const n = new Set(p);
              if (n.has(id)) {
                n.delete(id);
              } else {
                n.add(id);
              }
              return n;
            })}
            onToggleAll={() => setSelectedIds(p => p.size === filtered.length ? new Set() : new Set(filtered.map((x: any) => x.id)))}
            columns={columns} data={filtered}
            onRowClick={(r) => { setActive(r); setDrawerOpen(true); }}
            emptyMessage="No reviews found." />
        )}
      </div>

      <ReviewDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} review={active} />

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            icon: Eye,
            label: "View Detail",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              const r = filtered.find((x: any) => x.id === id);
              if (r) {
                setActive(r);
                setDrawerOpen(true);
              }
            }
          },
          {
            icon: Edit2,
            label: "Respond to Review",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              const r = filtered.find((x: any) => x.id === id);
              if (r) {
                setActive(r);
                setDrawerOpen(true);
              }
            }
          }
        ]}
      />
    </div>
  );
}
