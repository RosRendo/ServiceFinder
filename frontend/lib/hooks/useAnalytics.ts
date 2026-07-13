import { useQuery } from '@tanstack/react-query';

export type Timeframe = '7d' | '30d' | '90d' | '12m' | 'all';

export interface AnalyticsData {
  revenue: {
    total: number;
    trend: number; // percentage change
    history: { date: string; amount: number }[];
  };
  bookings: {
    total: number;
    trend: number;
    history: { date: string; count: number }[];
    byStatus: { status: string; count: number }[];
  };
  views: {
    total: number;
    trend: number;
    history: { date: string; count: number }[];
  };
  topServices: {
    serviceId: string;
    name: string;
    revenue: number;
    bookings: number;
  }[];
}

const fetchCompanyAnalytics = async (timeframe: Timeframe): Promise<AnalyticsData> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company/analytics?timeframe=${timeframe}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching company analytics dashboard data
export function useCompanyAnalyticsQuery(timeframe: Timeframe = '30d') {
  return useQuery({
    queryKey: ['companyAnalytics', timeframe],
    queryFn: () => fetchCompanyAnalytics(timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes, analytics don't need real-time updates often
    refetchOnWindowFocus: false, // Don't refetch on every window focus for heavy analytics
  });
}

const fetchAdminAnalytics = async (timeframe: Timeframe): Promise<any> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics?timeframe=${timeframe}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch admin analytics');
  }

  const data = await response.json();
  return data.data;
};

// Hook for fetching superadmin platform-wide analytics
export function useAdminAnalyticsQuery(timeframe: Timeframe = '30d') {
  return useQuery({
    queryKey: ['adminAnalytics', timeframe],
    queryFn: () => fetchAdminAnalytics(timeframe),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}
