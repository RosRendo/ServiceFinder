import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface StaffMember {
  id: string;
  userId: string;
  companyId: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'staff';
  status: 'active' | 'invited' | 'suspended';
  joinedAt: string;
}

// Fetch staff for the current company
const fetchCompanyStaff = async (companyId: string): Promise<StaffMember[]> => {

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}/staff`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch staff members');
  }

  const data = await response.json();
  return data.data || [];
};

export function useCompanyStaffQuery(companyId: string) {
  return useQuery({
    queryKey: ['companyStaff', companyId],
    queryFn: () => fetchCompanyStaff(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Add/Invite new staff member
export function useAddStaffMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string, role: string }) => {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to invite staff member');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyStaff', companyId] });
      toast.success('Staff member invited successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}

// Remove staff member
export function useRemoveStaffMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to remove staff member');
      }

      return staffId;
    },
    onSuccess: (staffId) => {
      // Optimistically update cache
      queryClient.setQueryData<StaffMember[]>(['companyStaff', companyId], (old) => {
        return old ? old.filter(s => s.id !== staffId) : [];
      });
      toast.success('Staff member removed successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['companyStaff', companyId] });
    }
  });
}

// Update staff role
export function useUpdateStaffRoleMutation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, role }: { staffId: string, role: string }) => {

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}/staff/${staffId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update staff role');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyStaff', companyId] });
      toast.success('Staff role updated');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}
