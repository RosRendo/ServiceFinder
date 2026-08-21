import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
  lastLogin: string;
}

interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

// Fetch users for admin panel
const fetchAdminUsers = async (params: FetchUsersParams): Promise<{ data: AdminUser[], total: number, pages: number }> => {

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.role) queryParams.append('role', params.role);
  if (params.status) queryParams.append('status', params.status);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${queryParams.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = await response.json();
  return {
    data: data.data || [],
    total: data.meta?.total || 0,
    pages: data.meta?.pages || 1
  };
};

export function useAdminUsersQuery(params: FetchUsersParams) {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => fetchAdminUsers(params),
    staleTime: 1 * 60 * 1000, // 1 minute
    placeholderData: (previousData) => previousData, // keep previous data while fetching new page
  });
}

// Update user status
export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string, status: 'active' | 'suspended' | 'banned', reason?: string }) => {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update user status');
      }

      return { userId, status };
    },
    onSuccess: (data) => {
      // Invalidate the users list to refetch
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success(`User status updated to ${data.status}`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}
