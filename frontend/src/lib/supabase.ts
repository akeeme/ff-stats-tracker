import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase credentials not found. Realtime features will be disabled.');
  console.warn('To enable realtime: Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types for better type safety
export type Database = {
  statstracker: {
    Tables: {
      teams: {
        Row: {
          id: number;
          name: string;
          season: number;
          league: string;
          wins: number;
          losses: number;
          ties: number;
          is_active: number;
          version: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      players: {
        Row: {
          id: number;
          name: string;
          team_id: number;
          season: number;
          is_active: boolean;
          jersey_number: string | null;
          version: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      games: {
        Row: {
          id: number;
          week: number;
          league: string;
          season: number;
          team1_id: number | null;
          team1_score: number;
          team2_id: number | null;
          team2_score: number;
          winning_team_id: number | null;
          version: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
      player_stats: {
        Row: {
          id: number;
          player_id: number;
          game_id: number;
          passing_tds: number;
          passes_completed: number;
          passes_attempted: number;
          interceptions_thrown: number;
          receptions: number;
          targets: number;
          receiving_tds: number;
          drops: number;
          first_downs: number;
          rushing_tds: number;
          rush_attempts: number;
          flag_pulls: number;
          interceptions: number;
          pass_breakups: number;
          def_td: number;
          version: number;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
      };
    };
  };
};
