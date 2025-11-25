/**
 * TanStack Query Hooks for Puzzle Storage
 *
 * Provides React hooks for puzzle CRUD operations with caching and optimistic updates.
 * Separates server state (TanStack Query) from client state (Zustand).
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type { SavedPuzzle } from '../../puzzle-engine/types';
import type {
  IPuzzleStorage,
  StoredPuzzle,
  PuzzleInput,
  PuzzleListFilters,
  PuzzleListResult,
  PuzzleUpdate,
} from './IPuzzleStorage';

/**
 * Query keys for puzzle operations.
 * Organized hierarchically for easy invalidation.
 */
export const puzzleKeys = {
  all: ['puzzles'] as const,
  lists: () => [...puzzleKeys.all, 'list'] as const,
  list: (filters?: PuzzleListFilters) => [...puzzleKeys.lists(), filters] as const,
  details: () => [...puzzleKeys.all, 'detail'] as const,
  detail: (id: string) => [...puzzleKeys.details(), id] as const,
  daily: (date: string) => [...puzzleKeys.all, 'daily', date] as const,
};

/**
 * Hook for loading today's daily puzzle.
 * Primary use case: Game loads puzzle for anonymous users.
 *
 * @param date - Date string (YYYY-MM-DD)
 * @param storage - Storage implementation
 * @param options - TanStack Query options
 */
export function useDailyPuzzle(
  date: string,
  storage: IPuzzleStorage,
  options?: Omit<UseQueryOptions<SavedPuzzle | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: puzzleKeys.daily(date),
    queryFn: () => storage.getDailyPuzzle(date),
    staleTime: 24 * 60 * 60 * 1000, // Cache for 24 hours (puzzle never changes)
    gcTime: Infinity, // Never garbage collect
    ...options,
  });
}

/**
 * Hook for loading a puzzle by ID.
 * Used by admin to view full puzzle details.
 *
 * @param id - Puzzle identifier
 * @param storage - Storage implementation
 * @param options - TanStack Query options
 */
export function usePuzzle(
  id: string,
  storage: IPuzzleStorage,
  options?: Omit<UseQueryOptions<StoredPuzzle | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: puzzleKeys.detail(id),
    queryFn: () => storage.getPuzzle(id),
    ...options,
  });
}

/**
 * Hook for listing puzzles with filters.
 * Used by admin puzzle queue.
 *
 * @param filters - Filter criteria
 * @param storage - Storage implementation
 * @param options - TanStack Query options
 */
export function usePuzzleList(
  filters: PuzzleListFilters | undefined,
  storage: IPuzzleStorage,
  options?: Omit<UseQueryOptions<PuzzleListResult>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: puzzleKeys.list(filters),
    queryFn: () => storage.listPuzzles(filters),
    ...options,
  });
}

/**
 * Hook for saving a single puzzle.
 * Used by admin puzzle builder.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useSavePuzzle(
  storage: IPuzzleStorage,
  options?: UseMutationOptions<StoredPuzzle, Error, PuzzleInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (puzzle: PuzzleInput) => storage.savePuzzle(puzzle),
    onSuccess: (data) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });

      // Set the puzzle in cache
      queryClient.setQueryData(puzzleKeys.detail(data.id), data);
    },
    ...options,
  });
}

/**
 * Hook for updating a puzzle.
 * Used by admin approval workflow and date assignment.
 * Includes optimistic updates for instant UI feedback.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useUpdatePuzzle(
  storage: IPuzzleStorage,
  options?: Omit<
    UseMutationOptions<
      StoredPuzzle,
      Error,
      { id: string; updates: PuzzleUpdate },
      { previous: StoredPuzzle | undefined }
    >,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => storage.updatePuzzle(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: puzzleKeys.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData<StoredPuzzle>(puzzleKeys.detail(id));

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<StoredPuzzle>(puzzleKeys.detail(id), {
          ...previous,
          ...updates,
        });
      }

      return { previous };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(puzzleKeys.detail(id), context.previous);
      }
    },
    onSuccess: (data, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(puzzleKeys.detail(id), data);

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook for deleting a puzzle.
 * Used by admin to clean up rejected puzzles.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useDeletePuzzle(
  storage: IPuzzleStorage,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storage.deletePuzzle(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: puzzleKeys.detail(id) });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook for prefetching tomorrow's puzzle.
 * Used to improve perceived performance.
 *
 * @param date - Tomorrow's date (YYYY-MM-DD)
 * @param storage - Storage implementation
 */
export function usePrefetchDailyPuzzle(date: string, storage: IPuzzleStorage) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: puzzleKeys.daily(date),
      queryFn: () => storage.getDailyPuzzle(date),
      staleTime: 24 * 60 * 60 * 1000,
    });
  };
}
