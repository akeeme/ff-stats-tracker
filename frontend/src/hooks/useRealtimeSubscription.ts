import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'teams' | 'players' | 'games' | 'player_stats';

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  schema?: string;
  queryKey: string[];
  enabled?: boolean;
}

/**
 * Hook to subscribe to Supabase realtime changes for a specific table
 * Automatically invalidates React Query cache when data changes
 */
export function useRealtimeSubscription({
  table,
  schema = 'statstracker',
  queryKey,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Don't subscribe if Supabase is not configured or subscription is disabled
    if (!enabled || !isSupabaseConfigured) {
      if (!isSupabaseConfigured && enabled) {
        console.log(`ℹ️ Realtime disabled for ${schema}.${table} - Supabase not configured`);
      }
      return;
    }

    let channel: RealtimeChannel;

    const setupSubscription = () => {
      // Subscribe to all changes (INSERT, UPDATE, DELETE) on the table
      channel = supabase
        .channel(`${schema}:${table}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: schema,
            table: table,
          },
          (payload) => {
            console.log(`Realtime change detected on ${table}:`, payload);
            
            // Invalidate the query to trigger a refetch
            queryClient.invalidateQueries({ queryKey });
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to realtime updates for ${schema}.${table}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Error subscribing to ${schema}.${table}`);
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏱️ Subscription to ${schema}.${table} timed out`);
          }
        });
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        console.log(`🔌 Unsubscribed from ${schema}.${table}`);
      }
    };
  }, [table, schema, queryKey, enabled, queryClient]);
}
