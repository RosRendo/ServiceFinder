import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Check, X } from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";

interface VerifyCompanyModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  documentUrl?: string;
  onSuccess?: () => void;
}

export function VerifyCompanyModal({ open, onClose, companyId, companyName, documentUrl, onSuccess }: VerifyCompanyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/companies/${companyId}/accept`);
      toast({ title: "Success", description: "Company approved and verified successfully" });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to approve company", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/companies/${companyId}/reject`, { reason });
      toast({ title: "Success", description: "Company registration rejected" });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to reject company", variant: "destructive" });
    } finally {
      setLoading(false);
      setRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Company KYC</DialogTitle>
          <DialogDescription>
            Review documentation for {companyName} and decide their registration status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center justify-center text-center space-y-3">
            <FileText className="w-10 h-10 text-violet-600" />
            <div>
              <p className="text-sm font-semibold text-foreground">KYC Verification Document</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uploaded business registration or licensing credentials</p>
            </div>
            {documentUrl ? (
              <a href={documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors">
                View Document in New Tab
              </a>
            ) : (
              <span className="text-xs text-rose-500 font-medium">No document uploaded</span>
            )}
          </div>

          {rejecting && (
            <div className="space-y-2 border-t pt-3">
              <Label htmlFor="reason">Rejection Reason <span className="text-rose-500">*</span></Label>
              <Textarea 
                id="reason" 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Explain why the document was rejected (e.g. expired license, invalid ID)..." 
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-2">
          {rejecting ? (
            <>
              <Button variant="outline" onClick={() => setRejecting(false)} disabled={loading}>Back</Button>
              <Button onClick={handleReject} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Rejection
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={() => setRejecting(true)} disabled={loading} className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold">
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={loading || !documentUrl} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Check className="w-4 h-4 mr-2" />
                Approve & Verify
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
