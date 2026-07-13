import { useAPI } from './useAPI';

export interface StaffPerformanceMetrics {
  totalJobs: number;
  completionRate: number;
  averageRating: number;
  onTimeArrivalRate: number;
  revenueGenerated: number;
  recentFeedback: {
    id: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export function useStaffPerformance(staffId?: string) {
  const endpoint = staffId ? `/staff/${staffId}/performance` : '/staff/performance';
  const { data, loading, error, refetch } = useAPI<StaffPerformanceMetrics>(endpoint);

  return {
    metrics: data || null,
    loading,
    error,
    refetch
  };
}
