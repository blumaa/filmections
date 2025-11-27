/**
 * PuzzleQueue Admin Page
 *
 * Displays puzzles and their status.
 * Allows approving, publishing, and scheduling puzzles.
 */

import { useState } from 'react';
import { Box, Heading, Text, Button, Spinner } from '@mond-design-system/theme';
import { Modal, ModalBody, ModalFooter, Pagination } from '@mond-design-system/theme/client';
import { usePuzzleList, useUpdatePuzzle, useDeletePuzzle } from '../../lib/supabase/storage/usePuzzleStorage';
import { SupabaseStorage } from '../../lib/supabase/storage/SupabaseStorage';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../../providers/useToast';
import type { PuzzleStatus } from '../../lib/supabase/storage/IPuzzleStorage';
import { PuzzleQueueCard } from './components/PuzzleQueueCard';
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

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      {/* Header */}
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Puzzle Queue
        </Heading>
        <Text size="md">Review and manage puzzles</Text>
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
            <Text size="md" weight={statusFilter === status ? 'medium' : 'normal'}>
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
          <Text size="md">Error loading puzzles: {error.message}</Text>
        </div>
      )}

      {data && data.puzzles.length === 0 && (
        <Box className="empty-state" padding="6">
          <Text size="md">No puzzles found</Text>
          <Text size="xs">
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
              <PuzzleQueueCard
                key={puzzle.id}
                puzzle={puzzle}
                onStatusChange={handleStatusChange}
                onReject={handleReject}
                onAssignDate={handleAssignDate}
                isUpdating={updateMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </Box>

          {/* Pagination */}
          {data.total > pageSize && (
            <Box padding="4">
              <Pagination
                currentPage={page + 1}
                totalItems={data.total}
                itemsPerPage={pageSize}
                onPageChange={(newPage) => setPage(newPage - 1)}
                showItemsPerPage={false}
                size="sm"
              />
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
          <Text size="md">
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
