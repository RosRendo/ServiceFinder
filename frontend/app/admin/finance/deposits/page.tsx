"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { adminApi } from "@/lib/api/index";

export default function AdminDepositsPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await adminApi.get("/wallets/admin/requests");
      setDeposits(res.data.deposits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Are you sure you want to approve this deposit?")) return;
    try {
      await adminApi.patch(`/wallets/admin/deposits/${id}/approve`, { adminNotes: "Approved by admin" });
      fetchRequests();
    } catch (err) {
      alert("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const notes = prompt("Reason for rejection:");
    if (notes === null) return;
    try {
      await adminApi.patch(`/wallets/admin/deposits/${id}/reject`, { adminNotes: notes });
      fetchRequests();
    } catch (err) {
      alert("Failed to reject");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Deposit Requests</h1>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {deposits.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No pending deposits</td></tr>
            )}
            {deposits.map((req: any) => (
              <tr key={req.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{req.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.ownerId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${req.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.bankName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                  <a href={req.proofOfTransferUrl} target="_blank" rel="noreferrer" className="hover:underline">View Receipt</a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleApprove(req.id)} className="text-green-600 hover:text-green-900 mr-4">Approve</button>
                  <button onClick={() => handleReject(req.id)} className="text-red-600 hover:text-red-900">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
