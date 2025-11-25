/**
 * GroupPool Admin Page
 *
 * Displays and manages the connection groups pool.
 * Allows filtering, approving, rejecting, and editing groups.
 */

import { useState } from 'react';
import { Box, Heading, Text, Button } from '@mond-design-system/theme';
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
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, COLOR_TO_DIFFICULTY } from '../../constants/difficulty';
import './GroupPool.css';

// Create storage instance
const storage = new SupabaseGroupStorage(supabase);

// Available colors for editing
const availableColors: DifficultyColor[] = ['yellow', 'green', 'blue', 'purple'];

export function GroupPool() {
  const toast = useToast();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<GroupStatus | 'all'>('pending');
  const [colorFilter, setColorFilter] = useState<DifficultyColor | 'all'>('all');
  const [page, setPage] = useState(0);
  const pageSize = 20;

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


  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Group Pool
        </Heading>
        <Text variant="body">
          Manage connection groups for puzzle building
        </Text>
      </Box>

      {/* Filters */}
      <Box display="flex" gap="md" alignItems="center" className="group-filters">
        <Box display="flex" gap="sm" alignItems="center">
          <Text variant="body" weight="medium">Status:</Text>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as GroupStatus | 'all');
              setPage(0);
            }}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </Box>

        <Box display="flex" gap="sm" alignItems="center">
          <Text variant="body" weight="medium">Color:</Text>
          <select
            value={colorFilter}
            onChange={(e) => {
              setColorFilter(e.target.value as DifficultyColor | 'all');
              setPage(0);
            }}
            className="filter-select"
          >
            <option value="all">All Colors</option>
            <option value="yellow">Yellow (Easy)</option>
            <option value="green">Green (Medium)</option>
            <option value="blue">Blue (Hard)</option>
            <option value="purple">Purple (Hardest)</option>
          </select>
        </Box>

        {data && (
          <Text variant="caption">
            Showing {data.groups.length} of {data.total} groups
          </Text>
        )}
      </Box>

      {/* Loading/Error states */}
      {isLoading && (
        <Box padding="4" className="loading-state">
          <Text variant="body">Loading groups...</Text>
        </Box>
      )}

      {error && (
        <Box padding="3" className="error-message">
          <Text variant="body">Error loading groups: {error.message}</Text>
        </Box>
      )}

      {/* Groups List */}
      {data && data.groups.length > 0 && (
        <Box display="flex" flexDirection="column" gap="md">
          {data.groups.map((group) => (
            <Box
              key={group.id}
              className="group-card"
              padding="3"
            >
              {/* Color indicator bar */}
              <div
                className="color-indicator"
                style={{ backgroundColor: DIFFICULTY_COLORS[group.color || 'green'] }}
              />

              <Box display="flex" flexDirection="column" gap="sm" className="group-content">
                {/* Header with connection and actions */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box display="flex" flexDirection="column" gap="xs" className="group-info">
                    {editingId === group.id ? (
                      <>
                        <input
                          type="text"
                          value={editedConnection}
                          onChange={(e) => setEditedConnection(e.target.value)}
                          className="connection-edit-input"
                          autoFocus
                        />
                        <Box display="flex" gap="xs" alignItems="center" className="color-buttons">
                          {availableColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`color-btn ${editedColor === color ? 'selected' : ''}`}
                              style={{ backgroundColor: DIFFICULTY_COLORS[color] }}
                              onClick={() => setEditedColor(color)}
                              title={DIFFICULTY_LABELS[color]}
                            >
                              {editedColor === color && '✓'}
                            </button>
                          ))}
                        </Box>
                      </>
                    ) : (
                      <Text variant="body" weight="medium">
                        {group.connection}
                      </Text>
                    )}
                    <Box display="flex" gap="sm" alignItems="center" className="group-meta">
                      <span className="meta-tag">
                        {group.connectionType}
                      </span>
                      <span className="meta-tag">
                        Score: {group.difficultyScore}
                      </span>
                      <span className="meta-tag">
                        Used: {group.usageCount}x
                      </span>
                      <span className={`status-badge status-${group.status}`}>
                        {group.status}
                      </span>
                    </Box>
                  </Box>

                  {/* Action buttons */}
                  <Box display="flex" gap="xs">
                    {editingId === group.id ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveEdit(group.id)}
                          disabled={updateMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(group.id, group.connection, group.color)}
                        >
                          Edit
                        </Button>
                        {group.status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApprove(group.id)}
                              disabled={updateMutation.isPending}
                            >
                              Approve
                            </Button>
                            <div className="reject-btn-wrapper">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(group.id)}
                                disabled={deleteMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                </Box>

                {/* Films list */}
                <Box display="flex" gap="sm" className="films-list">
                  {group.films.map((film) => (
                    <Box key={film.id} className="film-chip">
                      <Text variant="caption">
                        {film.title} ({film.year})
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Empty state */}
      {data && data.groups.length === 0 && (
        <Box padding="4" className="empty-state">
          <Text variant="body">No groups found with current filters</Text>
        </Box>
      )}

      {/* Pagination */}
      {data && data.total > pageSize && (
        <Box display="flex" justifyContent="center" gap="md" padding="4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Text variant="body">
            Page {page + 1} of {Math.ceil(data.total / pageSize)}
          </Text>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={(page + 1) * pageSize >= data.total}
          >
            Next
          </Button>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Reject Group"
        size="sm"
      >
        <ModalBody>
          <Text variant="body">
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
