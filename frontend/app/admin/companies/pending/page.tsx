"use client";
import { useState, useEffect } from "react";
import { Search, Check, X, Eye, Building2, Loader2 } from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ErrorState } from "@/components/common/ErrorState";
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

/** Company row shape returned by GET /admin/companies?status=pending */
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

  // ── Real API state (replaces the old hardcoded sample rows) ──
  const [companies, setCompanies] = useState<PendingCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Initial load
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

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      label: "Company",
      render: (item: PendingCompany) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-lg">
            <AvatarFallback className="rounded-lg bg-warning/10 text-warning text-sm font-medium">
              {(item.name || "C").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email || item.phone || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "city", label: "Location", render: (item: PendingCompany) => item.city || item.address || "—" },
    { key: "createdAt", label: "Submitted", render: (item: PendingCompany) => new Date(item.createdAt).toLocaleDateString() },
    {
      key: "staff",
      label: "Staff",
      render: (item: PendingCompany) => <span className="font-medium">{item.staffCount ?? 0}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (item: PendingCompany) => <StatusBadge status={item.verificationStatus === "pending" ? "pending" : item.verificationStatus === "rejected" ? "rejected" : "approved"} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: PendingCompany) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCompany(item);
              setDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
            disabled={actionLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(item);
            }}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={actionLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleReject(item);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ),
      className: "w-40",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pending companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load applications" message={error} onRetry={fetchCompanies} />
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display text-xl font-semibold text-foreground">No pending applications</h3>
          <p className="mt-2 max-w-sm text-muted-foreground">
            All company registrations have been reviewed.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredCompanies} />
      )}

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!actionLoading) setDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the company application details before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-warning/10 text-warning text-xl font-medium">
                    {(selectedCompany.name || "C").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedCompany.name}</h3>
                  <p className="text-muted-foreground">{selectedCompany.email || selectedCompany.phone || "—"}</p>
                </div>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span>{selectedCompany.city || selectedCompany.address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{selectedCompany.phone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(selectedCompany.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Staff members</span>
                  <span>{selectedCompany.staffCount ?? 0}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={actionLoading}
              onClick={() => selectedCompany && handleReject(selectedCompany)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button disabled={actionLoading} onClick={() => selectedCompany && handleApprove(selectedCompany)}>
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
