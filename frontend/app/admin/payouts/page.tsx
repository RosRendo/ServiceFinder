"use client";

import { useState, useEffect } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { BaseDrawer } from "@/components/drawers/BaseDrawer";
import { StatusPill } from "@/components/admin/StatusPill";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Building2, 
  Download, 
  RotateCcw, 
  Loader2, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PayoutRow {
  id: string;
  rawId: string;
  companyName: string;
  ownerName: string;
  amount: number;
  method: string;
  status: "paid" | "processing" | "failed";
  scheduledDate: string;
  khqrImageUrl?: string | null;
}

const STATUS_FILTERS = [
  { id: "all", label: "All Payouts" },
  { id: "processing", label: "Pending Processing" },
  { id: "paid", label: "Disbursed" },
  { id: "failed", label: "Failed" },
];

export default function PayoutsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<PayoutRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedPayoutForQr, setSelectedPayoutForQr] = useState<PayoutRow | null>(null);
  const [selectedPayoutForInspection, setSelectedPayoutForInspection] = useState<PayoutRow | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/payouts?limit=100");
      const raw = response.data;
      const dataList = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.payouts)
        ? raw.payouts
        : Array.isArray(raw?.data?.payouts)
        ? raw.data.payouts
        : [];

      const formatted = dataList.map((p: any) => {
        const companyName = p.company?.name || "Company";
        const ownerName = p.company?.owner?.fullName || p.company?.owner?.email || "—";
        let method = p.method || "Bank Transfer";
        if (p.company?.paymentMethods?.length) {
          const pm = p.company.paymentMethods.find((m: any) => m.isDefault) || p.company.paymentMethods[0];
          method = `${pm.type?.toUpperCase() || "Bank"} (${pm.accountName || pm.accountNumber})`;
        }
        let status = p.status;
        if (status === "completed") status = "paid";
        if (status === "pending") status = "processing";
        if (status === "rejected") status = "failed";

        const khqrImageUrl = p.company?.khqrImageUrl || p.khqrImageUrl || null;

        return {
          id: `PAY-${p.id}`,
          rawId: String(p.id),
          companyName,
          ownerName,
          amount: parseFloat(p.amount) || 0,
          method,
          status: status as "paid" | "processing" | "failed",
          scheduledDate: new Date(p.requestedAt || Date.now()).toLocaleDateString(),
          khqrImageUrl,
        };
      });
      setPayouts(formatted);
    } catch {
      toast.error("Failed to load payout ledger records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const exportCSV = (rows: PayoutRow[]) => {
    if (!rows.length) {
      toast.error("No payout rows available to export.");
      return;
    }
    const header = "Payout ID,Company,Owner,Amount,Method,Status,Date";
    const lines = rows.map((p) =>
      `${p.id},"${p.companyName}","${p.ownerName}",$${p.amount.toFixed(2)},"${p.method}",${p.status},${p.scheduledDate}`
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} records to CSV.`);
  };

  const handleProcessBatch = async () => {
    const pendingOnly = selectedRows.filter((r) => r.status === "processing");
    if (!pendingOnly.length) {
      toast.error("Selected rows do not contain any pending payouts.");
      return;
    }

    try {
      await Promise.all(
        pendingOnly.map((r) => api.patch(`/admin/payouts/${r.rawId}/process`))
      );
      toast.success(`Successfully disbursed ${pendingOnly.length} payout(s).`);
      setSelectedRows([]);
      fetchPayouts();
    } catch {
      toast.error("Failed to process one or more payouts.");
    }
  };

  const filtered = payouts.filter((p) => {
    const matchSearch =
      !search ||
      p.companyName.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: ColumnDef<PayoutRow>[] = [
    {
      id: "id",
      header: "Reference",
      sortable: true,
      accessorFn: (r) => r.id,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-muted-foreground">
          {r.id}
        </span>
      ),
    },
    {
      id: "company",
      header: "Company & Owner",
      sortable: true,
      accessorFn: (r) => r.companyName,
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground text-sm">{r.companyName}</span>
          <span className="text-xs text-muted-foreground">{r.ownerName}</span>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Disbursement",
      sortable: true,
      accessorFn: (r) => r.amount,
      cell: (r) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          ${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: "method",
      header: "Account / Routing",
      accessorFn: (r) => r.method,
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.method}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      accessorFn: (r) => r.status,
      cell: (r) => (
        <StatusPill status={r.status} />
      ),
    },
    {
      id: "scheduledDate",
      header: "Requested Date",
      sortable: true,
      accessorFn: (r) => r.scheduledDate,
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">
          {r.scheduledDate}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          {r.status === "processing" ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => {
                setSelectedPayoutForQr(r);
                setIsQrModalOpen(true);
              }}
            >
              <QrCode className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              Scan & Disburse
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">—</span>
          )}
        </div>
      ),
    },
  ];

  const totalDisbursed = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payouts
    .filter((p) => p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  const failedCount = payouts.filter((p) => p.status === "failed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payout Ledger</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authorize, disburse, and reconcile platform revenue distributions to verified companies
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <Button
              onClick={handleProcessBatch}
              size="sm"
              className="h-8 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Disburse ({selectedRows.length})
            </Button>
          )}
          <Button
            onClick={() => exportCSV(filtered.length ? filtered : payouts)}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Disbursed
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            ${totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">Historical platform payouts</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Disbursal
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            ${pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {payouts.filter((p) => p.status === "processing").length} transaction(s) awaiting approval
          </p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Failed / Exceptions
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {failedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Account or bank transfer failures</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
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

      {/* Monospace Financial DataGrid */}
      <ManagementDataGrid
        data={filtered}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter payouts by reference, company, or owner..."
        searchValue={search}
        onSearchChange={setSearch}
        page={page}
        pageSize={20}
        totalItems={filtered.length}
        onPageChange={setPage}
        selectable={true}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onRowClick={(row) => setSelectedPayoutForInspection(row)}
        emptyState={{
          title: "No payout records found",
          description: statusFilter === "all"
            ? "There are currently no disbursement records in the ledger."
            : `No payouts matching status "${statusFilter}".`,
        }}
      />

      {/* Bakong KHQR Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={(open) => !open && setIsQrModalOpen(false)}>
        <DialogContent className="sm:max-w-md p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              Authorize Bakong KHQR Disbursal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Scan the registered KHQR code using any National Bank of Cambodia mobile banking app to execute this payout.
            </DialogDescription>
          </DialogHeader>

          {selectedPayoutForQr && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg border border-border bg-muted/20 flex flex-col items-center">
                {selectedPayoutForQr.khqrImageUrl ? (
                  <img
                    src={selectedPayoutForQr.khqrImageUrl}
                    alt="Company KHQR Code"
                    className="w-48 h-48 rounded-md object-contain bg-background p-2 border border-border"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-md bg-muted/50 border border-border flex flex-col items-center justify-center text-center px-4 gap-2">
                    <QrCode className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">No KHQR image registered by provider</span>
                  </div>
                )}
                <div className="mt-3 text-center">
                  <p className="text-xs font-semibold text-foreground">{selectedPayoutForQr.companyName}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{selectedPayoutForQr.id}</p>
                </div>
              </div>

              <div className="p-3 rounded-md border border-border bg-card space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disbursement Amount</span>
                  <span className="font-mono font-bold text-foreground">
                    ${selectedPayoutForQr.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account / Method</span>
                  <span className="font-mono text-foreground">{selectedPayoutForQr.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Contact</span>
                  <span className="text-foreground">{selectedPayoutForQr.ownerName}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={async () => {
                    setIsSimulatingPayment(true);
                    try {
                      await api.patch(`/admin/payouts/${selectedPayoutForQr.rawId}/process`);
                      toast.success(`Disbursement confirmed for ${selectedPayoutForQr.companyName}.`);
                      setIsQrModalOpen(false);
                      fetchPayouts();
                    } catch {
                      toast.error("Failed to mark payout as disbursed.");
                    } finally {
                      setIsSimulatingPayment(false);
                    }
                  }}
                  disabled={isSimulatingPayment}
                  className="w-full h-9 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                >
                  {isSimulatingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Recording Disbursal...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Confirm Funds Disbursed
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payout Inspection Drawer */}
      <BaseDrawer
        open={!!selectedPayoutForInspection}
        onClose={() => setSelectedPayoutForInspection(null)}
        title="Disbursement Ledger Record"
        subtitle={selectedPayoutForInspection ? `Reference: ${selectedPayoutForInspection.id}` : undefined}
      >
        {selectedPayoutForInspection && (
          <div className="p-6 space-y-6 text-sm">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disbursement Amount</p>
                <p className="text-3xl font-mono font-bold text-foreground mt-1">
                  ${selectedPayoutForInspection.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <StatusPill status={selectedPayoutForInspection.status} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Recipient Merchant</span>
                  <span className="font-semibold text-foreground">{selectedPayoutForInspection.companyName}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Company Representative</span>
                  <span className="font-semibold text-foreground">{selectedPayoutForInspection.ownerName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Payout Method / Account</span>
                  <span className="font-medium text-foreground text-xs">{selectedPayoutForInspection.method}</span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <span className="text-xs text-muted-foreground block mb-1">Scheduled / Requested Date</span>
                  <span className="font-semibold text-foreground text-xs">{selectedPayoutForInspection.scheduledDate}</span>
                </div>
              </div>

              {selectedPayoutForInspection.status === 'processing' && (
                <div className="pt-4 border-t border-border flex gap-3">
                  <Button
                    onClick={() => {
                      const target = selectedPayoutForInspection;
                      setSelectedPayoutForInspection(null);
                      setSelectedPayoutForQr(target);
                      setIsQrModalOpen(true);
                    }}
                    className="flex-1 font-bold bg-foreground text-background hover:bg-foreground/90"
                  >
                    <QrCode className="w-4 h-4 mr-2" /> Open Bakong KHQR Modal
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </BaseDrawer>
    </div>
  );
}
