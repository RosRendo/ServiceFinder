"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, CheckCircle2, ShieldAlert, Scale, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { motion } from "framer-motion";

interface Dispute {
  id: number;
  bookingId: string;
  customerId: string;
  companyId: string;
  type: string;
  description: string;
  status: string;
  companyResponse?: string;
  adminDecision?: string;
  refundAmount?: string;
  createdAt: string;
  customer: { id: string; fullName: string };
  company: { id: string; name: string };
  booking: { id: string; totalPrice: string };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionData, setResolutionData] = useState({
    adminDecision: "",
    refundAmount: "0",
    status: "resolved",
  });

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/admin/disputes');
      setDisputes(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load disputes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolveSubmit = async () => {
    if (!selectedDispute) return;
    if (!resolutionData.adminDecision) {
      toast({ title: "Missing Information", description: "Please provide a decision/reasoning.", variant: "destructive" });
      return;
    }

    setResolving(true);
    try {
      await api.patch(`/admin/disputes/${selectedDispute.id}`, {
        status: resolutionData.status,
        adminDecision: resolutionData.adminDecision,
        refundAmount: parseFloat(resolutionData.refundAmount || "0"),
      });

      toast({ title: "Success", description: "Dispute resolved successfully." });
      setResolveOpen(false);
      fetchDisputes();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to resolve dispute.", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const openResolveModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolutionData({
      adminDecision: dispute.adminDecision || "",
      refundAmount: dispute.refundAmount || "0",
      status: dispute.status === 'open' ? 'resolved' : dispute.status,
    });
    setResolveOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const openDisputes = disputes.filter(d => d.status === 'open');
  const closedDisputes = disputes.filter(d => d.status !== 'open');

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 lg:px-0 py-4">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Dispute Resolution</h1>
          <p className="text-sm font-medium text-gray-500">Manage conflicts between customers and service providers</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-0 py-8 space-y-8">
        
        {/* Open Disputes */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Action Required ({openDisputes.length})
          </h2>
          <div className="space-y-4">
            {openDisputes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                No open disputes requiring attention.
              </div>
            ) : (
              openDisputes.map((dispute) => (
                <motion.div key={dispute.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-rose-200 shadow-sm rounded-lg overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-rose-100 text-rose-700">
                            {dispute.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-500">
                            Reported {format(new Date(dispute.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Booking #{dispute.bookingId}</h3>
                      </div>
                      <Button onClick={() => openResolveModal(dispute)} className="w-full md:w-auto bg-gray-900 text-white">
                        <Scale className="w-4 h-4 mr-2" /> Resolve Dispute
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500">Customer Complaint</p>
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                          {dispute.description}
                        </div>
                        <p className="text-xs text-gray-500">Customer: {dispute.customer.fullName}</p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500">Company Details</p>
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700">
                          <strong>Company:</strong> {dispute.company.name}<br/>
                          <strong>Booking Value:</strong> ${dispute.booking.totalPrice}
                        </div>
                        {dispute.companyResponse && (
                          <div className="text-sm text-gray-700 mt-2">
                            <span className="font-semibold block mb-1">Company Response:</span>
                            {dispute.companyResponse}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Closed Disputes */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gray-400" /> Resolved Disputes
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {closedDisputes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No resolved disputes yet.</div>
              ) : (
                closedDisputes.map((dispute) => (
                  <div key={dispute.id} className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openResolveModal(dispute)}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                          {dispute.status}
                        </span>
                        <p className="text-sm font-semibold text-gray-900">Booking #{dispute.bookingId}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate max-w-md">Decision: {dispute.adminDecision}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      {dispute.refundAmount && parseFloat(dispute.refundAmount) > 0 && (
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500">Refunded</p>
                          <p className="text-sm font-bold text-rose-600">${dispute.refundAmount}</p>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Resolution Modal */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedDispute?.status === 'open' ? 'Resolve Dispute' : 'Dispute Details'}</DialogTitle>
            <DialogDescription>
              Review the case and provide a final resolution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Decision / Notes</Label>
              <Textarea 
                placeholder="Explain the reason for this decision..." 
                value={resolutionData.adminDecision} 
                onChange={(e) => setResolutionData({...resolutionData, adminDecision: e.target.value})}
                disabled={selectedDispute?.status !== 'open'}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Refund Amount (if applicable)</Label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">$</span>
                <Input 
                  type="number" 
                  value={resolutionData.refundAmount} 
                  onChange={(e) => setResolutionData({...resolutionData, refundAmount: e.target.value})}
                  disabled={selectedDispute?.status !== 'open'}
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500">This amount will be deducted from the company's wallet and returned to the customer.</p>
            </div>
          </div>

          <DialogFooter>
            {selectedDispute?.status === 'open' ? (
              <>
                <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
                <Button onClick={handleResolveSubmit} disabled={resolving} className="bg-gray-900 text-white">
                  {resolving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Finalize Resolution
                </Button>
              </>
            ) : (
              <Button onClick={() => setResolveOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
