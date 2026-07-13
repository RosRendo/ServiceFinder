"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"
import { format } from "date-fns"

interface Transaction {
  id: string;
  amount: string;
  type: 'credit' | 'debit';
  description: string;
  createdAt: string;
}

interface WalletData {
  walletBalance: string;
  creditLimit: string;
  transactions: Transaction[];
}

export function StaffWalletCard({ staffId }: { staffId: string }) {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpAmount, setTopUpAmount] = useState("")
  const [isToppingUp, setIsToppingUp] = useState(false)

  const fetchWallet = async () => {
    try {
      const res = await apiClient.get(`/companies/staff/${staffId}/wallet`)
      const payload = res.data?.data ?? res.data;
      // Ensure transactions is always an array
      if (payload && !payload.transactions) {
          payload.transactions = [];
      }
      setData(payload)
    } catch (err) {
      toast.error("Failed to load wallet data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallet()
  }, [staffId])

  const handleTopUp = async () => {
    if (!topUpAmount || isNaN(Number(topUpAmount)) || Number(topUpAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsToppingUp(true)
    try {
      await apiClient.post(`/companies/staff/${staffId}/wallet/topup`, { amount: Number(topUpAmount) })
      toast.success("Wallet topped up successfully")
      setTopUpAmount("")
      fetchWallet()
    } catch (err) {
      toast.error("Failed to top up wallet")
    } finally {
      setIsToppingUp(false)
    }
  }

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  if (!data) return null;

  const balance = Number(data.walletBalance);
  const limit = Number(data.creditLimit);
  const isNegative = balance < 0;
  const isWarning = balance <= limit + 10;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-indigo-500" /> Digital Wallet & Commissions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-2xl border ${isNegative ? (isWarning ? 'bg-rose-50 border-rose-200' : 'bg-orange-50 border-orange-200') : 'bg-slate-50 border-slate-200'}`}>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Balance</p>
          <p className={`text-3xl font-black ${isNegative ? (isWarning ? 'text-rose-600' : 'text-orange-600') : 'text-slate-900'}`}>
            ${balance.toFixed(2)}
          </p>
          {isNegative && (
            <p className="text-xs font-medium text-rose-500 mt-2">
              Limit: ${limit.toFixed(2)}
            </p>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top Up / Settle Debt</p>
          <div className="flex gap-2">
            <Input 
              type="number" 
              placeholder="Amount (e.g. 50)" 
              value={topUpAmount}
              onChange={e => setTopUpAmount(e.target.value)}
              className="rounded-xl border-slate-200"
            />
            <Button 
              onClick={handleTopUp} 
              disabled={isToppingUp || !topUpAmount}
              className="rounded-xl shrink-0"
            >
              {isToppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Top Up
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Recent Transactions</h3>
        {data.transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions found.</p>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {data.transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {t.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{t.description}</p>
                    <p className="text-xs text-slate-500 font-medium">{format(new Date(t.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
                <p className={`font-black ${t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'credit' ? '+' : '-'}${Number(t.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
