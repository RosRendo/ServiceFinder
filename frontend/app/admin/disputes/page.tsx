"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { SlideoverDrawer } from "@/components/admin/SlideoverDrawer";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Eye, 
  Loader2, 
  FileText, 
  MessageSquare, 
  DollarSign, 
  ExternalLink,
  Scale
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  customer?: { id: string; fullName: string };
  company?: { id: string; name: string };
  booking?: { id: string; totalPrice: number; service?: { name: string } };
}

const STATUS_FILTERS = [
  { id: "all", label: "All Disputes" },
  { id: "open", label: "Open / Pending" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

export default function DisputesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState<DisputeRow | null>(null);
  
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refundVal, setRefundVal] = useState("");
  const [page, setPage] = useState(1);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/disputes?limit=100");
      const payload = res.data?.data || res.data;
      const dataList = Array.isArray(payload) ? payload : (payload.data || []);
      setDisputes(dataList);
    } catch {
      toast.error("Failed to load disputes.");
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
      toast.error("Please enter a valid refund amount.");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.put(`/admin/disputes/${active.id}/resolve`, {
        decision,
        refundAmount,
      });
      toast.success("Dispute successfully resolved.");
      setDrawerOpen(false);
      setRefundVal("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resolve dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = disputes.filter((d) => {
    const matchSearch = !search || [
      d.customer?.fullName, 
      d.company?.name, 
      String(d.id), 
      d.bookingId
    ].some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: ColumnDef<DisputeRow>[] = [
    {
      id: "id",
      header: "Dispute ID",
      sortable: true,
      accessorFn: (row) => row.id,
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground font-semibold">
          #{String(row.id).slice(0, 8)}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      accessorFn: (row) => row.customer?.fullName || "Guest",
      cell: (row) => (
        <span className="font-medium text-foreground text-sm">
          {row.customer?.fullName || "Guest Customer"}
        </span>
      ),
    },
    {
      id: "company",
      header: "Company",
      sortable: true,
      accessorFn: (row) => row.company?.name || "Unknown",
      cell: (row) => (
        <span className="text-foreground text-sm font-medium">
          {row.company?.name || "Unassigned"}
        </span>
      ),
    },
    {
      id: "type",
      header: "Category",
      accessorFn: (row) => row.type,
      cell: (row) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.type?.replace(/_/g, " ") || "General"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Booking Value",
      sortable: true,
      accessorFn: (row) => Number(row.booking?.totalPrice || 0),
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          ${Number(row.booking?.totalPrice || 0).toFixed(2)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (row) => row.status,
      cell: (row) => (
        <StatusPill status={row.status} />
      ),
    },
    {
      id: "createdAt",
      header: "Opened",
      sortable: true,
      accessorFn: (row) => row.createdAt,
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => {
              setActive(row);
              setRefundVal(String(row.booking?.totalPrice || ""));
              setDrawerOpen(true);
            }}
          >
            Review
          </Button>
          <Link href={`/admin/disputes/${row.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="View full dispute mediation page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const openDisputesCount = disputes.filter((d) => d.status === "open").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Disputes</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Mediate and resolve platform billing and quality disputes between customers and providers
          </p>
        </div>
        <div className="flex items-center gap-3">
          {openDisputesCount > 0 && (
            <div className="flex items-center gap-2 h-8 px-3 rounded-md bg-muted border border-border text-xs font-medium text-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{openDisputesCount} Open Claim{openDisputesCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px",
              statusFilter === tab.id
                ? "border-foreground text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <ManagementDataGrid
        data={filtered}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter disputes by customer, company, or ID..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={15}
        totalItems={filtered.length}
        onPageChange={setPage}
        onRowClick={(row) => {
          setActive(row);
          setRefundVal(String(row.booking?.totalPrice || ""));
          setDrawerOpen(true);
        }}
        emptyState={{
          title: "No disputes found",
          description: statusFilter === "all"
            ? "There are currently no reported disputes on the platform."
            : `No disputes found under status "${statusFilter}".`,
        }}
      />

      {/* Mediation Slideover Drawer */}
      <SlideoverDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={active ? `Dispute #${String(active.id).slice(0, 8)}` : "Dispute Review"}
        subtitle={active ? `${active.customer?.fullName || "Guest"} vs. ${active.company?.name || "Company"}` : undefined}
        width="xl"
      >
        {active && (
          <div className="space-y-6">
            {/* Top Status & Booking Card */}
            <div className="p-4 rounded-lg border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  Booking #{active.bookingId || "—"}
                </span>
                <StatusPill status={active.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-[11px] text-muted-foreground">Original Booking Value</p>
                  <p className="text-lg font-mono font-bold text-foreground">
                    ${Number(active.booking?.totalPrice || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Service Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {active.booking?.service?.name || "Standard Service"}
                  </p>
                </div>
              </div>
            </div>

            {/* Split Comparison: Customer Claim vs Company Defense */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Mediation Arguments
              </h3>

              {/* Customer Claim */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Customer Claim ({active.customer?.fullName || "Guest"})
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {active.type?.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1">
                  {active.description || "No detailed description submitted by customer."}
                </p>
              </div>

              {/* Company Response */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">
                    Company Response ({active.company?.name || "Provider"})
                  </span>
                </div>
                {active.companyResponse ? (
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pt-1">
                    {active.companyResponse}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic pt-1">
                    No formal statement submitted by company yet.
                  </p>
                )}
              </div>
            </div>

            {/* Decision Section */}
            {active.status === "open" ? (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Admin Resolution Action
                </h3>

                <div className="space-y-1.5">
                  <Label htmlFor="refund" className="text-xs font-medium text-foreground">
                    Customer Refund Amount ($)
                  </Label>
                  <Input
                    id="refund"
                    type="number"
                    step="0.01"
                    min="0"
                    max={Number(active.booking?.totalPrice || 0)}
                    value={refundVal}
                    onChange={(e) => setRefundVal(e.target.value)}
                    placeholder="Enter dollar amount to refund"
                    className="h-9 text-xs font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Max authorized refund is the total transaction amount: ${Number(active.booking?.totalPrice || 0).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => handleResolve("accept_claim")}
                    disabled={submitting}
                    className="w-full h-9 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Authorize Refund & Close Claim
                  </Button>

                  <Button
                    onClick={() => handleResolve("accept_company")}
                    disabled={submitting}
                    variant="outline"
                    className="w-full h-9 text-xs font-semibold"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                    Rule in Favor of Company (Release Funds)
                  </Button>

                  <Button
                    onClick={() => handleResolve("mediation")}
                    disabled={submitting}
                    variant="ghost"
                    className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Dismiss Dispute (No Fault Found)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dispute Adjudicated</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Decision: <span className="font-semibold text-foreground capitalize">{active.adminDecision?.replace(/_/g, " ") || "Resolved"}</span>
                </p>
                {active.refundAmount && Number(active.refundAmount) > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Refund Issued: <span className="font-mono font-semibold text-foreground">${Number(active.refundAmount).toFixed(2)}</span>
                  </p>
                ) : null}
              </div>
            )}

            {/* Direct Deep Link */}
            <div className="pt-2 text-center">
              <Link
                href={`/admin/disputes/${active.id}`}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Open Full Evidence & Audit Log View →
              </Link>
            </div>
          </div>
        )}
      </SlideoverDrawer>
    </div>
  );
}
