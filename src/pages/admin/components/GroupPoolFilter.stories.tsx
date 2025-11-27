import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupPoolFilter } from './GroupPoolFilter';
import { MockThemeProvider } from '../../../../.storybook/MockThemeProvider';

const meta: Meta<typeof GroupPoolFilter> = {
  title: 'Admin/Components/GroupPoolFilter',
  component: GroupPoolFilter,
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
    onColorChange: { action: 'colorChange' },
  },
};

export default meta;
type Story = StoryObj<typeof GroupPoolFilter>;

export const Default: Story = {
  args: {
    statusFilter: 'pending',
    colorFilter: 'all',
    resultCount: 15,
    totalCount: 45,
  },
};

export const AllFilters: Story = {
  args: {
    statusFilter: 'all',
    colorFilter: 'all',
    resultCount: 45,
    totalCount: 45,
  },
};

export const ApprovedYellow: Story = {
  args: {
    statusFilter: 'approved',
    colorFilter: 'yellow',
    resultCount: 5,
    totalCount: 45,
  },
};

export const WithoutCounts: Story = {
  args: {
    statusFilter: 'pending',
    colorFilter: 'all',
  },
};

export const PurpleHardest: Story = {
  args: {
    statusFilter: 'all',
    colorFilter: 'purple',
    resultCount: 8,
    totalCount: 45,
  },
};
