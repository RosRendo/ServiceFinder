import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AdminCompany {
  id: string;
  name: string;
  registrationNumber?: string;
  email: string;
  phone: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  documents: { type: string; url: string }[];
  createdAt: string;
  metrics: {
    totalBookings: number;
    revenue: number;
    rating: number;
  };
}

interface FetchCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

// Fetch companies for admin panel
const fetchAdminCompanies = async (params: FetchCompaniesParams): Promise<{ data: AdminCompany[], total: number, pages: number }> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch companies');
  }

  const data = await response.json();
  return {
    data: data.data || [],
    total: data.meta?.total || 0,
    pages: data.meta?.pages || 1
  };
};

export function useAdminCompaniesQuery(params: FetchCompaniesParams) {
  return useQuery({
    queryKey: ['adminCompanies', params],
    queryFn: () => fetchAdminCompanies(params),
    staleTime: 1 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// Fetch single company details for admin
const fetchAdminCompanyDetail = async (id: string): Promise<AdminCompany> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company details');
  }

  const data = await response.json();
  return data.data;
};

export function useAdminCompanyDetailQuery(id: string) {
  return useQuery({
    queryKey: ['adminCompany', id],
    queryFn: () => fetchAdminCompanyDetail(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
}

// Verify/Reject company KYC
export function useVerifyCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, status, notes }: { companyId: string, status: 'verified' | 'rejected' | 'suspended', notes?: string }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/companies/${companyId}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to update company verification status');
      }

      return { companyId, status };
    },
    onSuccess: (data) => {
      // Invalidate the lists and detail
      queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      queryClient.invalidateQueries({ queryKey: ['adminCompany', data.companyId] });
      toast.success(`Company marked as ${data.status}`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });
}
