"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { Search, Star, EyeOff, Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

interface ReviewRow {
  id: string;
  customer: string;
  company: string;
  staff: string;
  rating: number;
  text: string;
  service: string;
  date: string;
  status: "visible" | "hidden" | "flagged";
}

const STATUS_COLORS: Record<string, string> = {
  visible: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  hidden: "text-slate-400 bg-slate-400/10 border border-slate-400/20",
  flagged: "text-rose-400 bg-rose-400/10 border border-rose-400/20",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<ReviewRow | null>(null);
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reviews?limit=100');
      const payload = response.data.data || response.data;
      const dataList = Array.isArray(payload) ? payload : (payload.reviews || payload.data || []);
      
      const formatted = dataList.map((r: any) => ({
        id: r.id.toString(),
        customer: r.customer?.fullName || "Unknown",
        company: r.booking?.company?.name || "Unknown Company",
        staff: r.staff?.user?.fullName || "Unassigned",
        rating: r.companyRating || 5,
        text: r.companyComment || "No comment provided.",
        service: r.booking?.service?.name || "Unknown Service",
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Never",
        status: "visible"
      }));
      setReviews(formatted);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filtered = reviews.filter((r) => {
    const matchSearch = !search || [r.customer, r.company, r.text].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const columns: Column<ReviewRow>[] = [
    {
      key: "rating", header: "Rating", sortable: true,
      render: (r) => (
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn("w-3.5 h-3.5", i < r.rating ? "text-amber-500 fill-current" : "text-muted-foreground/30")} />
          ))}
        </div>
      ),
    },
    { key: "customer", header: "Customer", sortable: true, render: (r) => <span className="font-medium text-foreground">{r.customer}</span> },
    { key: "company", header: "Company", sortable: true, render: (r) => <span className="text-muted-foreground">{r.company}</span> },
    { key: "text", header: "Review", render: (r) => <span className="text-muted-foreground text-sm truncate max-w-[250px] block italic">"{r.text}"</span> },
    { key: "service", header: "Service", render: (r) => <span className="text-muted-foreground">{r.service}</span> },
    {
      key: "status", header: "Status",
      render: (r) => <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", STATUS_COLORS[r.status])}>{r.status}</span>,
    },
    { key: "date", header: "Date", render: (r) => <span className="text-muted-foreground text-xs">{r.date}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" />
        </div>
        <div className="flex items-center gap-1">
          {["all", "visible", "flagged", "hidden"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}>
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

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid columns={columns} data={filtered}
            onRowClick={(r) => { setActive(r); setDrawerOpen(true); }}
            emptyMessage="No reviews found." />
        )}
      </div>

      <BaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Review #${active?.id.substring(0,8)}`} subtitle={`${active?.customer} · ${active?.service}`}>
        {active && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-1.5 border-b border-border pb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-5 h-5", i < active.rating ? "text-amber-500 fill-current" : "text-muted-foreground/30")} />
              ))}
              <span className="text-sm font-medium text-foreground ml-2">{active.rating}/5</span>
            </div>
            
            <div className="p-4 bg-muted/30 border border-border rounded-xl relative">
              <span className="absolute -top-3 -left-2 text-4xl text-muted-foreground/20 font-serif">"</span>
              <p className="text-sm text-foreground italic leading-relaxed relative z-10">{active.text}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                <span className="font-medium text-foreground">{active.customer}</span>
                <span>{active.date}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm bg-muted/10 border border-border rounded-xl p-4">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Company</span><span className="font-medium">{active.company}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Staff</span><span>{active.staff}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Service</span><span>{active.service}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground text-xs font-medium transition-colors border border-border">
                <EyeOff className="w-4 h-4" /> Hide Review
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-medium transition-colors border border-rose-500/20">
                <Flag className="w-4 h-4" /> Report Issue
              </button>
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
