"use client";

import { useState, useEffect } from "react";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { StatusBadge } from "@/components/grid/StatusBadge";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { Search, ShieldAlert, CheckCircle2, XCircle, Eye, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DisputeRow {
  id: string;
  customerId: string;
  companyId: string;
  bookingId: string;
  type: string;
  description: string;
  status: "open" | "resolved" | "dismissed";
  companyResponse: string | null;
  adminDecision: string | null;
  refundAmount: number | null;
  createdAt: string;
  customer: { id: string; fullName: string };
  company: { id: string; name: string };
  booking: { id: string; totalPrice: number; service?: { name: string } };
}

export default function DisputesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<DisputeRow | null>(null);
  
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refundVal, setRefundVal] = useState("");
  const { toast } = useToast();

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/disputes?limit=100");
      const payload = res.data.data || res.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      setDisputes(dataList);
    } catch {
      toast({ title: "Error", description: "Failed to load disputes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (decision: "accept_claim" | "accept_company" | "mediation") => {
    if (!active) return;
    
    const refundAmount = refundVal ? Number(refundVal) : 0;
    if (decision === "accept_claim" && refundAmount <= 0) {
      toast({ title: "Error", description: "Please enter a valid refund amount", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      await api.put(`/admin/disputes/${active.id}/resolve`, {
        decision,
        refundAmount
      });
      toast({ title: "Success", description: `Dispute successfully resolved` });
      setDrawerOpen(false);
      setRefundVal("");
      fetchDisputes();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to resolve dispute", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = disputes.filter((d) => {
    const matchSearch = !search || [d.customer?.fullName, d.company?.name, d.id.toString()].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<DisputeRow>[] = [
    { key: "id", header: "#ID", width: "w-20", render: (r) => <span className="text-red-500 font-mono text-xs">#{r.id}</span> },
    { key: "customer", header: "Customer", sortable: true, render: (r) => <span className="font-semibold text-foreground">{r.customer?.fullName || "Guest"}</span> },
    { key: "company", header: "Company", sortable: true, render: (r) => <span className="text-foreground">{r.company?.name || "Unknown"}</span> },
    { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type?.replace(/_/g, " ")}</span> },
    { key: "amount", header: "Booking Value", sortable: true, render: (r) => <span className="font-semibold">${Number(r.booking?.totalPrice || 0).toFixed(2)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status === "open" ? "pending_verification" : r.status === "resolved" ? "active" : "suspended"} /> },
    { key: "createdAt", header: "Opened", render: (r) => <span className="text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString()}</span> },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disputes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Mediate booking disputes between customers and companies</p>
        </div>
        <span className="flex items-center gap-2 h-9 px-4 rounded-lg bg-rose-500/10 text-rose-600 text-sm font-semibold border border-rose-500/20">
          <ShieldAlert className="w-4 h-4" /> {disputes.filter((d) => d.status === "open").length} Open Disputes
        </span>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search disputes by customer or company..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-muted/20 text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60" 
          />
        </div>
        <div className="flex items-center gap-1">
          {["all", "open", "resolved", "dismissed"].map((s) => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${statusFilter === s ? "bg-violet-500/10 text-violet-500 border border-violet-500/20" : "text-muted-foreground hover:bg-muted/50 border border-transparent"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShieldAlert className="w-10 h-10 text-muted/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No disputes matching filters</p>
          </div>
        ) : (
          <DataGrid 
            columns={columns} 
            data={filtered} 
            onRowClick={(r) => { 
              setActive(r); 
              setRefundVal(String(r.booking?.totalPrice || ""));
              setDrawerOpen(true); 
            }} 
            emptyMessage="No disputes found." 
          />
        )}
      </div>

      {/* Detail Resolution Drawer */}
      <BaseDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Dispute #${active?.id}`} subtitle={`${active?.customer?.fullName} vs ${active?.company?.name}`}>
        {active && (
          <div className="p-6 space-y-5 flex flex-col h-full overflow-y-auto">
            <div className="p-4 bg-muted/20 border border-border rounded-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Dispute Type & Reason</p>
              <p className="text-sm font-semibold capitalize text-foreground">{active.type?.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground mt-1">{active.description}</p>
            </div>

            {active.companyResponse && (
              <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl">
                <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider mb-2">Company Response</p>
                <p className="text-xs text-foreground font-medium">{active.companyResponse}</p>
              </div>
            )}

            <div className="p-4 bg-muted/20 border border-border rounded-xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Booking Transaction</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Original Price</p>
                  <p className="text-xl font-bold text-foreground">${Number(active.booking?.totalPrice || 0).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p className="text-sm font-mono text-foreground">#{active.bookingId}</p>
                </div>
              </div>
            </div>

            {active.status === "open" ? (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-bold text-foreground">Resolve Dispute</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="refund">Refund Amount ($)</Label>
                  <Input 
                    id="refund" 
                    type="number" 
                    value={refundVal} 
                    onChange={e => setRefundVal(e.target.value)} 
                    max={Number(active.booking?.totalPrice || 0)} 
                    placeholder="Enter refund amount"
                  />
                  <p className="text-[10px] text-muted-foreground">Max refund is the total booking value: ${Number(active.booking?.totalPrice || 0).toFixed(2)}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    onClick={() => handleResolve("accept_claim")} 
                    disabled={submitting} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Refund Customer & Close Dispute
                  </Button>
                  
                  <Button 
                    onClick={() => handleResolve("accept_company")} 
                    disabled={submitting} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Release Funds to Company
                  </Button>

                  <Button 
                    onClick={() => handleResolve("mediation")} 
                    disabled={submitting} 
                    variant="outline"
                    className="w-full text-rose-500 border-rose-100 hover:bg-rose-50 hover:text-rose-700 font-bold"
                  >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Dismiss Claim Entirely
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wide">Resolved Dispute</h4>
                  <p className="text-xs text-muted-foreground mt-1">Decision: <span className="font-semibold text-foreground capitalize">{active.adminDecision?.replace(/_/g, " ")}</span></p>
                  {active.refundAmount && Number(active.refundAmount) > 0 ? (
                    <p className="text-xs text-muted-foreground">Refund Issued: <span className="font-bold text-emerald-500">${Number(active.refundAmount).toFixed(2)}</span></p>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
