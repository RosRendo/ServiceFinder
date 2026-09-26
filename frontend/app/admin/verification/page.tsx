"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, RefreshCw, Building2, MapPin, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { VerificationDrawer } from "@/components/admin/VerificationDrawer";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { id: "pending", label: "Pending Review" },
  { id: "verified", label: "Verified Providers" },
  { id: "rejected", label: "Rejected / Incomplete" },
  { id: "all", label: "All Companies" },
];

export default function VerificationPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchCompanies = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params: any = { limit: 50 };
      if (activeTab !== "all") {
        params.status = activeTab;
      }
      const res = await api.get("/admin/companies", { params });
      const data = res.data;
      let list = [];
      if (Array.isArray(data.data?.data)) list = data.data.data;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.data?.companies)) list = data.data.companies;
      else if (Array.isArray(data.companies)) list = data.companies;
      setCompanies(list);
    } catch {
      setFetchError("Could not load company verification records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [activeTab]);

  const filteredCompanies = companies.filter((c) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const city = (c.city || "").toLowerCase();
    const reg = (c.registrationNumber || c.businessNumber || "").toLowerCase();
    return name.includes(query) || city.includes(query) || reg.includes(query);
  });

  const handleRowClick = (company: any) => {
    setSelectedCompany(company);
    setDrawerOpen(true);
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "name",
      header: "Organization",
      isSortable: true,
      cell: ({ row }) => {
        const initials = row.name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "CO";
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-center text-xs font-bold text-foreground/90 dark:text-muted-foreground/50 shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-semibold text-xs text-foreground dark:text-foreground">{row.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">
                {row.registrationNumber || row.businessNumber || "REG-PENDING"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Trade Category",
      cell: ({ row }) => (
        <span className="text-xs text-foreground/90 dark:text-muted-foreground/50 font-medium">
          {row.category || "Home Services"}
        </span>
      ),
    },
    {
      id: "city",
      header: "Location",
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground/70">
          <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" />
          <span>{row.city || "Phnom Penh"}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => <StatusPill status={row.verificationStatus || row.status || "pending"} />,
    },
    {
      id: "submittedAt",
      header: "Submitted",
      align: "center",
      isSortable: true,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Review",
      align: "right",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border dark:border-border text-xs font-semibold text-foreground/90 dark:text-muted-foreground/50 hover:bg-background dark:hover:bg-muted transition"
        >
          <span>Inspect</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const pendingCount = companies.filter((c) => (c.verificationStatus || c.status) === "pending").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ManagementDataGrid
        title="Provider Verification Queue"
        description="Inspect business credentials, audit license attachments, and authorize service providers on the marketplace."
        secondaryActions={[
          {
            label: "Refresh Queue",
            icon: <RefreshCw className="w-3.5 h-3.5" />,
            onClick: fetchCompanies,
          },
        ]}
        data={filteredCompanies}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={fetchError}
        onRetry={fetchCompanies}
        onRowClick={handleRowClick}
        searchPlaceholder="Search company name, city, or registration #..."
        onSearchChange={setSearch}
        filterSlots={
          <div className="flex items-center gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition",
                  activeTab === tab.id
                    ? "bg-[#0A192F] text-white shadow-xs font-semibold"
                    : "text-muted-foreground dark:text-muted-foreground/70 hover:bg-muted dark:hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
            {pendingCount > 0 && activeTab !== "pending" && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                <Clock className="w-3 h-3 text-amber-600" />
                {pendingCount} Awaiting Review
              </span>
            )}
          </div>
        }
        totalCount={filteredCompanies.length}
        pageSize={25}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No verification applications",
          description: "All submitted company licenses and regulatory documents have been reviewed.",
        }}
      />

      {/* Split-panel Verification Inspection Drawer */}
      <VerificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        company={selectedCompany}
        onVerified={fetchCompanies}
      />
    </div>
  );
}
