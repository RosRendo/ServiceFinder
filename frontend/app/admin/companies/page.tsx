"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, Star, Phone, Mail, Ban, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { ConfirmationDialog, ReasonOption } from "@/components/admin/ConfirmationDialog";
import { CompanyDrawer, CompanyRow } from "@/components/drawers/CompanyDrawer";
import { AddCompanyModal } from "@/components/admin/AddCompanyModal";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

const SUSPEND_REASONS: ReasonOption[] = [
  { code: "FRAUD_ACTIVITY", label: "Fraudulent Activity or Fake Bookings" },
  { code: "COMPLIANCE_BREACH", label: "Lapsed Trade License or Compliance Failure" },
  { code: "CUSTOMER_DISPUTES", label: "Excessive Unresolved Customer Disputes" },
  { code: "POLICY_VIOLATION", label: "Platform Terms of Service Violation" },
  { code: "NON_PAYMENT", label: "Unpaid Commission or Chargeback Debt" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All Companies" },
  { id: "verified", label: "Verified" },
  { id: "pending_verification", label: "Pending" },
  { id: "suspended", label: "Suspended" },
];

export default function CompaniesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeCompany, setActiveCompany] = useState<CompanyRow | null>(null);
  const [suspendCompanyTarget, setSuspendCompanyTarget] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/companies?limit=100");
      const payload = response.data.data || response.data;
      const list = Array.isArray(payload) ? payload : (payload.companies || payload.data || []);
      setCompanies(list);
    } catch {
      toast({ title: "Error", description: "Failed to load companies", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSuspendConfirm = async (reasonCode?: string, notes?: string) => {
    if (!suspendCompanyTarget) return;
    try {
      const isCurrentlySuspended = suspendCompanyTarget.subscriptionStatus === "suspended";
      const newStatus = isCurrentlySuspended ? "active" : "suspended";
      await api.patch(`/admin/companies/${suspendCompanyTarget.id}`, {
        subscriptionStatus: newStatus,
        statusReason: reasonCode,
        statusNotes: notes,
      });
      toast({
        title: "Success",
        description: `Company ${isCurrentlySuspended ? "reactivated" : "suspended"} successfully.`,
      });
      fetchCompanies();
    } catch {
      toast({ title: "Error", description: "Failed to update company suspension status", variant: "destructive" });
    } finally {
      setSuspendCompanyTarget(null);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const rawStatus = c.subscriptionStatus === "suspended" ? "suspended" : (c.verificationStatus || "pending_verification");
    if (statusFilter !== "all" && rawStatus !== statusFilter) return false;
    if (!search) return true;
    const query = search.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const owner = (c.owner?.fullName || "").toLowerCase();
    const city = (c.city || "").toLowerCase();
    return name.includes(query) || owner.includes(query) || city.includes(query);
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "company",
      header: "Organization",
      isSortable: true,
      cell: ({ row }) => {
        const initials = (row.name || "CO")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center font-bold text-xs text-foreground/90 dark:text-muted-foreground/50 shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground dark:text-foreground">{row.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {row.city || "Phnom Penh"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="font-medium text-foreground dark:text-foreground/90">{row.owner?.fullName || "Unassigned"}</div>
          <div className="text-[11px] text-muted-foreground/70">{row.owner?.email || "No email"}</div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground dark:text-muted-foreground/70">
          {row.phone || row.owner?.phone || "—"}
        </span>
      ),
    },
    {
      id: "staff",
      header: "Staff",
      align: "center",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground/90 dark:text-muted-foreground/50">
          {row.staffCount || row._count?.staffMembers || 0}
        </span>
      ),
    },
    {
      id: "rating",
      header: "CSAT",
      align: "center",
      isSortable: true,
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 font-semibold text-xs text-foreground dark:text-foreground/90">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {row.rating ? Number(row.rating).toFixed(1) : "5.0"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => {
        const isSuspended = row.subscriptionStatus === "suspended";
        return <StatusPill status={isSuspended ? "suspended" : (row.verificationStatus || "pending")} />;
      },
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => {
        const isSuspended = row.subscriptionStatus === "suspended";
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/admin/companies/${row.id}`);
              }}
              className="px-2 py-1 rounded text-xs font-semibold text-muted-foreground dark:text-muted-foreground/50 hover:bg-muted dark:hover:bg-muted transition"
            >
              360° Profile
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuspendCompanyTarget(row);
              }}
              className={cn(
                "p-1 rounded text-xs font-semibold transition",
                isSuspended
                  ? "text-emerald-600 hover:bg-emerald-50"
                  : "text-rose-600 hover:bg-rose-50"
              )}
              title={isSuspended ? "Reactivate Organization" : "Suspend Organization"}
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ManagementDataGrid
        title="Marketplace Organizations"
        description="Comprehensive directory of registered service provider companies, compliance standing, and operational metrics."
        primaryAction={{
          label: "Onboard Company",
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setAddModalOpen(true),
        }}
        secondaryActions={[
          {
            label: "Refresh List",
            icon: <RefreshCw className="w-3.5 h-3.5" />,
            onClick: fetchCompanies,
          },
        ]}
        data={filteredCompanies}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        onRowClick={(r) => router.push(`/admin/companies/${r.id}`)}
        searchPlaceholder="Search company, owner, or city..."
        onSearchChange={setSearch}
        filterSlots={
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  statusFilter === tab.id
                    ? "bg-[#0A192F] text-white shadow-xs font-semibold"
                    : "text-muted-foreground dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
        totalCount={filteredCompanies.length}
        pageSize={25}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No companies found",
          description: "There are no service organizations matching your selected filter parameters.",
          actionLabel: "Onboard First Organization",
          onActionClick: () => setAddModalOpen(true),
        }}
      />

      {/* Two-step Destructive Action Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(suspendCompanyTarget)}
        onClose={() => setSuspendCompanyTarget(null)}
        title={
          suspendCompanyTarget?.subscriptionStatus === "suspended"
            ? `Reactivate ${suspendCompanyTarget?.name}`
            : `Suspend ${suspendCompanyTarget?.name}`
        }
        description={
          suspendCompanyTarget?.subscriptionStatus === "suspended"
            ? "Reactivating this organization will restore their active marketplace listings and staff dispatch abilities."
            : "Suspending this organization will immediately disable their listings, cancel pending dispatches, and notify company management."
        }
        actionType={suspendCompanyTarget?.subscriptionStatus === "suspended" ? "warning" : "danger"}
        confirmLabel={suspendCompanyTarget?.subscriptionStatus === "suspended" ? "Confirm Reactivation" : "Suspend Organization"}
        reasonOptions={SUSPEND_REASONS}
        requireReason={suspendCompanyTarget?.subscriptionStatus !== "suspended"}
        onConfirm={handleSuspendConfirm}
      />

      {/* Onboard Company Modal */}
      <AddCompanyModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchCompanies}
      />
    </div>
  );
}
