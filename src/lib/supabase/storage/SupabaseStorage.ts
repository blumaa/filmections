/**
 * Supabase Storage Implementation
 *
 * Implements IPuzzleStorage interface using Supabase as the backend.
 * Handles conversion between application types and database schema.
 *
 * Puzzles now reference connection_groups via group_ids array.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';
import type { SavedPuzzle, Group, Film } from '../../../types';
import type {
  IPuzzleStorage,
  StoredPuzzle,
  PuzzleInput,
  PuzzleListFilters,
  PuzzleListResult,
  PuzzleUpdate,
} from './IPuzzleStorage';
import type { DifficultyColor, DifficultyLevel } from './IGroupStorage';

type DbPuzzleRow = Database['public']['Tables']['puzzles']['Row'] & {
  groups?: unknown; // JSONB column for group snapshot
};
type DbPuzzleInsert = Database['public']['Tables']['puzzles']['Insert'];
type DbGroupRow = Database['public']['Tables']['connection_groups']['Row'];

/**
 * SupabaseStorage implementation.
 *
 * Provides CRUD operations for puzzles using Supabase PostgreSQL backend.
 * Uses Row Level Security for access control.
 */
export class SupabaseStorage implements IPuzzleStorage {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Convert database row to StoredPuzzle (without groups populated)
   */
  private rowToStoredPuzzle(row: DbPuzzleRow): StoredPuzzle {
    return {
      id: row.id,
      createdAt: new Date(row.created_at).getTime(),
      puzzleDate: row.puzzle_date,
      title: row.title,
      groupIds: row.group_ids,
      status: row.status,
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  }

  /**
   * Convert database group row to Group type for game use
   */
  private dbGroupToGroup(row: DbGroupRow): Group {
    return {
      id: row.id,
      films: row.films as unknown as Film[],
      connection: row.connection,
      difficulty: (row.difficulty || 'medium') as DifficultyLevel,
      color: (row.color || 'green') as DifficultyColor,
    };
  }

  /**
   * Fetch groups by IDs and return them in order
   */
  private async fetchGroupsByIds(groupIds: string[]): Promise<Group[]> {
    if (groupIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('connection_groups')
      .select()
      .in('id', groupIds);

    if (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }

    // Reorder results to match input order
    const groupMap = new Map(data.map((row: DbGroupRow) => [row.id, row]));
    return groupIds
      .map((id) => groupMap.get(id))
      .filter((row): row is DbGroupRow => row !== undefined)
      .map((row: DbGroupRow) => this.dbGroupToGroup(row));
  }

  async savePuzzle(puzzle: PuzzleInput): Promise<StoredPuzzle> {
    const insert: DbPuzzleInsert = {
      group_ids: puzzle.groupIds,
      title: puzzle.title ?? null,
      status: 'pending',
      metadata: puzzle.metadata as DbPuzzleInsert['metadata'],
    };

    const { data, error } = await this.supabase
      .from('puzzles')
      .insert(insert as never)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save puzzle: ${error.message}`);
    }

    return this.rowToStoredPuzzle(data);
  }

  async getPuzzle(id: string): Promise<StoredPuzzle | null> {
    const { data, error } = await this.supabase
      .from('puzzles')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get puzzle: ${error.message}`);
    }

    const puzzle = this.rowToStoredPuzzle(data);

    // Fetch and populate groups
    puzzle.groups = await this.fetchGroupsByIds(puzzle.groupIds);

    return puzzle;
  }

  async getDailyPuzzle(date: string): Promise<SavedPuzzle | null> {
    const { data, error } = await this.supabase
      .from('puzzles')
      .select()
      .eq('puzzle_date', date)
      .eq('status', 'published')
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get daily puzzle: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    // Cast to DbPuzzleRow for type safety
    const row = data as DbPuzzleRow;

    // Use snapshot if available (published puzzles), otherwise fetch from connection_groups
    // The snapshot makes the puzzle self-contained for anonymous users
    const groups: Group[] = row.groups
      ? (row.groups as Group[])
      : await this.fetchGroupsByIds(row.group_ids);

    // Extract all films from groups
    const films = groups.flatMap((group) => group.films);

    // Return assembled SavedPuzzle
    return {
      id: row.id,
      groups,
      films,
      createdAt: new Date(row.created_at).getTime(),
      metadata: row.metadata as Record<string, unknown> | undefined,
    };
  }

  async listPuzzles(filters?: PuzzleListFilters): Promise<PuzzleListResult> {
    let query = this.supabase.from('puzzles').select('*', { count: 'exact' });

    // Apply filters
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.dateFrom) {
      query = query.gte('puzzle_date', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('puzzle_date', filters.dateTo);
    }

    // Apply pagination
    const limit = filters?.limit ?? 50;
    const offset = filters?.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list puzzles: ${error.message}`);
    }

    // Convert rows to StoredPuzzle
    const puzzles = data.map((row) => this.rowToStoredPuzzle(row));

    // Fetch groups for all puzzles
    const allGroupIds = [...new Set(puzzles.flatMap((p) => p.groupIds))];
    const allGroups = await this.fetchGroupsByIds(allGroupIds);
    const groupMap = new Map(allGroups.map((g) => [g.id, g]));

    // Populate groups for each puzzle
    for (const puzzle of puzzles) {
      puzzle.groups = puzzle.groupIds
        .map((id) => groupMap.get(id))
        .filter((g): g is Group => g !== undefined);
    }

    return {
      puzzles,
      total: count ?? 0,
    };
  }

  async updatePuzzle(id: string, updates: PuzzleUpdate): Promise<StoredPuzzle> {
    const dbUpdate: Record<string, unknown> = {};

    if (updates.status !== undefined) {
      dbUpdate.status = updates.status;
    }

    if (updates.puzzleDate !== undefined) {
      dbUpdate.puzzle_date = updates.puzzleDate ?? null;
    }

    if (updates.metadata !== undefined) {
      dbUpdate.metadata = updates.metadata;
    }

    // If publishing, snapshot the group data for self-contained gameplay
    if (updates.status === 'published') {
      // First fetch current puzzle to get group_ids
      const { data: currentPuzzle } = await this.supabase
        .from('puzzles')
        .select('group_ids')
        .eq('id', id)
        .single();

      if (currentPuzzle) {
        const puzzleRow = currentPuzzle as DbPuzzleRow;
        const groups = await this.fetchGroupsByIds(puzzleRow.group_ids);
        dbUpdate.groups = groups;
      }
    }

    const { data, error } = await this.supabase
      .from('puzzles')
      .update(dbUpdate as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update puzzle: ${error.message}`);
    }

    const puzzle = this.rowToStoredPuzzle(data as DbPuzzleRow);

    // Fetch and populate groups
    puzzle.groups = await this.fetchGroupsByIds(puzzle.groupIds);

    return puzzle;
  }

  async deletePuzzle(id: string): Promise<void> {
    const { error } = await this.supabase.from('puzzles').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete puzzle: ${error.message}`);
    }
  }
}
