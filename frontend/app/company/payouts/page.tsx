"use client";
import { useState, useEffect } from "react";
import { DollarSign, Download, ArrowUpRight, History, CreditCard, Plus, Loader2, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { usePayouts, Payout } from "@/lib/hooks/usePayouts";
import { motion, AnimatePresence } from "framer-motion";

export default function CompanyPayoutsPage() {
  const { payouts: fetchedPayouts, availableBalance, loading, requestPayout, actionLoading, refetch } = usePayouts();
  
  const [balance, setBalance] = useState({ available: 0, pending: 0 });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showAddBank, setShowAddBank] = useState(false);
  
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>("");

  useEffect(() => {
    if (fetchedPayouts) {
      setPayouts(fetchedPayouts);
      setBalance({
        available: availableBalance || 0,
        pending: fetchedPayouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
      });
    }
  }, [fetchedPayouts, availableBalance]);

  const fetchMethods = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/payment-methods`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMethods(data.paymentMethods || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAddBank = async () => {
    if (!bankName.trim() || !accountNumber.trim()) {
      toast.error("Please fill in all bank details.");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/payment-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "bank_transfer", accountName: bankName, accountNumber }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success("Bank account added!");
        setShowAddBank(false);
        setBankName("");
        setAccountNumber("");
        fetchMethods();
      } else {
        toast.error("Failed to add bank account");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding bank account");
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance.available) {
      toast.error("Invalid payout amount.");
      return;
    }

    try {
      if (!methods.length) {
        toast.error("Please add a payout method first.");
        return;
      }
      const res = await requestPayout(amount, "bank_transfer");
      if (res && !res.error) {
        toast.success("Payout request submitted successfully.");
        setIsRequestModalOpen(false);
        setPayoutAmount("");
        refetch();
      } else {
        toast.error(res?.error || "Failed to submit payout request.");
      }
    } catch (err) {
      toast.error("An error occurred while requesting payout.");
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="pb-6 border-b border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Payouts & Earnings</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-xl">Manage your available balance and track payout history.</p>
          </div>
          <div className="relative z-10">
            <Button 
              onClick={() => { setPayoutAmount(balance.available.toString()); setIsRequestModalOpen(true); }}
              disabled={loading || balance.available <= 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 shadow-sm gap-2 font-bold px-6"
            >
              <ArrowUpRight className="w-4 h-4" /> Request Payout
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white shadow-lg border border-emerald-400 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full mix-blend-overlay" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-inner">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-emerald-50 text-lg">Available for Payout</h3>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">${loading ? "..." : balance.available.toFixed(2)}</p>
                <p className="text-emerald-100 text-sm mt-3 font-medium bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">Funds cleared and ready to be transferred.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full mix-blend-multiply opacity-50" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 shadow-sm">
                  <History className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Pending Clearance</h3>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight">${loading ? "..." : balance.pending.toFixed(2)}</p>
                <p className="text-gray-500 text-sm mt-3 font-medium bg-slate-100/80 w-fit px-3 py-1 rounded-full border border-gray-200">Funds from recent bookings currently in escrow.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Payout Method */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 tracking-tight">Payout Method</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Where your funds will be sent.</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {methods.length > 0 ? (
              <div className="bg-white/80 border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200 shadow-inner">
                    <CreditCard className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-bold text-lg text-gray-900 tracking-tight">{methods[0].accountName}</p>
                    <p className="text-xs font-medium text-gray-500 mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Added on {new Date(methods[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100 self-start sm:self-auto shadow-sm">
                  Active Primary
                </div>
              </div>
            ) : (
              <div>
                <AnimatePresence mode="wait">
                  {!showAddBank ? (
                    <motion.div
                      key="btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button onClick={() => setShowAddBank(true)} variant="outline" className="w-full sm:w-auto h-12 rounded-xl border-dashed border-2 border-slate-200 text-slate-600 hover:text-gray-900 hover:border-slate-300 hover:bg-gray-50 transition-all font-bold">
                        <Plus className="w-4 h-4 mr-2" /> Add Bank Account
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/80 p-6 rounded-2xl border border-gray-200 shadow-sm max-w-md space-y-5"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Building2 className="w-4 h-4" /></div>
                        <h4 className="font-bold text-gray-900">Add New Bank Account</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-500 font-medium">Bank Name</Label>
                          <Input 
                            placeholder="e.g. Chase, Bank of America" 
                            value={bankName} onChange={e => setBankName(e.target.value)} 
                            className="rounded-xl border-slate-200 h-11 bg-gray-50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-gray-500 font-medium">Account Number</Label>
                          <Input 
                            placeholder="Enter account number" 
                            value={accountNumber} onChange={e => setAccountNumber(e.target.value)} 
                            className="rounded-xl border-slate-200 h-11 bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button onClick={() => setShowAddBank(false)} variant="outline" className="flex-1 rounded-xl h-11 border-slate-200 font-bold bg-white">Cancel</Button>
                        <Button onClick={handleAddBank} className="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm">Save Details</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payout History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-200 bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                <History className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 tracking-tight">Payout History</h3>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Your recent withdrawal requests and their status.</p>
              </div>
            </div>
            <Button variant="outline" className="hidden sm:flex rounded-xl h-10 border-gray-200 bg-white/80 text-xs font-bold gap-2 shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="flex justify-center p-16">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : payouts.length > 0 ? (
              <>
                {/* Mobile View */}
                <div className="block lg:hidden divide-y divide-slate-100/50">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="p-5 space-y-4 bg-white/40">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-black text-gray-900 tracking-tight">${payout.amount.toFixed(2)}</p>
                          <p className="text-xs font-medium text-gray-500 mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded-md">{new Date(payout.requestedAt || (payout as any).date || Date.now()).toLocaleDateString()}</p>
                        </div>
                        {payout.status === 'completed' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-100 shadow-sm">Completed</span>}
                        {payout.status === 'pending' && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100 shadow-sm">Processing</span>}
                        {payout.status === 'failed' && <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-rose-100 shadow-sm">Failed</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-1.5 bg-gray-50 rounded-md border border-gray-200"><CreditCard className="w-3.5 h-3.5" /></div> 
                        {payout.method}
                        <span className="ml-auto font-mono text-[10px] text-slate-400 bg-gray-50 px-2 py-1 rounded-md">ID: {payout.id}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 font-medium">Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 font-medium">Transaction ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 font-medium">Method</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 font-medium">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 font-medium text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 bg-white/40">
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="hover:bg-white/80 transition-colors">
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-700">
                            {new Date(payout.requestedAt || (payout as any).date || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-xs font-mono font-bold text-gray-500 bg-gray-50 rounded-lg">
                            <span className="bg-slate-100/80 px-2 py-1 rounded-md border border-gray-200">{payout.id}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-600">
                            <div className="flex items-center gap-2.5">
                              <div className="p-1.5 bg-slate-100 rounded-md border border-gray-200"><CreditCard className="w-4 h-4 text-gray-500" /></div>
                              {payout.method}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {payout.status === 'completed' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 shadow-sm flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>Completed</span>}
                            {payout.status === 'pending' && <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100 shadow-sm flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>Processing</span>}
                            {payout.status === 'failed' && <span className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-100 shadow-sm flex items-center gap-1.5 w-fit"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"/>Failed</span>}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-base font-black text-gray-900 tracking-tight">
                            ${payout.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 border border-gray-200 shadow-sm">
                  <DollarSign className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">No payouts yet</h3>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">You haven't requested any payouts yet. Your history will appear here once you withdraw funds.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Payout Request Modal */}
        <Dialog open={isRequestModalOpen} onOpenChange={(open) => !open && setIsRequestModalOpen(false)}>
          <DialogContent className="rounded-3xl border border-white/20 shadow-2xl bg-white/95 backdrop-blur-xl sm:max-w-md p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-white/40">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Request Payout</DialogTitle>
                <DialogDescription className="text-gray-500 mt-1.5">
                  Transfer your available balance to your linked bank account.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-emerald-50/50 p-5 rounded-2xl flex justify-between items-center border border-emerald-100 shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wider block mb-1">Available Balance</span>
                  <span className="text-3xl font-black text-emerald-700 tracking-tight">${balance.available.toFixed(2)}</span>
                </div>
                <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-100">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Withdrawal Amount ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    max={balance.available}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="pl-12 h-14 text-xl font-bold rounded-xl border-slate-200 bg-white/80 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</Label>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 shadow-inner">
                      <CreditCard className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">{methods.length > 0 ? methods[0].accountName : 'Bank Transfer'}</p>
                      {methods.length === 0 ? (
                        <p className="text-xs font-bold text-rose-500 mt-0.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> No account added</p>
                      ) : (
                        <p className="text-[10px] font-bold text-gray-500 font-medium mt-0.5">Primary Account</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <Button variant="outline" onClick={() => setIsRequestModalOpen(false)} disabled={actionLoading} className="flex-1 rounded-xl h-12 border-slate-200 font-bold bg-white">
                Cancel
              </Button>
              <Button 
                onClick={handleRequestPayout} 
                disabled={actionLoading || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > balance.available} 
                className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Transfer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
