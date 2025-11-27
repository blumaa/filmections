import type { Meta, StoryObj } from '@storybook/react-vite';
import { PuzzleQueueCard } from './PuzzleQueueCard';
import { MockThemeProvider } from '../../../../.storybook/MockThemeProvider';
import type { StoredPuzzle } from '../../../lib/supabase/storage/IPuzzleStorage';

const mockGroups = [
  {
    id: '1',
    films: [
      { id: 1, title: 'Pulp Fiction', year: 1994 },
      { id: 2, title: 'Kill Bill', year: 2003 },
      { id: 3, title: 'Reservoir Dogs', year: 1992 },
      { id: 4, title: 'Django Unchained', year: 2012 },
    ],
    connection: 'Directed by Quentin Tarantino',
    difficulty: 'easy' as const,
    color: 'yellow' as const,
  },
  {
    id: '2',
    films: [
      { id: 5, title: 'The Godfather', year: 1972 },
      { id: 6, title: 'Goodfellas', year: 1990 },
      { id: 7, title: 'Casino', year: 1995 },
      { id: 8, title: 'Scarface', year: 1983 },
    ],
    connection: 'Classic mob films',
    difficulty: 'medium' as const,
    color: 'green' as const,
  },
  {
    id: '3',
    films: [
      { id: 9, title: 'Inception', year: 2010 },
      { id: 10, title: 'The Matrix', year: 1999 },
      { id: 11, title: 'Tenet', year: 2020 },
      { id: 12, title: 'Memento', year: 2000 },
    ],
    connection: 'Mind-bending narratives',
    difficulty: 'hard' as const,
    color: 'blue' as const,
  },
  {
    id: '4',
    films: [
      { id: 13, title: 'Interstellar', year: 2014 },
      { id: 14, title: 'Arrival', year: 2016 },
      { id: 15, title: '2001: A Space Odyssey', year: 1968 },
      { id: 16, title: 'Contact', year: 1997 },
    ],
    connection: 'Humanity encounters the unknown',
    difficulty: 'hardest' as const,
    color: 'purple' as const,
  },
];

const basePuzzle: StoredPuzzle = {
  id: '1',
  createdAt: Date.now(),
  puzzleDate: null,
  title: 'Movie Connections #42',
  groupIds: ['1', '2', '3', '4'],
  status: 'pending',
  qualityScore: 85,
  groups: mockGroups,
};

const meta: Meta<typeof PuzzleQueueCard> = {
  title: 'Admin/Components/PuzzleQueueCard',
  component: PuzzleQueueCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <Story />
      </MockThemeProvider>
    ),
  ],
  argTypes: {
    onStatusChange: { action: 'statusChange' },
    onReject: { action: 'reject' },
    onAssignDate: { action: 'assignDate' },
  },
};

export default meta;
type Story = StoryObj<typeof PuzzleQueueCard>;

export const Pending: Story = {
  args: {
    puzzle: basePuzzle,
    isUpdating: false,
    isDeleting: false,
  },
};

export const Approved: Story = {
  args: {
    puzzle: {
      ...basePuzzle,
      status: 'approved',
    },
    isUpdating: false,
    isDeleting: false,
  },
};

export const ApprovedWithDate: Story = {
  args: {
    puzzle: {
      ...basePuzzle,
      status: 'approved',
      puzzleDate: '2025-01-15',
    },
    isUpdating: false,
    isDeleting: false,
  },
};

export const Published: Story = {
  args: {
    puzzle: {
      ...basePuzzle,
      status: 'published',
      puzzleDate: '2025-01-10',
    },
    isUpdating: false,
    isDeleting: false,
  },
};

export const Updating: Story = {
  args: {
    puzzle: basePuzzle,
    isUpdating: true,
    isDeleting: false,
  },
};

export const NoGroups: Story = {
  args: {
    puzzle: {
      ...basePuzzle,
      groups: undefined,
    },
    isUpdating: false,
    isDeleting: false,
  },
};

export const NoTitle: Story = {
  args: {
    puzzle: {
      ...basePuzzle,
      title: null,
    },
    isUpdating: false,
    isDeleting: false,
  },
};
