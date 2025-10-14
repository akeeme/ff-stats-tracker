import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';

/**
 * Hook to fetch player stats with realtime updates
 * Automatically refetches when player_stats table changes in the database
 */
export function usePlayerStatsWithRealtime(params?: { season?: number; gameId?: number }) {
  const queryKey = ['player-stats', ...(params?.season ? [params.season.toString()] : []), ...(params?.gameId ? [params.gameId.toString()] : [])];
  
  // Fetch player stats using React Query
  const query = useQuery({
    queryKey,
    queryFn: () => api.getPlayerStats(params),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'player_stats',
    queryKey,
    enabled: true,
  });

  return query;
}
