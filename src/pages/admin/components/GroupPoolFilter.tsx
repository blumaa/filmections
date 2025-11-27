import { Box, Text } from '@mond-design-system/theme';
import { Select } from '@mond-design-system/theme/client';
import type { GroupStatus, DifficultyColor } from '../../../lib/supabase/storage';
import './GroupPoolFilter.css';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const colorOptions = [
  { value: 'all', label: 'All Colors' },
  { value: 'yellow', label: 'Yellow (Easy)' },
  { value: 'green', label: 'Green (Medium)' },
  { value: 'blue', label: 'Blue (Hard)' },
  { value: 'purple', label: 'Purple (Hardest)' },
];

interface GroupPoolFilterProps {
  statusFilter: GroupStatus | 'all';
  colorFilter: DifficultyColor | 'all';
  onStatusChange: (status: GroupStatus | 'all') => void;
  onColorChange: (color: DifficultyColor | 'all') => void;
  resultCount?: number;
  totalCount?: number;
}

export function GroupPoolFilter({
  statusFilter,
  colorFilter,
  onStatusChange,
  onColorChange,
  resultCount,
  totalCount,
}: GroupPoolFilterProps) {
  return (
    <Box display="flex" gap="md" alignItems="center" className="group-filters">
      <Select
        label="Status"
        options={statusOptions}
        value={statusFilter}
        onChange={(value) => onStatusChange(value as GroupStatus | 'all')}
        size="sm"
      />

      <Select
        label="Color"
        options={colorOptions}
        value={colorFilter}
        onChange={(value) => onColorChange(value as DifficultyColor | 'all')}
        size="sm"
      />

      {resultCount !== undefined && totalCount !== undefined && (
        <Text responsive semantic="secondary">
          Showing {resultCount} of {totalCount} groups
        </Text>
      )}
    </Box>
  );
}
