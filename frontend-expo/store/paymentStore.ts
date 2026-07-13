import { create } from "zustand";

export type PaymentMethodType = "aba" | "acleda" | "wing" | "khqr";

interface PaymentState {
  paymentMethod: PaymentMethodType;
  isProcessing: boolean;
  clientSecret: string | null;
  paymentIntentId: string | null;
  error: string | null;
  
  setPaymentMethod: (method: PaymentMethodType) => void;
  setProcessing: (isProcessing: boolean) => void;
  setClientSecret: (secret: string | null) => void;
  setPaymentIntentId: (id: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  paymentMethod: "aba", // Default to ABA
  isProcessing: false,
  clientSecret: null,
  paymentIntentId: null,
  error: null,

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setClientSecret: (secret) => set({ clientSecret: secret }),
  setPaymentIntentId: (id) => set({ paymentIntentId: id }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    isProcessing: false,
    clientSecret: null,
    paymentIntentId: null,
    error: null
  }),
}));
