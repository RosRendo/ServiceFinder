"use client";
import { Plus, Edit, Trash2, Loader2, Wrench, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { useServices } from "@/lib/hooks/useServices";
import api from "@/lib/api/client";
import { useEffect, useState } from "react";

export default function Services() {
  const { services, loading, error, fetchServicesByCompany } = useServices({ autoFetch: false });
  const [fetchingUser, setFetchingUser] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get("/companies/my-company");
        const company = res.data?.data || res.data;
        if (company?.id) await fetchServicesByCompany(company.id);
      } catch (err) {
        console.error("Failed to load company ID", err);
      } finally {
        setFetchingUser(false);
      }
    };
    init();
  }, []);

  const activeCount = services.filter((s) => s.isActive).length;
  const isLoading = loading || fetchingUser;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your service offerings and pricing</p>
        </div>
        <Link
          href="/company/services/new"
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Service
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 font-medium">Total</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{isLoading ? "—" : services.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 font-medium">Active</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{isLoading ? "—" : activeCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs text-gray-500 font-medium">Inactive</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{isLoading ? "—" : services.length - activeCount}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-sm text-rose-600 font-medium mb-3">Failed to load services</p>
            <button onClick={() => window.location.reload()} className="text-xs text-gray-500 hover:underline">Retry</button>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Wrench className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-4">No services yet</p>
            <Link href="/company/services/new" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Service
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Service</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Base Price</th>
                  <th className="px-5 py-3 text-right">Duration</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{service.name}</div>
                      {service.description && (
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{service.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${service.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      ${service.basePrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />{service.durationMin}–{service.durationMax} min
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/company/services/${service.id}/edit`} className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1">
                          <Edit className="w-3 h-3" /> Edit
                        </Link>
                        <button className="px-2.5 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 rounded-md transition-colors">
                          Delete
                        </button>
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
