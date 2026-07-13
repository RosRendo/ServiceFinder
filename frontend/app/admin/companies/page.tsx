"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MoreVertical, Building2, Loader2, Plus, ShieldAlert, Star, MapPin } from "lucide-react";

interface Company {
  id: string;
  name: string;
  email: string;
  city: string;
  ratingSummary?: { averageRating: number };
  _count?: { bookings: number };
  status: string;
  verificationStatus: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
}

const verificationBadge = (status: string) => {
  const styles: Record<string, string> = {
    verified: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-rose-50 text-rose-700",
  };
  return `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[status] || "bg-gray-100 text-gray-600"}`;
};

const subscriptionBadge = (company: Company) => {
  if (company.subscriptionStatus === "trial" && company.trialEndsAt && new Date(company.trialEndsAt) > new Date()) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Trial</span>;
  }
  if (company.subscriptionStatus === "trial" || company.subscriptionStatus === "expired") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700">Expired</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        let list = [];
        if (Array.isArray(data.data?.data)) list = data.data.data;
        else if (Array.isArray(data.data)) list = data.data;
        else if (Array.isArray(data.data?.companies)) list = data.data.companies;
        else if (Array.isArray(data.companies)) list = data.companies;
        setCompanies(list);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = companies.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExpireTrial = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}/expire-trial`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` },
    });
    fetchCompanies();
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all service provider companies</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/verification")}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Verification Queue
          </button>
          <button
            onClick={() => router.push("/admin/companies/new")}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Company
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            placeholder="Search by name, city or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-xs text-gray-400 font-medium ml-auto">
          {loading ? "Loading..." : `${filtered.length} companies`}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No companies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Company</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Rating</th>
                  <th className="px-5 py-3 text-left">Verification</th>
                  <th className="px-5 py-3 text-left">Subscription</th>
                  <th className="px-5 py-3 text-left">Bookings</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((company) => (
                  <tr
                    key={company.id}
                    onClick={() => router.push(`/admin/companies/${company.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                          {company.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{company.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[180px]">{company.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" />{company.city || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-gray-700">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {company.ratingSummary?.averageRating ? Number(company.ratingSummary.averageRating).toFixed(1) : "New"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={verificationBadge(company.verificationStatus)}>{company.verificationStatus}</span>
                    </td>
                    <td className="px-5 py-3.5">{subscriptionBadge(company)}</td>
                    <td className="px-5 py-3.5 text-gray-600 font-medium">{company._count?.bookings ?? 0}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(company.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/admin/companies/${company.id}`)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          View
                        </button>
                        {company.subscriptionStatus !== "expired" && (
                          <button
                            onClick={(e) => handleExpireTrial(e, company.id)}
                            className="px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            Expire Trial
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
