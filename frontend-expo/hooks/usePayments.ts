import { useState } from "react";
import { api } from "@/store/authStore";
import { usePaymentStore } from "@/store/paymentStore";

export function usePayments() {
  const { setClientSecret, setPaymentIntentId, setError, setProcessing } = usePaymentStore();

  /**
   * Step 1 (Alternative): Complete a Cash/Wallet payment directly
   */
  const processDirectPayment = async (bookingId: string, paymentMethod: "cash" | "wallet" | "bank") => {
    try {
      setProcessing(true);
      setError(null);

      const res = await api.post("/api/payments/complete", {
        bookingId,
        method: paymentMethod,
      });

      return { success: true, data: res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? `Failed to process ${paymentMethod} payment`;
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
      return { success: false, error: msg };
    } finally {
      setProcessing(false);
    }
  };

  const processAbaPayment = async (bookingId: string) => {
    try {
      setProcessing(true);
      setError(null);

      const res = await api.post("/api/payments/aba/checkout", {
        bookingId,
      });

      return { success: true, data: res.data?.data || res.data };
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Failed to initialize ABA PayWay";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
      return { success: false, error: msg };
    } finally {
      setProcessing(false);
    }
  };


  return {
    processDirectPayment,
    processAbaPayment,
  };
}
