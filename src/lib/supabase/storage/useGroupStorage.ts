/**
 * TanStack Query Hooks for Group Storage
 *
 * Provides React hooks for group CRUD operations with caching and optimistic updates.
 * Follows the same pattern as usePuzzleStorage for consistency.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  IGroupStorage,
  StoredGroup,
  GroupInput,
  GroupListFilters,
  GroupListResult,
  GroupUpdate,
} from './IGroupStorage';

/**
 * Query keys for group operations.
 * Organized hierarchically for easy invalidation.
 */
export const groupKeys = {
  all: ['groups'] as const,
  lists: () => [...groupKeys.all, 'list'] as const,
  list: (filters?: GroupListFilters) => [...groupKeys.lists(), filters] as const,
  details: () => [...groupKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
};

/**
 * Hook for loading a group by ID.
 *
 * @param id - Group identifier
 * @param storage - Storage implementation
 * @param options - TanStack Query options
 */
export function useGroup(
  id: string,
  storage: IGroupStorage,
  options?: Omit<UseQueryOptions<StoredGroup | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: () => storage.getGroup(id),
    ...options,
  });
}

/**
 * Hook for listing groups with filters.
 * Used by admin group pool.
 *
 * @param filters - Filter criteria
 * @param storage - Storage implementation
 * @param options - TanStack Query options
 */
export function useGroupList(
  filters: GroupListFilters | undefined,
  storage: IGroupStorage,
  options?: Omit<UseQueryOptions<GroupListResult>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: groupKeys.list(filters),
    queryFn: () => storage.listGroups(filters),
    ...options,
  });
}

/**
 * Hook for saving a single group.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useSaveGroup(
  storage: IGroupStorage,
  options?: UseMutationOptions<StoredGroup, Error, GroupInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (group: GroupInput) => storage.saveGroup(group),
    onSuccess: (data) => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });

      // Set the group in cache
      queryClient.setQueryData(groupKeys.detail(data.id), data);
    },
    ...options,
  });
}

/**
 * Hook for saving multiple groups in batch.
 * Used by group generator.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useSaveGroupBatch(
  storage: IGroupStorage,
  options?: UseMutationOptions<StoredGroup[], Error, GroupInput[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groups: GroupInput[]) => storage.saveBatch(groups),
    onSuccess: (data) => {
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });

      // Cache each group individually
      data.forEach((group) => {
        queryClient.setQueryData(groupKeys.detail(group.id), group);
      });
    },
    ...options,
  });
}

/**
 * Hook for updating a group.
 * Includes optimistic updates for instant UI feedback.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useUpdateGroup(
  storage: IGroupStorage,
  options?: Omit<
    UseMutationOptions<
      StoredGroup,
      Error,
      { id: string; updates: GroupUpdate },
      { previous: StoredGroup | undefined }
    >,
    'mutationFn' | 'onMutate' | 'onError' | 'onSuccess'
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => storage.updateGroup(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: groupKeys.detail(id) });

      // Snapshot previous value
      const previous = queryClient.getQueryData<StoredGroup>(groupKeys.detail(id));

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<StoredGroup>(groupKeys.detail(id), {
          ...previous,
          ...updates,
        });
      }

      return { previous };
    },
    onError: (_error, { id }, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(groupKeys.detail(id), context.previous);
      }
    },
    onSuccess: (data, { id }) => {
      // Update cache with server response
      queryClient.setQueryData(groupKeys.detail(id), data);

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook for deleting a group.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useDeleteGroup(
  storage: IGroupStorage,
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storage.deleteGroup(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: groupKeys.detail(id) });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook for incrementing group usage.
 * Called when a puzzle is created using groups.
 *
 * @param storage - Storage implementation
 * @param options - Mutation options
 */
export function useIncrementGroupUsage(
  storage: IGroupStorage,
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupIds: string[]) => storage.incrementUsage(groupIds),
    onSuccess: (_, groupIds) => {
      // Invalidate affected group details
      groupIds.forEach((id) => {
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(id) });
      });

      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
    },
    ...options,
  });
}
