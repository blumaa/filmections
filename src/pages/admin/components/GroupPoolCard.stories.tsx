import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupPoolCard } from './GroupPoolCard';
import { MockThemeProvider } from '../../../../.storybook/MockThemeProvider';
import type { StoredGroup } from '../../../lib/supabase/storage';

const mockGroup: StoredGroup = {
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
};

const approvedGroup: StoredGroup = {
  ...mockGroup,
  id: '2',
  status: 'approved',
  color: 'green',
  difficulty: 'medium',
  usageCount: 3,
};

const meta: Meta<typeof GroupPoolCard> = {
  title: 'Admin/Components/GroupPoolCard',
  component: GroupPoolCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockThemeProvider>
        <div style={{ maxWidth: '800px' }}>
          <Story />
        </div>
      </MockThemeProvider>
    ),
  ],
  argTypes: {
    onEdit: { action: 'edit' },
    onSaveEdit: { action: 'save' },
    onCancelEdit: { action: 'cancel' },
    onConnectionChange: { action: 'connectionChange' },
    onColorChange: { action: 'colorChange' },
    onApprove: { action: 'approve' },
    onReject: { action: 'reject' },
  },
};

export default meta;
type Story = StoryObj<typeof GroupPoolCard>;

export const Pending: Story = {
  args: {
    group: mockGroup,
    isEditing: false,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
  },
};

export const Approved: Story = {
  args: {
    group: approvedGroup,
    isEditing: false,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
  },
};

export const Editing: Story = {
  args: {
    group: mockGroup,
    isEditing: true,
    editedConnection: 'Directed by Quentin Tarantino',
    isUpdating: false,
    isDeleting: false,
  },
};

export const Updating: Story = {
  args: {
    group: mockGroup,
    isEditing: true,
    editedConnection: 'Directed by Quentin Tarantino',
    isUpdating: true,
    isDeleting: false,
  },
};

export const BlueGroup: Story = {
  args: {
    group: {
      ...mockGroup,
      id: '3',
      color: 'blue',
      difficulty: 'hard',
      connection: 'Mind-bending narratives',
      films: [
        { id: 9, title: 'Inception', year: 2010 },
        { id: 10, title: 'The Matrix', year: 1999 },
        { id: 11, title: 'Tenet', year: 2020 },
        { id: 12, title: 'Memento', year: 2000 },
      ],
    },
    isEditing: false,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
  },
};

export const PurpleGroup: Story = {
  args: {
    group: {
      ...mockGroup,
      id: '4',
      color: 'purple',
      difficulty: 'hardest',
      connection: 'Films about human connection across space/time',
      films: [
        { id: 13, title: 'Interstellar', year: 2014 },
        { id: 14, title: 'Arrival', year: 2016 },
        { id: 15, title: '2001: A Space Odyssey', year: 1968 },
        { id: 16, title: 'Contact', year: 1997 },
      ],
    },
    isEditing: false,
    editedConnection: '',
    isUpdating: false,
    isDeleting: false,
  },
};
