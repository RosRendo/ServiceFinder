// lib/hooks/usePayments.ts

import { useState, useEffect, useCallback } from "react";
import { Payment } from "@/types/payment.type";

interface UsePaymentsOptions {
  autoFetch?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

interface CompletePaymentData {
  bookingId: string | number;
  method: "card" | "wallet" | "cash" | "paypal" | "bank" | "crypto";
  cardDetails?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
  transactionRef?: string;
}

interface PaymentResponse {
  success: boolean;
  message?: string;
  error?: string;
  payment?: any;
  sessionId?: string;
  url?: string;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { autoFetch = true, status, page = 1, limit = 10 } = options;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });

  // Get API base URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  /**
   * Fetch all payments with pagination
   */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(`${API_URL}/api/payments?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch payments");
      }
    } catch (err) {
      setError("An error occurred while fetching payments");
      console.error("Fetch payments error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, page, status, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchPayments();
    }
  }, [autoFetch, fetchPayments]);

  /**
   * Get payment by ID
   */
  const getPaymentById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/payments/${id}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, payment: data.payment };
        }
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Payment not found",
        };
      } catch (err) {
        console.error("Get payment error:", err);
        return { success: false, error: "An error occurred" };
      } finally {
        setLoading(false);
      }
    },
    [API_URL],
  );

  /**
   * Create payment (legacy method)
   */
  const createPayment = useCallback(
    async (paymentData: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(paymentData),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (autoFetch) {
            fetchPayments();
          }
          return { success: true, payment: data.payment };
        }
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to create payment",
        };
      } catch (err) {
        console.error("Create payment error:", err);
        return { success: false, error: "Failed to create payment" };
      } finally {
        setLoading(false);
      }
    },
    [API_URL, autoFetch, fetchPayments],
  );


  /**
   * Complete payment for cash/wallet methods
   * @param paymentData - Payment parameters including booking ID and method
   * @returns Response with payment details
   */
  const completePayment = useCallback(
    async (paymentData: {
      bookingId: string;
      method: "card" | "wallet" | "cash" | "paypal" | "bank";
    }) => {
      setLoading(true);
      setError(null);
      try {

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/complete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(paymentData),
          },
        );

        const data = await response.json();

        if (response.ok) {
          if (autoFetch) {
            fetchPayments();
          }
          return data;
        }

        return {
          success: false,
          error: data.error || "Failed to complete payment",
        };
      } catch (err) {
        console.error("Complete payment error:", err);
        return {
          success: false,
          error: "Network error. Please check your connection and try again.",
        };
      } finally {
        setLoading(false);
      }
    },
    [autoFetch, fetchPayments],
  );

  /**
   * Update payment status (admin only)
   */
  const updatePayment = useCallback(
    async (id: string, updateData: any) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/${id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(updateData),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (autoFetch) {
            fetchPayments();
          }
          return { success: true, payment: data.payment };
        }
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || "Failed to update payment",
        };
      } catch (err) {
        console.error("Update payment error:", err);
        return { success: false, error: "Failed to update payment" };
      } finally {
        setLoading(false);
      }
    },
    [API_URL, autoFetch, fetchPayments],
  );

  /**
   * Create PayPal Order
   */
  const createPaypalOrder = useCallback(async (bookingId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ bookingId }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create PayPal order");

      return { success: true, url: data.url, orderId: data.orderId };
    } catch (err: any) {
      console.error("PayPal create order error:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Capture PayPal Order
   */
  const capturePaypalOrder = useCallback(
    async (orderID: string, bookingId: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/paypal/capture`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ orderID, bookingId }),
          },
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to capture PayPal payment");

        return { success: true, payment: data.payment };
      } catch (err: any) {
        console.error("PayPal capture error:", err);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );


  return {
    payments,
    loading,
    error,
    pagination,
    fetchPayments,
    getPaymentById,
    createPayment,
    completePayment,
    updatePayment,
    createPaypalOrder,
    capturePaypalOrder,
  };
}
