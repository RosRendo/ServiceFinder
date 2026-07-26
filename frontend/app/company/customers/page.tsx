"use client";
import { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, MoreHorizontal, ShieldAlert, ArrowUpRight, Loader2 } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api/client";
import { DataGrid, Column } from "@/components/grid/DataGrid";

export default function CustomersCRM() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

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
              {c.status === "active" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
              )}
              <span className="capitalize">{c.status || "active"}</span>
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
    {
      key: "actions",
      header: "",
      render: (c: any) => (
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      ),
      width: "w-10",
    }
  ];

  return (
    <div className="space-y-6 flex flex-col h-full overflow-hidden">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-500" />
            Customer CRM
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all customers who have booked with your company.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border bg-background hover:bg-muted/50 text-foreground">
            <ArrowUpRight className="w-4 h-4 mr-2 opacity-70" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="border-b border-border p-4 flex gap-4 bg-muted/30 shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          )}
          <DataGrid
            columns={columns}
            data={customers}
            onRowClick={(c) => {
              toast({ title: "Profile", description: `Viewing profile for ${c.fullName}` });
            }}
          />
        </div>
      </div>
    </div>
  );
}
