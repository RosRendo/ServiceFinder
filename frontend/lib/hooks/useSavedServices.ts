import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Define the shape of a saved service
export interface SavedService {
  id: string;
  userId: string;
  serviceId: string;
  savedAt: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    rating: number;
    imageUrl?: string;
    provider: {
      id: string;
      name: string;
    }
  }
}

// Fetcher function
const fetchSavedServices = async (): Promise<SavedService[]> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/saved-services`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch saved services');
  }

  const data = await response.json();
  return data.data || [];
};

// Hook to get all saved services
export function useSavedServices() {
  return useQuery({
    queryKey: ['saved-services'],
    queryFn: fetchSavedServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to check if a specific service is saved
export function useIsServiceSaved(serviceId: string) {
  const { data: savedServices } = useSavedServices();
  return savedServices?.some((s) => s.serviceId === serviceId) ?? false;
}

// Hook to toggle saved status
export function useToggleSavedService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, isCurrentlySaved }: { serviceId: string, isCurrentlySaved: boolean }) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const method = isCurrentlySaved ? 'DELETE' : 'POST';
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/customers/saved-services/${serviceId}`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(isCurrentlySaved ? 'Failed to remove saved service' : 'Failed to save service');
      }

      return { serviceId, isCurrentlySaved };
    },
    // Optimistically update the cache
    onMutate: async ({ serviceId, isCurrentlySaved }) => {
      await queryClient.cancelQueries({ queryKey: ['saved-services'] });

      const previousSavedServices = queryClient.getQueryData<SavedService[]>(['saved-services']);

      queryClient.setQueryData<SavedService[]>(['saved-services'], (old) => {
        if (!old) return [];
        if (isCurrentlySaved) {
          // Remove from list
          return old.filter(s => s.serviceId !== serviceId);
        } else {
          // Add an optimistic entry
          return [
            ...old,
            {
              id: `temp-${Date.now()}`,
              userId: 'current-user',
              serviceId,
              savedAt: new Date().toISOString(),
              service: {} as any // Optimistic UI fallback
            }
          ];
        }
      });

      return { previousSavedServices };
    },
    onError: (err, variables, context) => {
      // Revert to previous state if error
      if (context?.previousSavedServices) {
        queryClient.setQueryData(['saved-services'], context.previousSavedServices);
      }
      toast.error(err.message);
    },
    onSettled: () => {
      // Always refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['saved-services'] });
    },
    onSuccess: (data) => {
      toast.success(data.isCurrentlySaved ? 'Removed from saved services' : 'Saved to your favorites');
    }
  });
}
