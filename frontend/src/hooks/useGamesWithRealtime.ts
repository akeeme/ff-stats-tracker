import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';

/**
 * Hook to fetch games with realtime updates
 * Automatically refetches when games table changes in the database
 */
export function useGamesWithRealtime() {
  const queryKey = ['games'];
  
  // Fetch games using React Query
  const query = useQuery({
    queryKey,
    queryFn: api.getGames,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'games',
    queryKey,
    enabled: true,
  });

  return query;
}
