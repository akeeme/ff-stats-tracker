import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';

/**
 * Hook to fetch teams with realtime updates
 * Automatically refetches when teams table changes in the database
 */
export function useTeamsWithRealtime() {
  const queryKey = ['teams'];
  
  // Fetch teams using React Query
  const query = useQuery({
    queryKey,
    queryFn: api.getTeams,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'teams',
    queryKey,
    enabled: true,
  });

  return query;
}
