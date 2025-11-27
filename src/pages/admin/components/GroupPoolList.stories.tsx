import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupPoolList } from './GroupPoolList';
import { MockThemeProvider } from '../../../../.storybook/MockThemeProvider';
import type { StoredGroup } from '../../../lib/supabase/storage';

const mockGroups: StoredGroup[] = [
  {
    id: '1',
    createdAt: Date.now(),
    films: [
      { id: 1, title: 'Pulp Fiction', year: 1994 },
      { id: 2, title: 'Kill Bill', year: 2003 },
      { id: 3, title: 'Reservoir Dogs', year: 1992 },
      { id: 4, title: 'Django Unchained', year: 2012 },
    ],
    connection: 'Directed by Quentin Tarantino',
    connectionType: 'director',
    difficultyScore: 2500,
    color: 'yellow',
    difficulty: 'easy',
    status: 'pending',
    usageCount: 0,
    lastUsedAt: null,
  },
  {
    id: '2',
    createdAt: Date.now() - 86400000,
    films: [
      { id: 5, title: 'The Godfather', year: 1972 },
      { id: 6, title: 'Goodfellas', year: 1990 },
      { id: 7, title: 'Casino', year: 1995 },
      { id: 8, title: 'Scarface', year: 1983 },
    ],
    connection: 'Classic mob films',
    connectionType: 'genre',
    difficultyScore: 4500,
    color: 'green',
    difficulty: 'medium',
    status: 'approved',
    usageCount: 3,
    lastUsedAt: Date.now() - 172800000,
  },
  {
    id: '3',
    createdAt: Date.now() - 172800000,
    films: [
      { id: 9, title: 'Inception', year: 2010 },
      { id: 10, title: 'The Matrix', year: 1999 },
      { id: 11, title: 'Tenet', year: 2020 },
      { id: 12, title: 'Memento', year: 2000 },
    ],
    connection: 'Mind-bending narratives',
    connectionType: 'theme',
    difficultyScore: 6800,
    color: 'blue',
    difficulty: 'hard',
    status: 'pending',
    usageCount: 1,
    lastUsedAt: null,
  },
];

const meta: Meta<typeof GroupPoolList> = {
  title: 'Admin/Components/GroupPoolList',
  component: GroupPoolList,
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
    onEdit: { action: 'edit' },
    onSaveEdit: { action: 'saveEdit' },
    onCancelEdit: { action: 'cancelEdit' },
    onConnectionChange: { action: 'connectionChange' },
    onColorChange: { action: 'colorChange' },
    onApprove: { action: 'approve' },
    onReject: { action: 'reject' },
    onPageChange: { action: 'pageChange' },
  },
};

export default meta;
type Story = StoryObj<typeof GroupPoolList>;

export const Default: Story = {
  args: {
    groups: mockGroups,
    isLoading: false,
    error: null,
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 3,
  },
};

export const Loading: Story = {
  args: {
    groups: [],
    isLoading: true,
    error: null,
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 0,
  },
};

export const ErrorState: Story = {
  args: {
    groups: [],
    isLoading: false,
    error: new Error('Failed to connect to database'),
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 0,
  },
};

export const Empty: Story = {
  args: {
    groups: [],
    isLoading: false,
    error: null,
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 0,
  },
};

export const WithPagination: Story = {
  args: {
    groups: mockGroups,
    isLoading: false,
    error: null,
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 45,
  },
};

export const SecondPage: Story = {
  args: {
    groups: mockGroups,
    isLoading: false,
    error: null,
    editingId: null,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
    page: 1,
    pageSize: 20,
    total: 45,
  },
};

export const WithEditing: Story = {
  args: {
    groups: mockGroups,
    isLoading: false,
    error: null,
    editingId: '1',
    editedConnection: 'Directed by Quentin Tarantino',
    isUpdating: false,
    isDeleting: false,
    page: 0,
    pageSize: 20,
    total: 3,
  },
};
