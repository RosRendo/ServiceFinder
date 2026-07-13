"use client";
import { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Eye, Building2, Mail, Phone, MapPin, FileText, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function VerificationPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [verifiedToday, setVerifiedToday] = useState(0);
  const [rejectedToday, setRejectedToday] = useState(0);

  useEffect(() => { fetchPendingCompanies(); fetchTodayStats(); }, []);

  const fetchPendingCompanies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=pending&limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("token");
      const [verRes, rejRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=verified&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?status=rejected&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/verify`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${selectedCompany.id}/reject`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        toast.success("Company rejected"); setRejectedToday((v) => v + 1);
        fetchPendingCompanies(); setSelectedCompany(null); setShowRejectModal(false); setRejectReason("");
      } else toast.error("Failed to reject");
    } catch { toast.error("Error rejecting"); }
    finally { setVerifying(false); }
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Verification Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve pending company registrations</p>
        </div>
        <button
          onClick={() => { fetchPendingCompanies(); fetchTodayStats(); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Review", value: loading ? "—" : companies.length, color: "text-amber-600", bg: "bg-amber-50", icon: Shield },
          { label: "Verified Today", value: verifiedToday, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle },
          { label: "Rejected Today", value: rejectedToday, color: "text-rose-600", bg: "bg-rose-50", icon: XCircle },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color} mt-0.5`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Shield className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">All caught up — no pending verifications</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
                  <th className="px-5 py-3 text-left">Company</th>
                  <th className="px-5 py-3 text-left">Owner</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Submitted</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{company.name}</div>
                          {company.registrationNumber && (
                            <div className="text-xs text-gray-400 font-mono">{company.registrationNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-700">{company.owner?.fullName || "—"}</div>
                      <div className="text-xs text-gray-400">{company.owner?.email || ""}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />{company.city || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleVerify(company.id)} disabled={verifying}
                          className="px-3 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-60"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => { setSelectedCompany(company); setShowRejectModal(true); }}
                          className="px-3 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedCompany && !showRejectModal} onOpenChange={(open) => !open && setSelectedCompany(null)}>
        <DialogContent className="max-w-xl rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-xl">
          {selectedCompany && (
            <>
              <div className="px-6 py-4 border-b border-gray-100">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold text-gray-900">{selectedCompany.name}</DialogTitle>
                  <DialogDescription className="text-xs text-gray-500">Full company review details</DialogDescription>
                </DialogHeader>
              </div>
              <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
                {selectedCompany.description && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">{selectedCompany.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Reg. Number", value: selectedCompany.registrationNumber || "N/A" },
                    { label: "City", value: selectedCompany.city || "N/A" },
                    { label: "Phone", value: selectedCompany.phone || "N/A" },
                    { label: "Email", value: selectedCompany.email || "N/A" },
                    { label: "Submitted", value: new Date(selectedCompany.createdAt).toLocaleDateString() },
                  ].map((f) => (
                    <div key={f.label} className="bg-gray-50 rounded-md p-3 border border-gray-100">
                      <div className="text-xs text-gray-400 mb-1">{f.label}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{f.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Owner</div>
                  <div className="bg-gray-50 rounded-md p-3 border border-gray-100 grid grid-cols-2 gap-3">
                    <div><div className="text-xs text-gray-400">Name</div><div className="text-sm font-medium">{selectedCompany.owner?.fullName || "N/A"}</div></div>
                    <div><div className="text-xs text-gray-400">Email</div><div className="text-sm font-medium truncate">{selectedCompany.owner?.email || "N/A"}</div></div>
                  </div>
                </div>
                {selectedCompany.verificationDocumentUrl && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents</div>
                    <div className="flex items-center justify-between bg-gray-50 rounded-md p-3 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div><div className="text-sm font-medium text-gray-900">Verification Document</div><div className="text-xs text-gray-400">Uploaded by company</div></div>
                      </div>
                      <button onClick={() => window.open(selectedCompany.verificationDocumentUrl, "_blank")} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-gray-700 transition-colors">
                        View
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={() => setSelectedCompany(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Close</button>
                <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors">Reject</button>
                <button onClick={() => handleVerify(selectedCompany.id)} disabled={verifying} className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-60">
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Company"}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={(open) => !open && setShowRejectModal(false)}>
        <DialogContent className="max-w-md rounded-lg border border-gray-200 bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              <AlertCircle className="w-4 h-4 text-rose-500" /> Reject Company
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">Provide a reason for rejecting <strong>{selectedCompany?.name}</strong></DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
            placeholder="Enter rejection reason..."
            className="w-full mt-2 px-3 py-2.5 text-sm border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 resize-none transition-colors"
          />
          <DialogFooter className="gap-3 mt-2">
            <button onClick={() => { setShowRejectModal(false); setRejectReason(""); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={verifying || !rejectReason.trim()} className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors disabled:opacity-60">
              {verifying ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null} Confirm Rejection
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
