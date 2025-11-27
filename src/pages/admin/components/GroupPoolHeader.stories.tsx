import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupPoolHeader } from './GroupPoolHeader';
import { MockThemeProvider } from '../../../../.storybook/MockThemeProvider';

const meta: Meta<typeof GroupPoolHeader> = {
  title: 'Admin/Components/GroupPoolHeader',
  component: GroupPoolHeader,
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
};

export default meta;
type Story = StoryObj<typeof GroupPoolHeader>;

export const Default: Story = {
  args: {},
};

export const CustomTitle: Story = {
  args: {
    title: 'Connection Groups',
    description: 'Browse and manage all connection groups in the system',
  },
};
