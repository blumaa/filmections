import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResultsModal } from './ResultsModal';
import { StatsProvider } from '../../providers/StatsProvider';
import { StorageProvider } from '../../providers/StorageProvider';

const meta: Meta<typeof ResultsModal> = {
  title: 'Game/ResultsModal',
  component: ResultsModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StorageProvider>
        <StatsProvider>
          <Story />
        </StatsProvider>
      </StorageProvider>
    ),
  ],
  argTypes: {
    isOpen: { control: 'boolean' },
    gameStatus: { control: 'select', options: ['won', 'lost'] },
    mistakes: { control: { type: 'number', min: 0, max: 4 } },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof ResultsModal>;

export const Won: Story = {
  args: {
    isOpen: true,
    gameStatus: 'won',
    mistakes: 1,
  },
};

export const WonPerfect: Story = {
  args: {
    isOpen: true,
    gameStatus: 'won',
    mistakes: 0,
  },
};

export const Lost: Story = {
  args: {
    isOpen: true,
    gameStatus: 'lost',
    mistakes: 4,
  },
};

export const WonWithMistakes: Story = {
  args: {
    isOpen: true,
    gameStatus: 'won',
    mistakes: 3,
  },
};

