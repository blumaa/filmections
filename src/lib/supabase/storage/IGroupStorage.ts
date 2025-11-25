/**
 * Group Storage Interface
 *
 * Defines core CRUD operations for connection group persistence.
 * Following Interface Segregation and Dependency Inversion principles.
 */

import type { Film } from '../../../types';
import type { Database } from '../types';

/**
 * Group status in the admin workflow
 */
export type GroupStatus = Database['public']['Tables']['connection_groups']['Row']['status'];

/**
 * Difficulty color (corresponds to difficulty level)
 */
export type DifficultyColor = 'yellow' | 'green' | 'blue' | 'purple';

/**
 * Difficulty level
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'hardest';

/**
 * Stored group with database fields.
 */
export interface StoredGroup {
  id: string;
  createdAt: number;
  films: Film[];
  connection: string;
  connectionType: string;
  difficultyScore: number;
  color: DifficultyColor | null;
  difficulty: DifficultyLevel | null;
  status: GroupStatus;
  usageCount: number;
  lastUsedAt: number | null;
  metadata?: Record<string, unknown>;
}

/**
 * Input for saving a new group (without auto-generated fields)
 */
export type GroupInput = Omit<StoredGroup, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt'>;

/**
 * Filters for listing groups
 */
export interface GroupListFilters {
  status?: GroupStatus | GroupStatus[];
  color?: DifficultyColor | DifficultyColor[];
  connectionType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Group update payload (partial fields)
 */
export interface GroupUpdate {
  connection?: string;
  color?: DifficultyColor;
  difficulty?: DifficultyLevel;
  status?: GroupStatus;
  metadata?: Record<string, unknown>;
}

/**
 * Result from listGroups query
 */
export interface GroupListResult {
  groups: StoredGroup[];
  total: number;
}

/**
 * Core group storage interface.
 *
 * Handles CRUD operations for connection groups in Supabase.
 * Designed for use with TanStack Query for caching and optimistic updates.
 */
export interface IGroupStorage {
  /**
   * Save a single group to storage.
   *
   * @param group - Group to save
   * @returns Promise resolving to the saved group with database fields
   */
  saveGroup(group: GroupInput): Promise<StoredGroup>;

  /**
   * Save multiple groups in a single batch operation.
   *
   * @param groups - Array of groups to save
   * @returns Promise resolving to array of saved groups
   */
  saveBatch(groups: GroupInput[]): Promise<StoredGroup[]>;

  /**
   * Get a group by its unique ID.
   *
   * @param id - Group identifier
   * @returns Promise resolving to group or null if not found
   */
  getGroup(id: string): Promise<StoredGroup | null>;

  /**
   * Get multiple groups by their IDs.
   *
   * @param ids - Array of group identifiers
   * @returns Promise resolving to array of groups (in same order as input)
   */
  getGroupsByIds(ids: string[]): Promise<StoredGroup[]>;

  /**
   * List groups with optional filtering and pagination.
   *
   * @param filters - Optional filters and pagination
   * @returns Promise resolving to paginated group list
   */
  listGroups(filters?: GroupListFilters): Promise<GroupListResult>;

  /**
   * Update an existing group.
   *
   * @param id - Group identifier
   * @param updates - Fields to update
   * @returns Promise resolving to updated group
   */
  updateGroup(id: string, updates: GroupUpdate): Promise<StoredGroup>;

  /**
   * Delete a group by ID.
   *
   * @param id - Group identifier
   * @returns Promise that resolves when deletion is complete
   */
  deleteGroup(id: string): Promise<void>;

  /**
   * Increment usage count for groups when used in a puzzle.
   *
   * @param groupIds - Array of group IDs to increment
   * @returns Promise that resolves when update is complete
   */
  incrementUsage(groupIds: string[]): Promise<void>;
}
