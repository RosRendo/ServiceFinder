"use client";
import { useState, useEffect } from "react";
import { Star, MessageSquare, TrendingUp, Reply, Search, Loader2, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import api from "@/lib/api/client";

type Review = { id: string; customer: string; customerAvatar?: string; rating: number; comment: string; service: string; date: string; companyReply?: string; };

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | "all">("all");

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const companyRes = await api.get("/companies/my-company");
      const company = companyRes.data?.data || companyRes.data;
      if (!company?.id) { setLoading(false); return; }
      const res = await api.get(`/reviews/company/${company.id}`);
      const data = res.data?.data || res.data || [];
      setReviews((data.items || []).map((r: any) => ({
        id: r.id, customer: r.user?.fullName || "Anonymous", customerAvatar: r.user?.avatar,
        rating: r.rating, comment: r.comment, service: r.booking?.service?.name || "Service",
        date: new Date(r.createdAt).toLocaleDateString(), companyReply: null,
      })));
    } catch { toast.error("Failed to load reviews"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = reviews.filter((r) => {
    const s = `${r.customer} ${r.comment} ${r.service}`.toLowerCase();
    return s.includes(search.toLowerCase()) && (ratingFilter === "all" || r.rating === ratingFilter);
  });

  const avg = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars, count: reviews.filter((r) => r.rating === stars).length,
    pct: reviews.length ? (reviews.filter((r) => r.rating === stars).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and respond to customer feedback</p>
        </div>
        <button onClick={fetchReviews} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Average Rating", value: avg, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Total Reviews", value: reviews.length, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "5-Star Reviews", value: reviews.filter((r) => r.rating === 5).length, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color} mt-0.5`}>{loading ? "—" : s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Rating Breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="font-semibold text-sm text-gray-900 mb-4">Rating Breakdown</div>
          <div className="space-y-3">
            {breakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 cursor-pointer group" onClick={() => setRatingFilter(ratingFilter === item.stars ? "all" : item.stars)}>
                <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
                  <span className={`text-sm font-medium ${ratingFilter === item.stars ? "text-amber-600" : "text-gray-600"}`}>{item.stars}</span>
                  <Star className={`w-3.5 h-3.5 ${ratingFilter === item.stars ? "fill-amber-400 text-amber-400" : "fill-gray-300 text-gray-300"}`} />
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${ratingFilter === item.stars ? "bg-amber-400" : "bg-gray-700"}`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1">
              {[5, 4, 3, 2, 1].map((s) => (
                <button key={s} onClick={() => setRatingFilter(ratingFilter === s ? "all" : s)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded transition-colors ${ratingFilter === s ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s}<Star className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64"><MessageSquare className="w-10 h-10 text-gray-200 mb-3" /><p className="text-sm font-medium text-gray-500">No reviews found</p></div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((review) => (
                <div key={review.id} className="p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-9 h-9 rounded-full border border-gray-100 shrink-0">
                      <AvatarImage src={review.customerAvatar} />
                      <AvatarFallback className="text-sm font-bold bg-indigo-50 text-indigo-700">{review.customer.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-900">{review.customer}</div>
                          <div className="text-xs text-gray-400">{review.service} · {review.date}</div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`} />)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">"{review.comment}"</p>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded transition-colors">
                          <Reply className="w-3.5 h-3.5" /> Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
