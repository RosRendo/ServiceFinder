"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, Plus, Loader2, DollarSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import api from "@/lib/api/client";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/hooks/useAuth";

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  description: string;
  createdAt: string;
}

export default function CompanyWalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<{ balance: number, pendingBalance?: number, pendingWithdrawals: number, transactions: Transaction[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [payoutData, setPayoutData] = useState({
    amount: "",
    destinationBank: "",
    accountName: "",
    accountNumber: "",
  });

  const fetchWallet = async () => {
    try {
      const response = await api.get('/financials/wallet');
      setWallet(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load wallet data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'company_admin') {
      fetchWallet();
    }
  }, [user]);

  const handleRequestPayout = async () => {
    const amountNum = parseFloat(payoutData.amount);
    if (isNaN(amountNum) || amountNum < 10) {
      toast({ title: "Invalid Amount", description: "Minimum withdrawal is $10.", variant: "destructive" });
      return;
    }
    
    if (wallet && amountNum > wallet.balance) {
      toast({ title: "Insufficient Funds", description: "You cannot withdraw more than your available balance.", variant: "destructive" });
      return;
    }

    if (!payoutData.destinationBank || !payoutData.accountName || !payoutData.accountNumber) {
      toast({ title: "Missing Fields", description: "Please fill in all bank details.", variant: "destructive" });
      return;
    }

    setRequesting(true);
    try {
      await api.post('/financials/payout-requests', {
        amount: amountNum,
        destinationBank: payoutData.destinationBank,
        accountName: payoutData.accountName,
        accountNumber: payoutData.accountNumber,
      });

      toast({ title: "Success", description: "Payout request submitted." });
      setRequestOpen(false);
      setPayoutData({ amount: "", destinationBank: "", accountName: "", accountNumber: "" });
      fetchWallet();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to request payout.", variant: "destructive" });
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = wallet?.balance || 0;
  const pendingEarnings = wallet?.pendingBalance || 0;
  const pending = wallet?.pendingWithdrawals || 0;
  const lifetime = (wallet?.transactions || []).filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 lg:px-0 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Company Wallet</h1>
            <p className="text-sm font-medium text-gray-500">Manage earnings and payouts</p>
          </div>
          <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-md">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
                <DialogDescription>Withdraw funds to your bank account. Minimum $10.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Amount (Available: ${balance.toFixed(2)})</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      type="number" 
                      className="pl-9" 
                      placeholder="0.00" 
                      value={payoutData.amount} 
                      onChange={(e) => setPayoutData({...payoutData, amount: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input placeholder="e.g. ABA Bank" value={payoutData.destinationBank} onChange={(e) => setPayoutData({...payoutData, destinationBank: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input placeholder="John Doe" value={payoutData.accountName} onChange={(e) => setPayoutData({...payoutData, accountName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input placeholder="123 456 789" value={payoutData.accountNumber} onChange={(e) => setPayoutData({...payoutData, accountNumber: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button onClick={handleRequestPayout} disabled={requesting}>
                  {requesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-0 py-8 space-y-6">
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">Available Balance</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">${balance.toFixed(2)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">Pending Earnings</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">${pendingEarnings.toFixed(2)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">Pending Payouts</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">${pending.toFixed(2)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-500 text-sm">Lifetime Earnings</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">${lifetime.toFixed(2)}</p>
          </motion.div>
        </div>

        {/* Transaction History */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">Transaction History</h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            {(!wallet?.transactions || wallet.transactions.length === 0) ? (
              <div className="p-8 text-center text-gray-500">No transactions found.</div>
            ) : (
              wallet.transactions.map((tx) => (
                <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'credit' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{tx.description || tx.category}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                    </div>
                  </div>
                  <div className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
