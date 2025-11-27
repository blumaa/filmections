import { Box, Text, Spinner } from '@mond-design-system/theme';
import { Pagination } from '@mond-design-system/theme/client';
import type { StoredGroup, DifficultyColor } from '../../../lib/supabase/storage';
import { GroupPoolCard } from './GroupPoolCard';
import './GroupPoolList.css';

interface GroupPoolListProps {
  groups: StoredGroup[];
  isLoading: boolean;
  error: Error | null;
  // Editing state
  editingId: string | null;
  editedConnection: string;
  // Callbacks
  onEdit: (id: string, connection: string, color: DifficultyColor | null) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onConnectionChange: (value: string) => void;
  onColorChange: (id: string, color: DifficultyColor) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  // Pagination
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function GroupPoolList({
  groups,
  isLoading,
  error,
  editingId,
  editedConnection,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onConnectionChange,
  onColorChange,
  onApprove,
  onReject,
  isUpdating,
  isDeleting,
  page,
  pageSize,
  total,
  onPageChange,
}: GroupPoolListProps) {
  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" padding="4" gap="sm">
        <Spinner size="md" />
        <Text responsive>Loading groups...</Text>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box padding="3" className="error-message">
        <Text responsive>Error loading groups: {error.message}</Text>
      </Box>
    );
  }

  // Empty state
  if (groups.length === 0) {
    return (
      <Box padding="4" className="empty-state">
        <Text responsive>No groups found with current filters</Text>
      </Box>
    );
  }

  return (
    <>
      {/* Groups List */}
      <Box display="flex" flexDirection="column" gap="md">
        {groups.map((group) => (
          <GroupPoolCard
            key={group.id}
            group={group}
            isEditing={editingId === group.id}
            editedConnection={editedConnection}
            onEdit={() => onEdit(group.id, group.connection, group.color)}
            onSaveEdit={() => onSaveEdit(group.id)}
            onCancelEdit={onCancelEdit}
            onConnectionChange={onConnectionChange}
            onColorChange={onColorChange}
            onApprove={() => onApprove(group.id)}
            onReject={() => onReject(group.id)}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        ))}
      </Box>

      {/* Pagination */}
      {total > pageSize && (
        <Box padding="4">
          <Pagination
            currentPage={page + 1}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={(newPage) => onPageChange(newPage - 1)}
            showItemsPerPage={false}
            size="sm"
          />
        </Box>
      )}
    </>
  );
}
