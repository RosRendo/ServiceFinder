"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  User,
  Building,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDisputesQuery, Dispute } from "@/lib/hooks/useDisputes";

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  open: {
    label: "Open",
    class: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertTriangle,
  },
  responded: {
    label: "Responded",
    class: "bg-blue-50 text-blue-700 border-blue-200",
    icon: MessageCircle,
  },
  investigating: {
    label: "Investigating",
    class: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
  },
  closed: {
    label: "Closed",
    class: "bg-slate-100 text-slate-700 border-slate-200",
    icon: XCircle,
  },
};

export default function CompanyDisputesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: queryData, isLoading: loading, error } = useDisputesQuery("company");
  const disputes = (queryData as any as Dispute[]) || [];

  const filteredDisputes = useMemo(() => {
    if (!Array.isArray(disputes)) return [];
    
    return disputes.filter((dispute) => {
      if (!dispute) return false;
      const idStr = dispute.id ? dispute.id.toString() : "";
      const searchString = `${idStr} ${dispute.customer?.fullName || ""} ${dispute.company?.name || ""} ${dispute.type || ""}`.toLowerCase();
      const matchesSearch = searchString.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!Array.isArray(disputes)) return { total: 0, open: 0, resolved: 0 };
    return {
      total: disputes.length,
      open: disputes.filter(d => d.status === "open" || d.status === "responded").length,
      resolved: disputes.filter(d => d.status === "resolved").length
    };
  }, [disputes]);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 sm:h-20 gap-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
                          <ShieldAlert className="w-5 h-5 text-white" />
                      </div>
                      <div>
                          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Company Disputes</h1>
                          <p className="text-sm font-medium text-gray-500">Manage and respond to disputes from customers</p>
                      </div>
                  </div>
              </div>
          </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-6">
        
        {/* Stats Bento */}
        <div className="grid gap-4 sm:grid-cols-3">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-rose-600 to-rose-500 rounded-3xl p-6 shadow-xl shadow-rose-500/20 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-[30px] rounded-full" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-rose-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                    </p>
                    <p className="text-4xl font-black text-white leading-none">{stats.open}</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/10 blur-[30px] rounded-full" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-gray-500 font-medium mb-3 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-indigo-500" /> Total Disputes
                    </p>
                    <p className="text-4xl font-black text-gray-900 leading-none">{stats.total}</p>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 blur-[30px] rounded-full" />
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-gray-500 font-medium mb-3 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Resolved
                    </p>
                    <p className="text-4xl font-black text-gray-900 leading-none">{stats.resolved}</p>
                </div>
            </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 p-4 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                type="text"
                placeholder="Search by ID, Customer, or Company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white/80 border-slate-200 rounded-2xl focus:ring-rose-500 focus:border-rose-500"
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar shrink-0">
                {["all", "open", "responded", "resolved"].map((status) => (
                <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl h-12 px-6 font-bold capitalize whitespace-nowrap ${
                    statusFilter === status
                        ? "bg-slate-900 text-white shadow-md hover:bg-slate-800"
                        : "bg-white/80 border-slate-200 text-slate-600 hover:bg-gray-50"
                    }`}
                >
                    {status}
                </Button>
                ))}
            </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mb-4" />
                    <p className="font-semibold text-sm">Loading disputes...</p>
                </div>
            ) : error ? (
                <div className="p-12 text-center text-rose-500 font-semibold flex flex-col items-center">
                    <AlertTriangle className="w-10 h-10 mb-2" />
                    <p>Failed to load disputes. Please try again.</p>
                </div>
            ) : filteredDisputes.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-bold text-gray-900 text-lg">No disputes found</p>
                    <p className="font-medium text-gray-500 mt-1">Everything looks peaceful!</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100/80">
                    <AnimatePresence>
                        {filteredDisputes.map((dispute, index) => {
                            const status = statusConfig[dispute.status] || statusConfig.open;
                            const StatusIcon = status.icon;

                            return (
                            <motion.div
                                key={dispute.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors flex flex-col lg:flex-row gap-6 items-start lg:items-center relative"
                            >
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.class}`}>
                                            <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                                        </span>
                                        <span className="text-xs font-bold text-gray-500 font-medium">
                                            #{dispute.id ? dispute.id.toString().padStart(6, '0') : "----"}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : "N/A"}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{dispute.type || "Unknown Type"}</h3>
                                        <p className="text-sm font-medium text-slate-600 line-clamp-2 mt-1">{dispute.description || "No description"}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 font-medium">Customer</p>
                                                <p className="text-sm font-semibold text-slate-700">{dispute.customer?.fullName || "Unknown"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                                <Building className="w-4 h-4 text-indigo-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-500 font-medium">Company</p>
                                                <p className="text-sm font-semibold text-slate-700">{dispute.company?.name || "Unknown"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full lg:w-auto shrink-0 flex gap-3 lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
                                    <Button
                                        onClick={() => router.push(`/company/disputes/${dispute.id}`)}
                                        className="w-full lg:w-auto h-12 lg:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md"
                                    >
                                        Review Dispute <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
