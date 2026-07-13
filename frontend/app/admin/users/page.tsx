"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Users, Mail, ChevronDown } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" },
  { label: "Customer", value: "customer" },
  { label: "Company Admin", value: "company_admin" },
  { label: "Staff", value: "staff" },
  { label: "Admin", value: "admin" },
];

const ROLE_BADGE: Record<string, string> = {
  customer: "bg-blue-50 text-blue-700",
  company_admin: "bg-purple-50 text-purple-700",
  staff: "bg-amber-50 text-amber-700",
  admin: "bg-rose-50 text-rose-700",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  suspended: "bg-rose-50 text-rose-700",
  pending: "bg-gray-100 text-gray-600",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ limit: "200" });
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }, credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.data?.users || data.users || [];
        setUsers(list);
        setTotal(data.data?.pagination?.total || list.length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all platform users</p>
        </div>
        {total > 0 && (
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md font-medium">
            {total} total users
          </span>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            {ROLE_OPTIONS.find((r) => r.value === roleFilter)?.label ?? "All Roles"}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showRoleDropdown && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setRoleFilter(opt.value); setShowRoleDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${roleFilter === opt.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 font-medium ml-auto">
          {loading ? "Loading..." : `${filtered.length} users`}
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
            <Users className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No users found</p>
            {(search || roleFilter) && (
              <button onClick={() => { setSearch(""); setRoleFilter(""); }} className="mt-3 text-xs text-indigo-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Phone</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs shrink-0">
                          {user.fullName?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{user.fullName}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />{user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{user.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${ROLE_BADGE[user.role] || "bg-gray-100 text-gray-600"}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_BADGE[user.status] || "bg-gray-100 text-gray-600"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => router.push(`/admin/messages?new=${user.id}`)}
                          className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          Message
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
