import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Heading, Text, Spinner } from '@mond-design-system/theme';
import { ToastProvider } from '../../providers/ToastProvider';
import { MockThemeProvider } from '../../../.storybook/MockThemeProvider';
import type { PuzzleStatus, StoredPuzzle } from '../../lib/supabase/storage/IPuzzleStorage';
import { PuzzleQueueCard } from './components/PuzzleQueueCard';
import './PuzzleQueue.css';

type StatusFilter = PuzzleStatus | 'all';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  pending: 'Pending',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
};

const VISIBLE_TABS: StatusFilter[] = ['all', 'pending', 'approved', 'published'];

// Mock puzzle data
const mockGroups = [
  {
    id: '1',
    connection: 'Directed by Quentin Tarantino',
    difficulty: 'easy' as const,
    color: 'yellow' as const,
    films: [
      { id: 1, title: 'Pulp Fiction', year: 1994 },
      { id: 2, title: 'Kill Bill', year: 2003 },
      { id: 3, title: 'Reservoir Dogs', year: 1992 },
      { id: 4, title: 'Django Unchained', year: 2012 },
    ],
  },
  {
    id: '2',
    connection: 'Classic mob films',
    difficulty: 'medium' as const,
    color: 'green' as const,
    films: [
      { id: 5, title: 'The Godfather', year: 1972 },
      { id: 6, title: 'Goodfellas', year: 1990 },
      { id: 7, title: 'Casino', year: 1995 },
      { id: 8, title: 'Scarface', year: 1983 },
    ],
  },
  {
    id: '3',
    connection: 'Mind-bending narratives',
    difficulty: 'hard' as const,
    color: 'blue' as const,
    films: [
      { id: 9, title: 'Inception', year: 2010 },
      { id: 10, title: 'The Matrix', year: 1999 },
      { id: 11, title: 'Tenet', year: 2020 },
      { id: 12, title: 'Memento', year: 2000 },
    ],
  },
  {
    id: '4',
    connection: 'Space/time connection',
    difficulty: 'hardest' as const,
    color: 'purple' as const,
    films: [
      { id: 13, title: 'Interstellar', year: 2014 },
      { id: 14, title: 'Arrival', year: 2016 },
      { id: 15, title: '2001: A Space Odyssey', year: 1968 },
      { id: 16, title: 'Contact', year: 1997 },
    ],
  },
];

const mockPuzzles: StoredPuzzle[] = [
  {
    id: '1',
    createdAt: Date.now(),
    status: 'pending',
    qualityScore: 72,
    title: 'Movie Masters',
    puzzleDate: null,
    groupIds: ['1', '2', '3', '4'],
    groups: mockGroups,
  },
  {
    id: '2',
    createdAt: Date.now() - 86400000,
    status: 'approved',
    qualityScore: 85,
    title: 'Oscar Winners',
    puzzleDate: '2024-12-25',
    groupIds: ['1', '2', '3', '4'],
    groups: mockGroups,
  },
  {
    id: '3',
    createdAt: Date.now() - 172800000,
    status: 'published',
    qualityScore: 90,
    title: 'Cinematic Legends',
    puzzleDate: '2024-12-20',
    groupIds: ['1', '2', '3', '4'],
    groups: mockGroups,
  },
];

// Static presentational component for stories
interface PuzzleQueueDisplayProps {
  puzzles: StoredPuzzle[];
  statusFilter: StatusFilter;
  isLoading?: boolean;
  error?: string;
}

function PuzzleQueueDisplay({
  puzzles,
  statusFilter,
  isLoading,
  error,
}: PuzzleQueueDisplayProps) {
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
            className={`status-tab ${statusFilter === status ? 'active' : ''}`}
          >
            <Text size="md" weight={statusFilter === status ? 'medium' : 'normal'}>
              {STATUS_LABELS[status]}
            </Text>
          </button>
        ))}
      </Box>

      {/* Loading state */}
      {isLoading && (
        <Box display="flex" justifyContent="center" padding="6">
          <Spinner size="lg" />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <div className="error-box">
          <Text size="md">Error loading puzzles: {error}</Text>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && puzzles.length === 0 && (
        <Box className="empty-state" padding="6">
          <Text size="md">No puzzles found</Text>
          <Text size="xs">
            {statusFilter === 'pending'
              ? 'Build puzzles using the Puzzle Builder'
              : `No ${statusFilter} puzzles`}
          </Text>
        </Box>
      )}

      {/* Puzzle List */}
      {!isLoading && !error && puzzles.length > 0 && (
        <Box display="flex" flexDirection="column" gap="md">
          {puzzles.map((puzzle) => (
            <PuzzleQueueCard
              key={puzzle.id}
              puzzle={puzzle}
              onStatusChange={() => {}}
              onReject={() => {}}
              onAssignDate={() => {}}
              isUpdating={false}
              isDeleting={false}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

const meta: Meta<typeof PuzzleQueueDisplay> = {
  title: 'Admin/PuzzleQueue',
  component: PuzzleQueueDisplay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </MockThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PuzzleQueueDisplay>;

export const AllPuzzles: Story = {
  args: {
    puzzles: mockPuzzles,
    statusFilter: 'all',
  },
};

export const PendingPuzzles: Story = {
  args: {
    puzzles: mockPuzzles.filter((p) => p.status === 'pending'),
    statusFilter: 'pending',
  },
};

export const ApprovedPuzzles: Story = {
  args: {
    puzzles: mockPuzzles.filter((p) => p.status === 'approved'),
    statusFilter: 'approved',
  },
};

export const PublishedPuzzles: Story = {
  args: {
    puzzles: mockPuzzles.filter((p) => p.status === 'published'),
    statusFilter: 'published',
  },
};

export const Loading: Story = {
  args: {
    puzzles: [],
    statusFilter: 'pending',
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    puzzles: [],
    statusFilter: 'pending',
    error: 'Failed to connect to database',
  },
};

export const Empty: Story = {
  args: {
    puzzles: [],
    statusFilter: 'pending',
  },
};
