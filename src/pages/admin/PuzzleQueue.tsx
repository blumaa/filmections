/**
 * PuzzleQueue Admin Page
 *
 * Displays puzzles and their status.
 * Allows approving, publishing, and scheduling puzzles.
 */

import { useState } from 'react';
import { Box, Heading, Text, Button, Spinner } from '@mond-design-system/theme';
import { Input, Modal, ModalBody, ModalFooter } from '@mond-design-system/theme/client';
import { usePuzzleList, useUpdatePuzzle, useDeletePuzzle } from '../../lib/supabase/storage/usePuzzleStorage';
import { SupabaseStorage } from '../../lib/supabase/storage/SupabaseStorage';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../../providers/useToast';
import type { PuzzleStatus } from '../../lib/supabase/storage/IPuzzleStorage';
import { DIFFICULTY_COLORS } from '../../constants/difficulty';
import './PuzzleQueue.css';

// Create storage instance
const storage = new SupabaseStorage(supabase);

type StatusFilter = PuzzleStatus | 'all';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
};

// Tabs to display (excludes 'rejected' since rejected puzzles are auto-deleted)
const VISIBLE_TABS: StatusFilter[] = ['all', 'pending', 'approved', 'published'];

const STATUS_COLORS: Record<PuzzleStatus, string> = {
  pending: 'var(--color-warning)',
  approved: 'var(--color-success)',
  published: 'var(--color-info)',
  rejected: 'var(--color-error)',
};

export function PuzzleQueue() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [page, setPage] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const pageSize = 10;
  const toast = useToast();

  // Build filters for query
  const filters = {
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: pageSize,
    offset: page * pageSize,
  };

  // Fetch puzzles
  const { data, isLoading, error } = usePuzzleList(filters, storage);

  // Mutations
  const updateMutation = useUpdatePuzzle(storage);
  const deleteMutation = useDeletePuzzle(storage);

  // Show toasts on mutation success/error
  const showUpdateSuccess = () => toast.showSuccess('Puzzle updated successfully');
  const showUpdateError = (err: Error) => toast.showError('Failed to update puzzle', err.message);
  const showDeleteSuccess = () => toast.showSuccess('Puzzle rejected');
  const showDeleteError = (err: Error) => toast.showError('Failed to reject puzzle', err.message);

  const handleStatusChange = (id: string, status: PuzzleStatus) => {
    updateMutation.mutate(
      { id, updates: { status } },
      {
        onSuccess: showUpdateSuccess,
        onError: showUpdateError,
      }
    );
  };

  const handleReject = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmReject = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm, {
        onSuccess: () => {
          showDeleteSuccess();
          setDeleteConfirm(null);
        },
        onError: showDeleteError,
      });
    }
  };

  const handleAssignDate = (id: string, date: string) => {
    updateMutation.mutate(
      { id, updates: { puzzleDate: date } },
      {
        onSuccess: showUpdateSuccess,
        onError: showUpdateError,
      }
    );
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      {/* Header */}
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Puzzle Queue
        </Heading>
        <Text variant="body">Review and manage puzzles</Text>
      </Box>

      {/* Status Filter Tabs */}
      <Box display="flex" gap="sm" className="status-tabs">
        {VISIBLE_TABS.map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(0);
            }}
            className={`status-tab ${statusFilter === status ? 'active' : ''}`}
          >
            <Text variant="body" weight={statusFilter === status ? 'medium' : 'normal'}>
              {STATUS_LABELS[status]}
            </Text>
          </button>
        ))}
      </Box>

      {/* Puzzle List */}
      {isLoading && (
        <Box display="flex" justifyContent="center" padding="6">
          <Spinner size="lg" />
        </Box>
      )}

      {error && (
        <div className="error-box">
          <Text variant="body">Error loading puzzles: {error.message}</Text>
        </div>
      )}

      {data && data.puzzles.length === 0 && (
        <Box className="empty-state" padding="6">
          <Text variant="body">No puzzles found</Text>
          <Text variant="caption">
            {statusFilter === 'pending'
              ? 'Build puzzles using the Puzzle Builder'
              : `No ${statusFilter} puzzles`}
          </Text>
        </Box>
      )}

      {data && data.puzzles.length > 0 && (
        <>
          <Box display="flex" flexDirection="column" gap="md">
            {data.puzzles.map((puzzle) => (
              <Box key={puzzle.id} className="puzzle-card" padding="4">
                <Box display="flex" flexDirection="column" gap="md">
                  {/* Header with Status and Actions */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap="md">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: STATUS_COLORS[puzzle.status] }}
                      >
                        <Text variant="caption" weight="medium">
                          {STATUS_LABELS[puzzle.status].toUpperCase()}
                        </Text>
                      </span>
                      <Text variant="body" weight="medium">
                        Quality: {puzzle.qualityScore}/100
                      </Text>
                      {puzzle.title && (
                        <Text variant="caption">Title: {puzzle.title}</Text>
                      )}
                      {puzzle.puzzleDate && (
                        <Text variant="caption">
                          Scheduled: {new Date(puzzle.puzzleDate).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" gap="sm">
                      {puzzle.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(puzzle.id, 'approved')}
                            disabled={updateMutation.isPending}
                          >
                            Approve
                          </Button>
                          <div className="reject-btn-wrapper">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReject(puzzle.id)}
                              disabled={deleteMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        </>
                      )}

                      {puzzle.status === 'approved' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(puzzle.id, 'published')}
                            disabled={updateMutation.isPending || !puzzle.puzzleDate}
                          >
                            Publish
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(puzzle.id, 'pending')}
                            disabled={updateMutation.isPending}
                          >
                            Back to Pending
                          </Button>
                        </>
                      )}

                      {puzzle.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(puzzle.id, 'approved')}
                          disabled={updateMutation.isPending}
                        >
                          Unpublish
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Date Assignment */}
                  {puzzle.status === 'approved' && (
                    <Box display="flex" alignItems="center" gap="sm">
                      <Text variant="body">Assign Date:</Text>
                      <Input
                        type="date"
                        value={puzzle.puzzleDate || ''}
                        onChange={(e) => handleAssignDate(puzzle.id, e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        inputSize="md"
                      />
                    </Box>
                  )}

                  {/* Puzzle Groups */}
                  <Box display="flex" flexDirection="column" gap="sm">
                    <Text variant="body" weight="medium">
                      Groups:
                    </Text>
                    {puzzle.groups?.map((group, index) => (
                      <Box key={index} className="group-preview" padding="2">
                        <Box display="flex" alignItems="center" gap="sm">
                          <div
                            className="color-dot"
                            style={{ backgroundColor: DIFFICULTY_COLORS[group.color as keyof typeof DIFFICULTY_COLORS] || '#ccc' }}
                          />
                          <Text variant="caption" weight="medium">
                            {group.connection} ({group.difficulty})
                          </Text>
                        </Box>
                        <Text variant="caption">
                          {group.films.map((f) => f.title).join(', ')}
                        </Text>
                      </Box>
                    ))}
                    {!puzzle.groups?.length && (
                      <Text variant="caption">Groups not loaded</Text>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" gap="sm" padding="4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Text variant="body">
                Page {page + 1} of {totalPages}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Reject Puzzle"
        size="sm"
      >
        <ModalBody>
          <Text variant="body">
            Are you sure you want to reject this puzzle? It will be permanently deleted.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box display="flex" gap="sm" justifyContent="flex-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </Box>
        </ModalFooter>
      </Modal>
    </Box>
  );
}
