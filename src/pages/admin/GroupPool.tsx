/**
 * GroupPool Admin Page
 *
 * Displays and manages the connection groups pool.
 * Allows filtering, approving, rejecting, and editing groups.
 */

import { useState } from 'react';
import { Box, Text, Button } from '@mond-design-system/theme';
import { Modal, ModalBody, ModalFooter } from '@mond-design-system/theme/client';
import { SupabaseGroupStorage } from '../../lib/supabase/storage/SupabaseGroupStorage';
import {
  useGroupList,
  useUpdateGroup,
  useDeleteGroup,
} from '../../lib/supabase/storage/useGroupStorage';
import type { GroupListFilters, GroupStatus, DifficultyColor } from '../../lib/supabase/storage';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../../providers/useToast';
import { COLOR_TO_DIFFICULTY } from '../../constants/difficulty';
import { GroupPoolHeader } from './components/GroupPoolHeader';
import { GroupPoolFilter } from './components/GroupPoolFilter';
import { GroupPoolList } from './components/GroupPoolList';
import './GroupPool.css';

// Create storage instance
const storage = new SupabaseGroupStorage(supabase);

export function GroupPool() {
  const toast = useToast();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<GroupStatus | 'all'>('pending');
  const [colorFilter, setColorFilter] = useState<DifficultyColor | 'all'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Build filters for query
  const filters: GroupListFilters = {
    limit: pageSize,
    offset: page * pageSize,
  };

  if (statusFilter !== 'all') {
    filters.status = statusFilter;
  }

  if (colorFilter !== 'all') {
    filters.color = colorFilter;
  }

  // Query groups
  const { data, isLoading, error } = useGroupList(filters, storage);

  // Mutations
  const updateMutation = useUpdateGroup(storage);
  const deleteMutation = useDeleteGroup(storage);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedConnection, setEditedConnection] = useState('');
  const [editedColor, setEditedColor] = useState<DifficultyColor>('green');

  const handleApprove = (id: string) => {
    updateMutation.mutate(
      { id, updates: { status: 'approved' } },
      {
        onSuccess: () => toast.showSuccess('Group approved'),
        onError: (err) => toast.showError('Failed to approve group', err.message),
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
          toast.showSuccess('Group rejected');
          setDeleteConfirm(null);
        },
        onError: (err) => toast.showError('Failed to reject group', err.message),
      });
    }
  };

  const handleStartEdit = (id: string, currentConnection: string, currentColor: DifficultyColor | null) => {
    setEditingId(id);
    setEditedConnection(currentConnection);
    setEditedColor(currentColor || 'green');
  };

  const handleSaveEdit = (id: string) => {
    const difficulty = COLOR_TO_DIFFICULTY[editedColor];
    updateMutation.mutate(
      { id, updates: { connection: editedConnection, color: editedColor, difficulty } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditedConnection('');
          setEditedColor('green');
          toast.showSuccess('Group updated');
        },
        onError: (err) => toast.showError('Failed to update group', err.message),
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedConnection('');
    setEditedColor('green');
  };

  const handleGroupColorChange = (id: string, color: DifficultyColor) => {
    const difficulty = COLOR_TO_DIFFICULTY[color];
    updateMutation.mutate(
      { id, updates: { color, difficulty } },
      {
        onSuccess: () => toast.showSuccess('Color updated'),
        onError: (err) => toast.showError('Failed to update color', err.message),
      }
    );
  };

  const handleStatusChange = (status: GroupStatus | 'all') => {
    setStatusFilter(status);
    setPage(0);
  };

  const handleFilterColorChange = (color: DifficultyColor | 'all') => {
    setColorFilter(color);
    setPage(0);
  };

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <GroupPoolHeader />

      <GroupPoolFilter
        statusFilter={statusFilter}
        colorFilter={colorFilter}
        onStatusChange={handleStatusChange}
        onColorChange={handleFilterColorChange}
        resultCount={data?.groups.length}
        totalCount={data?.total}
      />

      <GroupPoolList
        groups={data?.groups || []}
        isLoading={isLoading}
        error={error}
        editingId={editingId}
        editedConnection={editedConnection}
        onEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onConnectionChange={setEditedConnection}
        onColorChange={handleGroupColorChange}
        onApprove={handleApprove}
        onReject={handleReject}
        isUpdating={updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        onPageChange={setPage}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Reject Group"
        size="sm"
      >
        <ModalBody>
          <Text size="md">
            Are you sure you want to reject this group? It will be permanently deleted.
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
