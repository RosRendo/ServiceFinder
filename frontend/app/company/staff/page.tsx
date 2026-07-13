"use client";
import apiClient from "@/lib/api/client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Mail, MoreVertical, Briefcase, Loader2, Star, Search, Filter,
  ChevronDown, TrendingUp, MessageSquare, UserMinus, UserPlus, CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { StaffMember } from "@/types/staff.types";

const roleLabels: Record<string, string> = {
  worker: "Worker", supervisor: "Supervisor", manager: "Manager",
  senior_cleaner: "Senior Cleaner", cleaning_specialist: "Cleaning Specialist", team_lead: "Team Lead", cleaner: "Cleaner",
};

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await apiClient.get("/companies/my-company/staff");
        const data = res.data?.data || res.data || [];
        setStaff(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Failed to load staff members");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const activeCount = staff.filter(s => s.status === "active").length;
  const availableCount = staff.filter(s => s.isAvailable).length;
  const avgRating = (staff.reduce((sum, s) => sum + (s.averageRating || 0), 0) / (staff.length || 1)).toFixed(1);

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (!confirm(`Are you sure you want to remove ${staffName}?`)) return;
    setStaff(prev => prev.filter(s => s.id !== staffId));
    toast.success(`${staffName} has been removed`);
  };

  const handleClearDebt = async (staffId: string, staffName: string, debtAmount: number) => {
    if (!confirm(`Have you physically received $${Math.abs(debtAmount)} cash from ${staffName}? This will clear their digital debt.`)) return;
    try {
      await apiClient.post(`/wallets/company/my-company/staff/${staffId}/clear-debt`, { amount: Math.abs(debtAmount) });
      toast.success(`${staffName}'s debt has been cleared.`);
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, walletBalance: s.walletBalance + Math.abs(debtAmount) } : s));
    } catch (err) {
      toast.error("Failed to clear debt");
    }
  };

  const statCards = [
    { label: "Total Staff", value: staff.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active", value: activeCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Available", value: availableCount, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Avg Rating", value: avgRating, icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
        
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-gray-500 mt-1 text-sm max-w-xl">Manage your team members, track performance, and monitor availability across your workforce.</p>
        </div>
        <Link href="/company/staff/new">
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 shadow-sm px-4 font-semibold gap-2">
            <Plus className="w-4 h-4" /> Add Staff
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="bg-white p-4 rounded-xl border border-gray-200 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500">{stat.label}</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-lg h-9 text-sm focus-visible:ring-blue-500/20 shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-white border-gray-200 rounded-lg h-9 w-full sm:w-auto justify-between sm:justify-center shadow-sm font-medium text-gray-700 px-4 text-sm">
                <span className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  {roleFilter === "all" ? "All Roles" : roleLabels[roleFilter]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl border-gray-200 shadow-xl min-w-[200px]" align="end">
              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => setRoleFilter("all")}>All Roles</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => setRoleFilter("worker")}>Worker</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => setRoleFilter("supervisor")}>Supervisor</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg font-medium cursor-pointer" onClick={() => setRoleFilter("manager")}>Manager</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-200">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No staff found</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">You don't have any staff members matching that criteria.</p>
              <Link href="/company/staff/new">
                <Button className="rounded-lg h-9 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Add Team Member</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Staff Member</th>
                  <th className="px-6 py-3">Role & Contact</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Performance</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 w-16 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-gray-200 rounded-lg">
                          <AvatarImage src={member.avatar || undefined} />
                          <AvatarFallback className="bg-blue-50 text-blue-700 font-bold rounded-lg text-xs">
                            {member.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-gray-900">{member.fullName}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded text-xs mb-1">
                        {roleLabels[member.role] ?? member.role}
                      </span>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3" /> {member.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {member.isAvailable && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            AVAILABLE TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-semibold text-gray-900">
                        {member.averageRating ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {member.averageRating.toFixed(1)}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs font-normal">No ratings</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{member.completedJobs} jobs done</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.walletBalance < 0 ? (
                        <div>
                          <p className="font-bold text-rose-600">-${Math.abs(member.walletBalance).toFixed(2)}</p>
                          <p className="text-[10px] text-rose-500 font-medium">Owes Platform</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-gray-900">${member.walletBalance.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500">Balance</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-gray-200 shadow-lg min-w-[160px]">
                          <DropdownMenuItem asChild className="cursor-pointer text-sm font-medium">
                            <Link href={`/company/messages?new=${member.userId}`}>
                              <MessageSquare className="w-4 h-4 mr-2 text-gray-400" /> Message
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer text-sm font-medium">
                            <Link href={`/company/staff/${member.id}`}>View Profile</Link>
                          </DropdownMenuItem>
                          {member.status === 'active' ? (
                            <DropdownMenuItem className="text-rose-600 cursor-pointer text-sm font-medium focus:text-rose-700 focus:bg-rose-50" onClick={() => handleRemoveStaff(member.id, member.fullName)}>
                              <UserMinus className="w-4 h-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-emerald-600 cursor-pointer text-sm font-medium focus:text-emerald-700 focus:bg-emerald-50">
                              <UserPlus className="w-4 h-4 mr-2" /> Reactivate
                            </DropdownMenuItem>
                          )}
                          {member.walletBalance < 0 && (
                            <DropdownMenuItem className="text-emerald-600 cursor-pointer text-sm font-medium focus:text-emerald-700 focus:bg-emerald-50 mt-1 border-t border-gray-100" onClick={() => handleClearDebt(member.id, member.fullName, member.walletBalance)}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Clear Debt
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}