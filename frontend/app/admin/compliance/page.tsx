"use client";

import { useState } from "react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusPill } from "@/components/admin/StatusPill";
import { Shield, RefreshCw, Download, Building, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAdminCompliance, ComplianceDocument } from "@/lib/hooks/useAdminCompliance";
import { ComplianceDrawer } from "@/components/drawers/ComplianceDrawer";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "pending", label: "Pending Review" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All Documents" },
];

export default function ComplianceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplianceDocument["status"] | "all">("pending");
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [page, setPage] = useState(1);
  const { documents, loading, error, refetch, updateDocumentStatus, actionLoading } = useAdminCompliance();

  const handleApprove = async (docId: string) => {
    try {
      await updateDocumentStatus(docId, "approved");
      toast.success("Document approved successfully.");
      refetch();
      setSelectedDoc(null);
    } catch {
      toast.error("Failed to approve document.");
    }
  };

  const handleReject = async (docId: string, reason: string) => {
    try {
      await updateDocumentStatus(docId, "rejected", reason);
      toast.success("Document rejected.");
      refetch();
      setSelectedDoc(null);
    } catch {
      toast.error("Failed to reject document.");
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const rejectedCount = documents.filter((d) => d.status === "rejected").length;

  const columns: ColumnDef<ComplianceDocument>[] = [
    {
      id: "companyName",
      header: "Provider Name",
      sortable: true,
      accessorFn: (doc) => doc.companyName,
      cell: (doc) => (
        <span className="font-semibold text-foreground text-sm">
          {doc.companyName}
        </span>
      ),
    },
    {
      id: "documentType",
      header: "Credential / License",
      sortable: true,
      accessorFn: (doc) => doc.documentType,
      cell: (doc) => (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground text-xs">
          <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
          {doc.documentType}
        </span>
      ),
    },
    {
      id: "uploadedAt",
      header: "Submission Date",
      sortable: true,
      accessorFn: (doc) => doc.uploadedAt,
      cell: (doc) => (
        <span className="text-xs font-mono text-muted-foreground">
          {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "status",
      header: "Review Status",
      sortable: true,
      accessorFn: (doc) => doc.status,
      cell: (doc) => (
        <StatusPill status={doc.status} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (doc) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedDoc(doc)}
          >
            Inspect Document
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance & Credentials</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review and audit provider trade licenses, business certifications, and liability insurance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pending Review
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {loading ? "—" : pendingCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Documents requiring verification</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Approved Credentials
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {approvedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Active compliant provider files</p>
        </div>

        <div className="management-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Rejected / Deficient
          </p>
          <p className="text-xl font-mono font-bold text-foreground">
            {rejectedCount}
          </p>
          <p className="text-[11px] text-muted-foreground">Action required by applicant</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id as any);
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

      {/* DataGrid */}
      <ManagementDataGrid
        data={filteredDocs}
        columns={columns}
        isLoading={loading}
        searchPlaceholder="Filter by provider name, document type..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        page={page}
        pageSize={15}
        totalItems={filteredDocs.length}
        onPageChange={setPage}
        onRowClick={(doc) => setSelectedDoc(doc)}
        emptyState={{
          title: "No compliance documents found",
          description: statusFilter === "all"
            ? "No regulatory or compliance documents submitted."
            : `All caught up. No documents pending review under status "${statusFilter}".`,
        }}
      />

      {/* Slide-out Inspection Drawer */}
      <ComplianceDrawer
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </div>
  );
}
