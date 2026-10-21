"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Check, X, Eye, Building2, Loader2, MapPin, Mail, Phone, Calendar } from "lucide-react";
import { ManagementDataGrid, ColumnDef } from "@/components/admin/ManagementDataGrid";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface PendingCompany {
  id: string;
  name: string;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  createdAt: string;
  verificationStatus: "pending" | "verified" | "rejected" | string;
  staffCount?: number;
}

export default function PendingCompaniesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<PendingCompany | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/companies", {
        params: { status: "pending", limit: 100 },
      });
      const payload = res.data?.data;
      setCompanies(Array.isArray(payload) ? payload : []);
    } catch {
      setError("Could not load pending company applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleApprove = async (company: PendingCompany) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/companies/${company.id}/accept`);
      toast.success(`${company.name} has been approved!`);
      setDialogOpen(false);
      fetchCompanies();
    } catch {
      toast.error(`Failed to approve ${company.name}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (company: PendingCompany) => {
    setActionLoading(true);
    try {
      await api.post(`/admin/companies/${company.id}/reject`, { reason: "Application rejected by admin" });
      toast.error(`${company.name} has been rejected.`);
      setDialogOpen(false);
      fetchCompanies();
    } catch {
      toast.error(`Failed to reject ${company.name}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (company.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, page, pageSize]);

  const columns: ColumnDef<PendingCompany>[] = [
    {
      id: "name",
      header: "Company",
      isSortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-xl border border-border">
            <AvatarFallback className="rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold">
              {(row.name || "C").split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-foreground">{row.name}</span>
            <span className="text-[11px] text-muted-foreground">{row.email || row.phone || "—"}</span>
          </div>
        </div>
      ),
    },
    {
      id: "city",
      header: "Location",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.city || row.address || "—"}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Submitted",
      isSortable: true,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "staff",
      header: "Staff Count",
      align: "center",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-foreground font-mono">
          {row.staffCount ?? 0}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: ({ row }) => (
        <StatusBadge status={row.verificationStatus === "pending" ? "pending" : row.verificationStatus === "rejected" ? "rejected" : "approved"} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSelectedCompany(row);
              setDialogOpen(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
            disabled={actionLoading}
            onClick={() => handleApprove(row)}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
            disabled={actionLoading}
            onClick={() => handleReject(row)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-hidden bg-background">
      <ManagementDataGrid
        title="Pending Merchant Applications"
        description="Review and adjudicate service business onboarding registrations and vetting credentials."
        data={paginatedCompanies}
        columns={columns}
        getRowId={(r) => r.id}
        isLoading={loading}
        error={error}
        onRetry={fetchCompanies}
        onRowClick={(row) => {
          setSelectedCompany(row);
          setDialogOpen(true);
        }}
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        searchPlaceholder="Search pending companies by name, city, or email..."
        totalCount={filteredCompanies.length}
        pageSize={pageSize}
        currentPage={page}
        onPageChange={setPage}
        emptyState={{
          title: "No pending applications",
          description: searchQuery
            ? "No company applications match your search query."
            : "All company registrations have been reviewed and adjudicated.",
        }}
      />

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!actionLoading) setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md bg-background border border-border rounded-2xl p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-foreground">Review Application</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Review the company application details before approving or rejecting.
              </DialogDescription>
            </DialogHeader>
          </div>
          {selectedCompany && (
            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="flex items-center gap-3.5">
                <Avatar className="h-12 w-12 rounded-xl border border-border">
                  <AvatarFallback className="rounded-xl bg-amber-500/10 text-amber-600 text-sm font-bold">
                    {(selectedCompany.name || "C").split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{selectedCompany.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{selectedCompany.email || selectedCompany.phone || "—"}</p>
                </div>
              </div>
              <div className="grid gap-2.5 rounded-xl border border-border bg-card p-3.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-semibold text-foreground">{selectedCompany.city || selectedCompany.address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-semibold text-foreground">{selectedCompany.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-semibold text-foreground">{new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff members</span>
                  <span className="font-mono font-semibold text-foreground">{selectedCompany.staffCount ?? 0}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-4 border-t border-border bg-muted/20 gap-2">
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => selectedCompany && handleReject(selectedCompany)}
              className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10 text-xs h-8.5"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
            <Button 
              disabled={actionLoading} 
              onClick={() => selectedCompany && handleApprove(selectedCompany)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8.5 font-bold"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
