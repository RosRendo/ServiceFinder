import { useAPI, useMutation } from './useAPI';

export interface ModerationItem {
  id: string;
  type: 'review' | 'profile' | 'service';
  contentId: string;
  reportedBy: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  content: string;
}

export function useAdminModeration() {
  const { data, loading, error, refetch } = useAPI<{ items: ModerationItem[] }>('/admin/moderation');
  const { mutate, loading: actionLoading } = useMutation();

  const moderateItem = async (itemId: string, action: 'resolve' | 'dismiss', notes?: string) => {
    return mutate(`/admin/moderation/${itemId}`, { action, notes }, 'PUT');
  };

  return {
    items: data?.items || [],
    loading,
    error,
    refetch,
    moderateItem,
    actionLoading
  };
}
