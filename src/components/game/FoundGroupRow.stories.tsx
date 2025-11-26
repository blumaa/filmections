import type { Meta, StoryObj } from '@storybook/react';
import { FoundGroupRow } from './FoundGroupRow';
import { MockThemeProvider } from '../../../.storybook/MockThemeProvider';

const mockFilms = [
  { id: 1, title: 'Pulp Fiction', year: 1994 },
  { id: 2, title: 'Kill Bill', year: 2003 },
  { id: 3, title: 'Reservoir Dogs', year: 1992 },
  { id: 4, title: 'Django Unchained', year: 2012 },
];

const meta: Meta<typeof FoundGroupRow> = {
  title: 'Game/FoundGroupRow',
  component: FoundGroupRow,
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
type Story = StoryObj<typeof FoundGroupRow>;

export const Yellow: Story = {
  args: {
    group: {
      id: '1',
      films: mockFilms,
      connection: 'Directed by Quentin Tarantino',
      difficulty: 'easy',
      color: 'yellow',
    },
  },
};

export const Green: Story = {
  args: {
    group: {
      id: '2',
      films: mockFilms,
      connection: 'Films featuring revenge themes',
      difficulty: 'medium',
      color: 'green',
    },
  },
};

export const Blue: Story = {
  args: {
    group: {
      id: '3',
      films: mockFilms,
      connection: 'Non-linear storytelling',
      difficulty: 'hard',
      color: 'blue',
    },
  },
};

export const Purple: Story = {
  args: {
    group: {
      id: '4',
      films: mockFilms,
      connection: 'Films with memorable soundtracks',
      difficulty: 'hardest',
      color: 'purple',
    },
  },
};

export const LongConnection: Story = {
  args: {
    group: {
      id: '5',
      films: mockFilms,
      connection: 'Films that feature characters who undergo significant moral transformations throughout the narrative',
      difficulty: 'hard',
      color: 'blue',
    },
  },
};

export const AllColors: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FoundGroupRow
        group={{
          id: '1',
          films: mockFilms,
          connection: 'Easy - Yellow',
          difficulty: 'easy',
          color: 'yellow',
        }}
      />
      <FoundGroupRow
        group={{
          id: '2',
          films: mockFilms,
          connection: 'Medium - Green',
          difficulty: 'medium',
          color: 'green',
        }}
      />
      <FoundGroupRow
        group={{
          id: '3',
          films: mockFilms,
          connection: 'Hard - Blue',
          difficulty: 'hard',
          color: 'blue',
        }}
      />
      <FoundGroupRow
        group={{
          id: '4',
          films: mockFilms,
          connection: 'Hardest - Purple',
          difficulty: 'hardest',
          color: 'purple',
        }}
      />
    </div>
  ),
};

