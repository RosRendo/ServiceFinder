import { useAPI, useMutation } from './useAPI';

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  requestedAt: string;
  processedAt?: string;
  reference?: string;
}

export function usePayouts() {
  const { data, loading, error, refetch } = useAPI<{ payouts: Payout[], balance: number }>('/api/financials/wallet');
  const { mutate, loading: actionLoading } = useMutation();

  const requestPayout = async (amount: number, methodId: string) => {
    return mutate('/api/financials/payout-requests', { amount, methodId }, 'POST');
  };

  return {
    payouts: data?.payouts || [],
    availableBalance: data?.balance || 0,
    loading,
    error,
    refetch,
    requestPayout,
    actionLoading
  };
}
