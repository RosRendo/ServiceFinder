"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  Briefcase,
  ShieldCheck,
  Building2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Edit3
} from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

interface CompanyData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: string;
  verificationStatus?: string;
  createdAt: string;
  logoUrl?: string;
  coverImageUrl?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
  verificationDocumentUrl?: string;
  registrationNumber?: string;
  establishedYear?: number;
  description?: string;
  walletBalance?: string | number;
  latitude?: number;
  longitude?: number;
  cardHighlights?: any;
  detailHighlights?: any;
  ratingSummary?: {
    averageRating: string;
    totalReviews: number;
  };
  staff?: any[];
  services?: any[];
}

interface ServiceData {
  id: string;
  name: string;
  basePrice?: string;
  isActive?: boolean;
}

interface ReviewData {
  id: string;
  customer: { fullName: string };
  companyRating: number;
  companyComment: string;
  createdAt: string;
}

export default function CompanyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const companyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${id}`, { headers });
        if (!companyRes.ok) throw new Error("Company not found");
        const companyData = await companyRes.json();

        const servicesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/company/${id}`, { headers });
        const servicesData = servicesRes.ok ? await servicesRes.json() : { data: { data: [] } };

        const reviewsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/company/${id}?limit=5`, { headers });
        const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: { reviews: [] } };

        setCompany(companyData.data?.company || companyData.data || companyData);
        setServices(servicesData.data?.data || servicesData.data || []);
        setReviews(reviewsData.data?.reviews || reviewsData.data || []);
      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company details");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleVerification = async (action: "verify" | "reject") => {
    if (!company) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action }),
        }
      );

      if (response.ok) {
        setCompany({
          ...company,
          verificationStatus: action === "verify" ? "verified" : "rejected",
        });
        toast.success(`Company ${action === "verify" ? "verified" : "rejected"} successfully`);
      } else {
        toast.error("Failed to update verification status");
      }
    } catch (err) {
      console.error("Error updating verification:", err);
      toast.error("Error updating verification");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error && !company) return (
    <div className="min-h-screen flex items-center justify-center pb-20 px-4">
        <div className="bg-rose-50 border border-rose-200 p-8 flex flex-col items-center gap-4 max-w-md w-full rounded-3xl text-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-rose-600 font-bold text-lg">{error}</p>
            <Button variant="outline" className="border-rose-200 text-rose-700 bg-white hover:bg-rose-50 rounded-xl px-8 h-11 font-semibold" onClick={() => router.push("/admin/companies")}>Back to Companies</Button>
        </div>
    </div>
  );

  const displayCompany = company!;
  
  const rating = displayCompany.ratingSummary?.averageRating ? parseFloat(displayCompany.ratingSummary.averageRating) : 0;
  const reviewCount = displayCompany.ratingSummary?.totalReviews || 0;
  const staffCount = displayCompany.staff?.length || 0;
  const servicesCount = displayCompany.services?.length || services.length || 0;
  
  let subscription = displayCompany.subscriptionStatus || "free";
  if (subscription === "trial" && displayCompany.trialEndsAt) {
    const endsAt = new Date(displayCompany.trialEndsAt);
    const now = new Date();
    if (endsAt > now) {
      const diffTime = endsAt.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      subscription = `Trial (${diffDays} days)`;
    } else {
      subscription = "Trial (Expired)";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/companies")} className="h-9 w-9 text-slate-500 hover:text-slate-900 shrink-0 border-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Details</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push(`/admin/companies/${id}/edit`)} variant="outline" className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 w-full sm:w-auto font-medium">
              <Edit3 className="w-4 h-4 mr-1.5" /> Edit
            </Button>
            {displayCompany.verificationStatus !== "verified" && (
              <>
                <Button onClick={() => handleVerification("reject")} variant="outline" className="h-9 border-slate-200 text-rose-600 hover:bg-rose-50 w-full sm:w-auto font-medium">
                  Reject
                </Button>
                <Button onClick={() => handleVerification("verify")} className="h-9 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto font-medium text-white">
                  Verify Company
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 mt-8">
          
          {/* Left Column: Profile & Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              {/* Simple Cover Area */}
              <div className="h-24 bg-slate-100 border-b border-slate-200 w-full relative">
                {displayCompany.coverImageUrl && (
                  <img src={displayCompany.coverImageUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>

              <div className="px-5 pb-6">
                <div className="flex justify-between items-end mt-[-2rem] mb-4">
                  <Avatar className="h-16 w-16 rounded-lg border-2 border-white bg-white shadow-sm shrink-0">
                    <AvatarFallback className="rounded-lg bg-slate-100 text-slate-600 text-xl font-semibold">
                      {displayCompany.logoUrl ? (
                        <img src={displayCompany.logoUrl} alt={displayCompany.name} className="w-full h-full object-cover rounded-md"/>
                      ) : (
                        displayCompany.name?.charAt(0) || "C"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <StatusBadge status={(displayCompany.status === "active" ? "active" : "pending") as any} />
                    {displayCompany.verificationStatus === "verified" && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {displayCompany.name}
                </h3>

                {reviewCount > 0 && (
                  <div className="flex items-center gap-1.5 mb-4">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-medium text-slate-900 text-sm">{rating.toFixed(1)}</span>
                    <span className="text-slate-500 text-sm">({reviewCount} reviews)</span>
                  </div>
                )}

                {displayCompany.description && (
                  <p className="text-sm text-slate-600 mb-4">{displayCompany.description}</p>
                )}

                <div className="space-y-3 mt-5 border-t border-slate-100 pt-5">
                  {displayCompany.registrationNumber && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Reg. Number</span>
                      <span className="font-medium text-slate-900">{displayCompany.registrationNumber}</span>
                    </div>
                  )}
                  {displayCompany.establishedYear && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Established</span>
                      <span className="font-medium text-slate-900">{displayCompany.establishedYear}</span>
                    </div>
                  )}
                  {displayCompany.verificationDocumentUrl && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Verification Doc</span>
                      <a href={displayCompany.verificationDocumentUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:underline">
                        View Document
                      </a>
                    </div>
                  )}
                  {displayCompany.walletBalance !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Wallet Balance</span>
                      <span className="font-medium text-emerald-600">${Number(displayCompany.walletBalance).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-5 border-t border-slate-100 pt-5">
                  {displayCompany.email && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{displayCompany.email}</span>
                    </div>
                  )}
                  {displayCompany.phone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{displayCompany.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex flex-col">
                      <span>
                        {[displayCompany.address, displayCompany.city].filter(Boolean).join(", ") || "No address provided"}
                      </span>
                      {(displayCompany.latitude !== undefined && displayCompany.longitude !== undefined) && (
                        <span className="text-xs text-slate-400 mt-0.5">Lat: {displayCompany.latitude}, Lng: {displayCompany.longitude}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Joined {new Date(displayCompany.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {(displayCompany.cardHighlights?.length > 0 || displayCompany.detailHighlights?.length > 0) && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(displayCompany.cardHighlights) && displayCompany.cardHighlights.map((highlight: string, idx: number) => (
                        <span key={`card-${idx}`} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{highlight}</span>
                      ))}
                      {Array.isArray(displayCompany.detailHighlights) && displayCompany.detailHighlights.map((highlight: string, idx: number) => (
                        <span key={`detail-${idx}`} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-200">{highlight}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: KPIs & Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Flat KPIs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Plan</p>
                <p className="text-2xl font-semibold text-slate-900 capitalize">{subscription}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Staff</p>
                <p className="text-2xl font-semibold text-slate-900">{staffCount}</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Services</p>
                <p className="text-2xl font-semibold text-slate-900">{servicesCount}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Services List */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Services Offered</h3>
                  <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded text-xs">{services.length}</span>
                </div>
                <div className="p-0">
                  {services.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {services.map((service) => (
                        <li key={service.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{service.name}</p>
                            <p className="text-xs text-slate-500">Base: ${service.basePrice || "0"}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-slate-500 text-sm">No services listed yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Reviews */}
              <div className="bg-white border border-slate-200 rounded-lg">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Recent Reviews</h3>
                  <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded text-xs">{reviews.length}</span>
                </div>
                <div className="p-0">
                  {reviews.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {reviews.map((review) => (
                        <li key={review.id} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-slate-900 text-sm">{review.customer?.fullName || "Anonymous"}</span>
                            <div className="flex items-center">
                              {Array.from({ length: review.companyRating || 5 }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed mb-2">"{review.companyComment || "No comment provided."}"</p>
                          <p className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-slate-500 text-sm">No reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
