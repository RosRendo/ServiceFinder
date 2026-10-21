"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { ReviewDrawer, ReviewRow } from "@/components/drawers/ReviewDrawer";
import { Star, Flag, Eye, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

const FILTER_TABS = [
  { id: "all", label: "All Reviews" },
  { id: "visible", label: "Visible" },
  { id: "flagged", label: "Flagged" },
  { id: "hidden", label: "Hidden" },
];

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  visible: { label: "Visible", class: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  hidden: { label: "Hidden", class: "text-muted-foreground bg-muted border-border" },
  flagged: { label: "Flagged", class: "text-rose-600 bg-rose-500/10 border-rose-500/25" },
};

export default function CompanyReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewRow | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`/companies/my-company/reviews?${params.toString()}`);
      const payload = res.data.data || res.data;
      setReviews(payload.reviews || []);
      setError(null);
    } catch (err: any) {
      setError("Failed to load reviews. Please check your network connection.");
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

  // Filter & Search Logic
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.customer?.toLowerCase().includes(q) ||
        r.text?.toLowerCase().includes(q) ||
        r.service?.toLowerCase().includes(q) ||
        r.staff?.toLowerCase().includes(q)
      );
    });
  }, [reviews, filter, search]);

  // Paginated Slice
  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, page, pageSize]);

  // Unified Column Definitions
  const columns: ColumnDef<ReviewRow>[] = [
    {
      id: "rating",
      header: "Rating",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3.5 h-3.5",
                  i < (row.rating || 0)
                    ? "text-amber-500 fill-amber-500"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="font-mono text-xs font-bold text-foreground">
            {Number(row.rating || 0).toFixed(1)}
          </span>
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-foreground">{row.customer || "Guest Client"}</span>
      ),
    },
    {
      id: "text",
      header: "Testimonial",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs line-clamp-1 max-w-[280px]">
          "{row.text || "No written review"}"
        </span>
      ),
    },
    {
      id: "service",
      header: "Service",
      cell: ({ row }) => (
        <span className="text-xs text-foreground font-medium">{row.service || "Home Service"}</span>
      ),
    },
    {
      id: "staff",
      header: "Technician",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.staff || "Unassigned"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const badge = STATUS_BADGES[row.status] || STATUS_BADGES.visible;
        return (
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", badge.class)}>
            {badge.label}
          </span>
        );
      },
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.date ? new Date(row.date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Customer Reviews & Ratings"
        description="Monitor service quality ratings, client feedback, and dispute flags."
        data={paginatedReviews}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={error}
        onRetry={fetchReviews}
        onRowClick={(r) => {
          setActiveReview(r);
          setDrawerOpen(true);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search reviews by customer, technician, or keyword..."
        filterSlots={
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                  filter === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filteredReviews.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No reviews found",
          description: search
            ? "No reviews match your search query."
            : "Your company has not received any reviews in this category yet.",
        }}
      />

      <ReviewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        review={activeReview}
        isAdmin={false}
      />
    </div>
  );
}
