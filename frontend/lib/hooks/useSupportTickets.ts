import { useAPI, useMutation } from './useAPI';

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export function useSupportTickets() {
  const { data, loading, error, refetch } = useAPI<{ tickets: SupportTicket[] }>('/api/support/tickets');
  const { mutate, loading: actionLoading } = useMutation();

  const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']) => {
    return mutate(`/api/support/tickets/${ticketId}`, { status }, 'PATCH');
  };

  const addTicketReply = async (ticketId: string, message: string) => {
    return mutate(`/api/support/tickets/${ticketId}/reply`, { message }, 'POST');
  };

  return {
    tickets: data?.tickets || [],
    loading,
    error,
    refetch,
    updateTicketStatus,
    addTicketReply,
    actionLoading
  };
}
