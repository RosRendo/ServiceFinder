"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, MoreHorizontal, ShieldAlert, ArrowUpRight, Loader2, Edit2, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { useSocket } from "@/lib/hooks/useSocket";
import { CustomerDrawer } from "@/components/drawers/CustomerDrawer";

export default function CustomersCRM() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const { toast } = useToast();
  const { socket } = useSocket();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await api.get(`/companies/my-company/customers?${params.toString()}`);
      const payload = res.data.data || res.data;
      setCustomers(payload.customers || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!socket) return;
    
    const handleStatusChange = (data: { userId: string, status: string, lastSeen: string }) => {
      setCustomers(prev => prev.map(c => {
        if (c.id?.toString() === data.userId) {
          return {
            ...c,
            workingStatus: data.status,
            lastSeen: data.lastSeen,
          };
        }
        return c;
      }));
    };

    socket.on('user_status_changed', handleStatusChange);
    return () => {
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [socket]);

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Customer",
      render: (c: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500 font-bold shrink-0 border border-violet-500/20">
            {c.profilePictureUrl ? (
              <img src={c.profilePictureUrl} alt={c.fullName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              c.fullName?.[0] || "?"
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{c.fullName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              {(c.workingStatus || c.status) === "online" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
              )}
              <span className="capitalize">{c.workingStatus === "online" ? "Online" : c.status || "active"}</span>
            </p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (c: any) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            {c.email}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Phone className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            {c.phone || "No phone"}
          </div>
        </div>
      ),
    },
    {
      key: "ltv",
      header: "Lifetime Value (LTV)",
      render: (c: any) => (
        <span className="font-semibold text-emerald-500">
          ${Number(c.stats?.ltv || 0).toFixed(2)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "bookings",
      header: "Total Bookings",
      render: (c: any) => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
          {c.stats?.totalBookings || 0} jobs
        </span>
      ),
    },
    {
      key: "disputes",
      header: "Active Disputes",
      render: (c: any) => {
        const disputes = c.stats?.activeDisputes || 0;
        if (disputes === 0) return <span className="text-muted-foreground text-sm">None</span>;
        return (
          <span className="inline-flex items-center gap-1 text-rose-500 text-sm font-medium">
            <ShieldAlert className="w-4 h-4" />
            {disputes} Active
          </span>
        );
      },
    },
    {
      key: "lastActivity",
      header: "Last Activity",
      render: (c: any) => (
        <span className="text-sm text-muted-foreground">
          {c.stats?.lastActivity 
            ? new Date(c.stats.lastActivity).toLocaleDateString()
            : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search customers..."
            className="w-full pl-9 pr-3 h-9 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" 
          />
        </div>
        <div className="flex items-center gap-1">
          {/* Customers doesn't have an explicit tab filter yet, but we'll add All/Active for visual alignment */}
          {["all"].map((s) => (
            <button key={s}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-violet-500/10 text-violet-500 border border-violet-500/20">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          {customers.length} total
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
            onToggleRow={(id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
            onToggleAll={() => setSelectedIds(prev => prev.size === customers.length ? new Set() : new Set(customers.map(c => c.id)))}
            columns={columns}
            data={customers}
            onRowClick={(row) => {
              setActiveCustomer({
                ...row,
                totalBookings: row.stats?.totalBookings || 0,
                activeDisputes: row.stats?.activeDisputes || 0,
                ltv: row.stats?.ltv || 0,
                recentBookings: row.stats?.recentBookings || []
              });
              setDrawerOpen(true);
            }}
            emptyMessage="No customers found."
          />
        )}
      </div>

      <CustomerDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        customer={activeCustomer} 
      />
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          {
            icon: Eye,
            label: "View Detail",
            onClick: () => {
              const id = Array.from(selectedIds)[0];
              const c = customers.find((x: any) => x.id === id);
              if (c) {
                setActiveCustomer({
                  ...c,
                  totalBookings: c.stats?.totalBookings || 0,
                  activeDisputes: c.stats?.activeDisputes || 0,
                  ltv: c.stats?.ltv || 0,
                  recentBookings: c.stats?.recentBookings || []
                });
                setDrawerOpen(true);
              }
            }
          },
          {
            icon: Edit2,
            label: "Edit",
            onClick: () => {
              const id = Array.from(selectedIds)[0];

              const c = customers.find((x: any) => x.id === id);
              if (c) {
                setActiveCustomer({
                  ...c,
                  totalBookings: c.stats?.totalBookings || 0,
                  activeDisputes: c.stats?.activeDisputes || 0,
                  ltv: c.stats?.ltv || 0,
                  recentBookings: c.stats?.recentBookings || []
                });
                setDrawerOpen(true);
              }
  
            }
          },
          {
            icon: Trash2,
            label: "Delete",
            variant: "danger",
            onClick: () => {
              setSelectedIds(new Set());
            }
          }
        ]}
      />
    </div>
  );
}
