"use client";
import { useState, useEffect, useCallback } from "react";
import { Shield, CheckCircle, XCircle, FileText, Loader2, RefreshCw, AlertCircle, Check, X, Search, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataGrid, Column } from "@/components/grid/DataGrid";
import { BulkActionBar } from "@/components/grid/BulkActionBar";
import { cn } from "@/lib/utils";

export default function VerificationPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [verifiedToday, setVerifiedToday] = useState(0);
  const [rejectedToday, setRejectedToday] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => { fetchPendingCompanies(); fetchTodayStats(); }, []);

  const fetchPendingCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=pending&limit=50`, {
        credentials: 'include',
      });
      const data = await res.json();
      let list = [];
      if (Array.isArray(data.data?.data)) list = data.data.data;
      else if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.data?.companies)) list = data.data.companies;
      else if (Array.isArray(data.companies)) list = data.companies;
      setCompanies(list);
    } catch { toast.error("Failed to load pending companies"); }
    finally { setLoading(false); }
  };

  const fetchTodayStats = async () => {
    try {
      const [verRes, rejRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=verified&limit=100`, { credentials: 'include', }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=rejected&limit=100`, { credentials: 'include', }),
      ]);
      const verData = await verRes.json();
      const rejData = await rejRes.json();
      const today = new Date().toDateString();
      let vArr = [];
      if (Array.isArray(verData.data?.data)) vArr = verData.data.data;
      else if (Array.isArray(verData.data)) vArr = verData.data;
      else if (Array.isArray(verData.data?.companies)) vArr = verData.data.companies;
      else if (Array.isArray(verData.companies)) vArr = verData.companies;
      
      let rArr = [];
      if (Array.isArray(rejData.data?.data)) rArr = rejData.data.data;
      else if (Array.isArray(rejData.data)) rArr = rejData.data;
      else if (Array.isArray(rejData.data?.companies)) rArr = rejData.data.companies;
      else if (Array.isArray(rejData.companies)) rArr = rejData.companies;
      setVerifiedToday(vArr.filter((c: any) => new Date(c.updatedAt).toDateString() === today).length);
      setRejectedToday(rArr.filter((c: any) => new Date(c.updatedAt).toDateString() === today).length);
    } catch {}
  };

  const handleVerify = async (companyId: string) => {
    if (!confirm("Verify this company?")) return;
    setVerifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include',
      });
      if (res.ok) { toast.success("Company verified"); setVerifiedToday((v) => v + 1); fetchPendingCompanies(); setSelectedCompany(null); }
      else toast.error("Failed to verify");
    } catch { toast.error("Error verifying"); }
    finally { setVerifying(false); }
  };

  const handleReject = async () => {
    if (!selectedCompany || !rejectReason.trim()) { toast.error("Provide a rejection reason"); return; }
    setVerifying(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selectedCompany.id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        toast.success("Company rejected"); setRejectedToday((v) => v + 1);
        fetchPendingCompanies(); setSelectedCompany(null); setShowRejectModal(false); setRejectReason("");
      } else toast.error("Failed to reject");
    } catch { toast.error("Error rejecting"); }
    finally { setVerifying(false); }
  };

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((c) => c.id)));
  }, [companies]);

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.owner?.fullName?.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<any>[] = [
    {
      key: "name", header: "Company", sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="font-bold text-foreground transition-colors">{c.name}</div>
            {c.registrationNumber && (
              <div className="text-[10px] font-mono font-medium text-muted-foreground mt-0.5">
                {c.registrationNumber}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: "owner", header: "Owner",
      render: (c) => (
        <div>
          <div className="text-sm font-bold text-foreground">{c.owner?.fullName || "—"}</div>
          <div className="text-[10px] font-semibold text-muted-foreground">{c.owner?.email || ""}</div>
        </div>
      )
    },
    {
      key: "city", header: "Location",
      render: (c) => (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />{c.city || "—"}
        </span>
      )
    },
    {
      key: "createdAt", header: "Submitted", sortable: true,
      render: (c) => (
        <span className="text-sm font-semibold text-muted-foreground">
          {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )
    }
  ];

  const handleBulkApprove = async () => {
    if (!window.confirm(`Approve ${selectedIds.size} company application(s)?`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}/accept`, {
            method: "POST",
            credentials: 'include',
          })
        )
      );
      toast.success(`${selectedIds.size} company application(s) approved.`);
      setSelectedIds(new Set());
      fetchPendingCompanies();
    } catch {
      toast.error("Failed to approve one or more applications.");
    }
  };

  const handleBulkReject = async () => {
    if (!window.confirm(`Reject ${selectedIds.size} company application(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }, credentials: 'include',
            body: JSON.stringify({ reason: "Bulk rejection by admin." }),
          })
        )
      );
      toast.success(`${selectedIds.size} company application(s) rejected.`);
      setSelectedIds(new Set());
      fetchPendingCompanies();
    } catch {
      toast.error("Failed to reject one or more applications.");
    }
  };

  const bulkActions = [
    { label: "Approve Selected", icon: Check, onClick: handleBulkApprove },
    { label: "Reject Selected", icon: X, onClick: handleBulkReject, variant: "danger" as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative bg-background font-sans">
      
      {/* Flush Top Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-border bg-background">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input 
            value={search} onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search applications..."
            className="w-full pl-9 pr-3 h-9 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-violet-500/60 transition-colors" 
          />
        </div>
        <div className="flex-1" />
        <button onClick={() => { fetchPendingCompanies(); fetchTodayStats(); }} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-sm text-foreground hover:bg-muted/50 bg-background transition-colors">
          <RefreshCw className="w-3.5 h-3.5 opacity-70" /> Refresh Queue
        </button>
      </div>

      {/* Flush Stats Row */}
      <div className="shrink-0 flex items-center gap-6 px-6 py-2.5 border-b border-border bg-muted/10">
        {[
          { label: "Pending Review", value: loading ? "—" : companies.length, color: "text-amber-500" },
          { label: "Verified Today", value: verifiedToday, color: "text-emerald-500" },
          { label: "Rejected Today", value: rejectedToday, color: "text-rose-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Full-height DataGrid */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <DataGrid
            columns={columns}
            data={filtered}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onRowClick={(company) => setSelectedCompany(company)}
            emptyIcon={Shield}
            emptyMessage="All caught up. No pending verifications."
          />
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={bulkActions}
      />

      {/* Detail Modal (Kept Existing Logic/Structure, matched styling to Shadcn) */}
      <Dialog open={!!selectedCompany && !showRejectModal} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-xl rounded-2xl border border-border bg-background p-0 overflow-hidden shadow-2xl">
          {selectedCompany && (
            <>
              <div className="px-8 py-6 border-b border-border bg-muted/30">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">{selectedCompany.name}</DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground">Full company review details</DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-8 py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {selectedCompany.description && (
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Description</div>
                    <p className="text-sm font-medium text-foreground bg-muted/20 p-4 rounded-xl border border-border">{selectedCompany.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Reg. Number", value: selectedCompany.registrationNumber || "N/A" },
                    { label: "City", value: selectedCompany.city || "N/A" },
                    { label: "Phone", value: selectedCompany.phone || "N/A" },
                    { label: "Email", value: selectedCompany.email || "N/A" },
                    { label: "Submitted", value: new Date(selectedCompany.createdAt).toLocaleDateString() },
                  ].map((f) => (
                    <div key={f.label} className="bg-muted/20 rounded-xl p-4 border border-border">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">{f.label}</div>
                      <div className="text-sm font-bold text-foreground truncate">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Owner Details</div>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border grid grid-cols-2 gap-4">
                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Name</div><div className="text-sm font-bold text-foreground">{selectedCompany.owner?.fullName || "N/A"}</div></div>
                    <div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Email</div><div className="text-sm font-bold text-foreground truncate">{selectedCompany.owner?.email || "N/A"}</div></div>
                  </div>
                </div>
                {selectedCompany.verificationDocumentUrl && (
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Documents</div>
                    <div className="flex items-center justify-between bg-muted/20 rounded-xl p-4 border border-border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">Verification Document</div>
                          <div className="text-xs font-medium text-muted-foreground">Uploaded by company</div>
                        </div>
                      </div>
                      <button onClick={() => window.open(selectedCompany.verificationDocumentUrl, "_blank")} className="px-4 py-2 text-xs font-bold border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-colors">
                        View File
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-8 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button onClick={() => setSelectedCompany(null)} className="px-5 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">Close</button>
                <button onClick={() => setShowRejectModal(true)} className="px-5 py-2 text-sm font-bold text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors">Reject Application</button>
                <button onClick={() => handleVerify(selectedCompany.id)} disabled={verifying} className="px-5 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2">
                  {verifying && <Loader2 className="w-4 h-4 animate-spin" />} Approve
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={(open) => !open && setShowRejectModal(false)}>
        <DialogContent className="max-w-md rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" /> 
              </div>
              Reject Company
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground mt-2">
              Provide a reason for rejecting <strong>{selectedCompany?.name}</strong>. They will receive an email with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              placeholder="e.g., The verification document provided is illegible..."
              className="w-full px-4 py-3 text-sm font-medium border border-border rounded-xl bg-muted/30 focus:outline-none focus:border-rose-500/60 resize-none transition-colors"
            />
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }} className="px-5 py-2 text-sm font-bold text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={verifying || !rejectReason.trim()} className="px-5 py-2 text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2">
              {verifying && <Loader2 className="w-4 h-4 animate-spin" />} Confirm Rejection
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
