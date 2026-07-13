import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string; // e.g., 'Visa', 'MasterCard'
  last4: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  isDefault: boolean;
  createdAt: string;
}

// Fetch payment methods for current user (customer or company)
const fetchPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/methods`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }

  const data = await response.json();
  return data.data || [];
};

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: fetchPaymentMethods,
    staleTime: 5 * 60 * 1000,
  });
}

// Add a new payment method
export function useAddPaymentMethodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paymentMethodId }) // Payment method ID
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to add payment method');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Payment method added successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}

// Delete a payment method
export function useDeletePaymentMethodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/methods/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to remove payment method');
      }

      return id;
    },
    onSuccess: (id) => {
      // Optimistically update
      queryClient.setQueryData<PaymentMethod[]>(['paymentMethods'], (old) => {
        return old ? old.filter(pm => pm.id !== id) : [];
      });
      toast.success('Payment method removed');
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
    }
  });
}

// Set default payment method
export function useSetDefaultPaymentMethodMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/methods/${id}/default`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to set default payment method');
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Default payment method updated');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}
