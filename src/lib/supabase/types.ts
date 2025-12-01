/**
 * Supabase Database Types
 *
 * Auto-generated types for type-safe database queries.
 * Update after running migrations or schema changes.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      connection_groups: {
        Row: {
          id: string;
          created_at: string;
          items: Json;
          connection: string;
          connection_type: string;
          difficulty_score: number;
          color: 'yellow' | 'green' | 'blue' | 'purple' | null;
          difficulty: 'easy' | 'medium' | 'hard' | 'hardest' | null;
          status: 'pending' | 'approved' | 'rejected';
          usage_count: number;
          last_used_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          items: Json;
          connection: string;
          connection_type: string;
          difficulty_score: number;
          color?: 'yellow' | 'green' | 'blue' | 'purple' | null;
          difficulty?: 'easy' | 'medium' | 'hard' | 'hardest' | null;
          status?: 'pending' | 'approved' | 'rejected';
          usage_count?: number;
          last_used_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          items?: Json;
          connection?: string;
          connection_type?: string;
          difficulty_score?: number;
          color?: 'yellow' | 'green' | 'blue' | 'purple' | null;
          difficulty?: 'easy' | 'medium' | 'hard' | 'hardest' | null;
          status?: 'pending' | 'approved' | 'rejected';
          usage_count?: number;
          last_used_at?: string | null;
          metadata?: Json | null;
        };
      };
      puzzles: {
        Row: {
          id: string;
          created_at: string;
          puzzle_date: string | null;
          title: string | null;
          group_ids: string[];
          status: 'pending' | 'approved' | 'published' | 'rejected';
          metadata: Json | null;
          genre: string;
          groups: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          puzzle_date?: string | null;
          title?: string | null;
          group_ids?: string[];
          status?: 'pending' | 'approved' | 'published' | 'rejected';
          metadata?: Json | null;
          genre?: string;
          groups?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          puzzle_date?: string | null;
          title?: string | null;
          group_ids?: string[];
          status?: 'pending' | 'approved' | 'published' | 'rejected';
          metadata?: Json | null;
          genre?: string;
          groups?: Json | null;
        };
      };
      user_stats: {
        Row: {
          user_id: string;
          created_at: string;
          games_played: number;
          games_won: number;
          current_streak: number;
          max_streak: number;
          last_played_date: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          last_played_date?: string | null;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          games_played?: number;
          games_won?: number;
          current_streak?: number;
          max_streak?: number;
          last_played_date?: string | null;
        };
      };
      gameplay: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          puzzle_id: string;
          puzzle_date: string;
          completed: boolean;
          mistakes_made: number;
          time_taken_seconds: number | null;
          groups_solved: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          puzzle_id: string;
          puzzle_date: string;
          completed: boolean;
          mistakes_made: number;
          time_taken_seconds?: number | null;
          groups_solved: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          puzzle_id?: string;
          puzzle_date?: string;
          completed?: boolean;
          mistakes_made?: number;
          time_taken_seconds?: number | null;
          groups_solved?: number;
        };
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
          email: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          email: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          email?: string;
        };
      };
      generator_configs: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          config: Json;
          created_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          config: Json;
          created_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          config?: Json;
          created_by?: string;
        };
      };
      connection_types: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          category: string;
          description: string;
          examples: string[] | null;
          active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          category: string;
          description: string;
          examples?: string[] | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          category?: string;
          description?: string;
          examples?: string[] | null;
          active?: boolean;
        };
      };
      group_feedback: {
        Row: {
          id: string;
          created_at: string;
          items: Json;
          connection: string;
          connection_type_id: string | null;
          explanation: string | null;
          accepted: boolean;
          rejection_reason: string | null;
          generation_filters: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          items: Json;
          connection: string;
          connection_type_id?: string | null;
          explanation?: string | null;
          accepted: boolean;
          rejection_reason?: string | null;
          generation_filters?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          items?: Json;
          connection?: string;
          connection_type_id?: string | null;
          explanation?: string | null;
          accepted?: boolean;
          rejection_reason?: string | null;
          generation_filters?: Json | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_group_usage: {
        Args: { group_ids: string[] };
        Returns: void;
      };
    };
    Enums: {
      puzzle_status: 'pending' | 'approved' | 'published' | 'rejected';
      group_status: 'pending' | 'approved' | 'rejected';
    };
  };
}
