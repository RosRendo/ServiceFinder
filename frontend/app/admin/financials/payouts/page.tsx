"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { motion } from "framer-motion";

interface PayoutRequest {
  id: string;
  ownerId: string;
  amount: number;
  destinationBank: string;
  accountName: string;
  accountNumber: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/financials/payout-requests');
      setRequests(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load payout requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleProcess = async (id: string, status: 'paid' | 'rejected') => {
    setProcessingId(id);
    try {
      await api.patch(`/admin/financials/payout-requests/${id}`, {
        status,
        adminNotes: `Processed as ${status} by admin`
      });
      toast({ title: "Success", description: `Payout request marked as ${status}.` });
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: `Failed to process payout request.`, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 lg:px-0 py-4">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Payout Approvals</h1>
          <p className="text-sm font-medium text-gray-500">Review and process company withdrawal requests</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-0 py-8 space-y-8">
        
        {/* Pending Requests */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
                No pending payout requests.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-amber-200 shadow-sm rounded-lg overflow-hidden">
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Company ID</p>
                        <p className="text-sm font-semibold text-gray-900 font-mono">{req.ownerId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Requested Amount</p>
                        <p className="text-lg font-bold text-gray-900">${req.amount.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-medium mb-1">Bank Details</p>
                        <p className="text-sm font-semibold text-gray-900">{req.destinationBank}</p>
                        <p className="text-xs text-gray-600">{req.accountName} • {req.accountNumber}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        className="flex-1 md:flex-none border-rose-200 text-rose-600 hover:bg-rose-50"
                        disabled={processingId === req.id}
                        onClick={() => handleProcess(req.id, 'rejected')}
                      >
                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reject
                      </Button>
                      <Button 
                        className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
                        disabled={processingId === req.id}
                        onClick={() => handleProcess(req.id, 'paid')}
                      >
                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Mark as Paid
                      </Button>
                    </div>

                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Processed Requests */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span> Processed History
          </h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {processedRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No processed requests yet.</div>
              ) : (
                processedRequests.map((req) => (
                  <div key={req.id} className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${req.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {req.status}
                        </span>
                        <p className="text-sm font-semibold text-gray-900">${req.amount.toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-gray-500">Company ID: {req.ownerId} • {format(new Date(req.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-900">{req.destinationBank}</p>
                      <p className="text-xs text-gray-500">{req.accountNumber}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
