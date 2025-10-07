import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRealtimeSubscription } from './useRealtimeSubscription';

/**
 * Hook to fetch players with realtime updates
 * Automatically refetches when players table changes in the database
 */
export function usePlayersWithRealtime() {
  const queryKey = ['players'];
  
  // Fetch players using React Query
  const query = useQuery({
    queryKey,
    queryFn: api.getPlayers,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Subscribe to realtime updates
  useRealtimeSubscription({
    table: 'players',
    queryKey,
    enabled: true,
  });

  return query;
}
