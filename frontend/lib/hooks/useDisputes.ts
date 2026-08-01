import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Dispute {
  id: string;
  bookingId: string;
  customerId: string;
  companyId: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed' | 'responded';
  type: string;
  description: string;
  evidence: string[]; // URLs to images/docs
  createdAt: string;
  updatedAt: string;
  booking?: any;
  customer?: any;
  company?: any;
  resolution?: {
    decision: 'accept_claim' | 'accept_company' | 'mediation';
    notes: string;
    resolvedAt: string;
    resolvedBy: string;
  };
}

// Fetch all disputes (Admin view or specific role view based on token)
const fetchDisputes = async (role: 'admin' | 'company' | 'customer'): Promise<Dispute[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const endpoint = '/api/disputes';

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch disputes');

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.disputes)) return data.disputes;
  if (Array.isArray(data.data)) return data.data;
  if (data.data && Array.isArray(data.data.disputes)) return data.data.disputes;
  return [];
};

// Fetch single dispute details
const fetchDisputeDetail = async (id: string, role: 'admin' | 'company' | 'customer'): Promise<Dispute> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const endpoint = `/api/disputes/${id}`;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch dispute details');

  const data = await response.json();
  return data.dispute || data.data?.dispute || data.data || data;
};

// Hook for listing disputes
export function useDisputesQuery(role: 'admin' | 'company' | 'customer') {
  return useQuery({
    queryKey: ['disputes', role],
    queryFn: () => fetchDisputes(role),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for single dispute
export function useDisputeDetailQuery(id: string, role: 'admin' | 'company' | 'customer') {
  return useQuery({
    queryKey: ['dispute', id, role],
    queryFn: () => fetchDisputeDetail(id, role),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!id,
  });
}

// Admin only: Hook to resolve dispute
export function useResolveDisputeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, decision, notes, refundAmount }: { 
      id: string, 
      decision: 'accept_claim' | 'accept_company' | 'mediation', 
      notes: string,
      refundAmount?: number 
    }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/disputes/${id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, notes, refundAmount })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to resolve dispute');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate both the list and the specific dispute
      queryClient.invalidateQueries({ queryKey: ['disputes', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.id, 'admin'] });
      toast.success('Dispute resolved successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}

// Company only: Hook to respond to a dispute
export function useRespondToDisputeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, message, evidence }: { 
      id: string, 
      message: string, 
      evidence?: string[] 
    }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/disputes/${id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message, evidence })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to respond to dispute');
      }

      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['disputes', 'company'] });
      queryClient.invalidateQueries({ queryKey: ['dispute', variables.id, 'company'] });
      toast.success('Response submitted successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}
