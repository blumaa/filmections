import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Heading, Text, Button } from '@mond-design-system/theme';
import { ToastProvider } from '../../providers/ToastProvider';
import { MockThemeProvider } from '../../../.storybook/MockThemeProvider';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../constants/difficulty';
import type { StoredGroup, DifficultyColor } from '../../lib/supabase/storage';
import './PuzzleBuilder.css';

// Color order for puzzle building
const colors: DifficultyColor[] = ['yellow', 'green', 'blue', 'purple'];

// Mock data for stories
const mockGroupsByColor: Record<DifficultyColor, StoredGroup[]> = {
  yellow: [
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
      status: 'approved',
      usageCount: 2,
      lastUsedAt: null,
    },
    {
      id: '2',
      createdAt: Date.now(),
      films: [
        { id: 5, title: 'Toy Story', year: 1995 },
        { id: 6, title: 'Finding Nemo', year: 2003 },
        { id: 7, title: 'The Incredibles', year: 2004 },
        { id: 8, title: 'WALL-E', year: 2008 },
      ],
      connection: 'Pixar films',
      connectionType: 'studio',
      difficultyScore: 1500,
      color: 'yellow',
      difficulty: 'easy',
      status: 'approved',
      usageCount: 0,
      lastUsedAt: null,
    },
  ],
  green: [
    {
      id: '3',
      createdAt: Date.now(),
      films: [
        { id: 9, title: 'The Godfather', year: 1972 },
        { id: 10, title: 'Goodfellas', year: 1990 },
        { id: 11, title: 'Casino', year: 1995 },
        { id: 12, title: 'Scarface', year: 1983 },
      ],
      connection: 'Classic mob films',
      connectionType: 'genre',
      difficultyScore: 4500,
      color: 'green',
      difficulty: 'medium',
      status: 'approved',
      usageCount: 3,
      lastUsedAt: null,
    },
  ],
  blue: [
    {
      id: '4',
      createdAt: Date.now(),
      films: [
        { id: 13, title: 'Inception', year: 2010 },
        { id: 14, title: 'The Matrix', year: 1999 },
        { id: 15, title: 'Tenet', year: 2020 },
        { id: 16, title: 'Memento', year: 2000 },
      ],
      connection: 'Mind-bending narratives',
      connectionType: 'theme',
      difficultyScore: 6800,
      color: 'blue',
      difficulty: 'hard',
      status: 'approved',
      usageCount: 1,
      lastUsedAt: null,
    },
  ],
  purple: [
    {
      id: '5',
      createdAt: Date.now(),
      films: [
        { id: 17, title: 'Interstellar', year: 2014 },
        { id: 18, title: 'Arrival', year: 2016 },
        { id: 19, title: '2001: A Space Odyssey', year: 1968 },
        { id: 20, title: 'Contact', year: 1997 },
      ],
      connection: 'Films about human connection across space/time',
      connectionType: 'theme',
      difficultyScore: 8500,
      color: 'purple',
      difficulty: 'hardest',
      status: 'approved',
      usageCount: 0,
      lastUsedAt: null,
    },
  ],
};

// Static presentational component for stories
interface PuzzleBuilderDisplayProps {
  title: string;
  selectedGroups: Record<DifficultyColor, StoredGroup | null>;
  groupsByColor: Record<DifficultyColor, StoredGroup[]>;
  activeColor: DifficultyColor | null;
}

function PuzzleBuilderDisplay({
  title,
  selectedGroups,
  groupsByColor,
  activeColor,
}: PuzzleBuilderDisplayProps) {
  const allSelected = colors.every((color) => selectedGroups[color] !== null);

  const qualityScore = (() => {
    const selected = Object.values(selectedGroups).filter((g): g is StoredGroup => g !== null);
    if (selected.length === 0) return 0;
    const avgScore = selected.reduce((sum, g) => sum + g.difficultyScore, 0) / selected.length;
    return Math.min(100, Math.round(avgScore / 100));
  })();

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Puzzle Builder
        </Heading>
        <Text size="md">
          Select one group from each difficulty level to create a puzzle
        </Text>
      </Box>

      {/* Puzzle Title */}
      <Box display="flex" flexDirection="column" gap="xs" className="title-section">
        <Text size="md" weight="medium">
          Puzzle Title (optional)
        </Text>
        <input
          type="text"
          value={title}
          placeholder="Enter a title for this puzzle..."
          className="title-input"
          readOnly
        />
      </Box>

      {/* Group Selection Grid */}
      <div className="builder-grid">
        {colors.map((color) => (
          <Box key={color} className="color-slot">
            {/* Slot Header */}
            <div
              className="slot-header"
              style={{ borderTopColor: DIFFICULTY_COLORS[color] }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box display="flex" alignItems="center" gap="sm">
                  <div
                    className="color-dot"
                    style={{ backgroundColor: DIFFICULTY_COLORS[color] }}
                  />
                  <Text size="md" weight="medium">
                    {DIFFICULTY_LABELS[color]}
                  </Text>
                </Box>
                <Text size="xs">
                  {groupsByColor[color].length} available
                </Text>
              </Box>
            </div>

            {/* Selected Group or Selector */}
            <Box className="slot-content" padding="3">
              {selectedGroups[color] ? (
                <Box display="flex" flexDirection="column" gap="sm">
                  <Text size="md" weight="medium">
                    {selectedGroups[color]!.connection}
                  </Text>
                  <Box display="flex" gap="xs" className="films-preview">
                    {selectedGroups[color]!.films.map((film) => (
                      <Text key={film.id} size="xs">
                        {film.title}
                      </Text>
                    ))}
                  </Box>
                  <Button variant="outline" size="sm">
                    Remove
                  </Button>
                </Box>
              ) : activeColor === color ? (
                <Box display="flex" flexDirection="column" gap="sm" className="group-list">
                  {groupsByColor[color].length === 0 ? (
                    <Text size="xs">No approved groups available</Text>
                  ) : (
                    <>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Text size="xs">Select a group:</Text>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </Box>
                      <Box className="group-options">
                        {groupsByColor[color].map((group) => (
                          <Box key={group.id} className="group-option">
                            <Text size="md" weight="medium">
                              {group.connection}
                            </Text>
                            <Text size="xs">
                              {group.films.map((f) => f.title).join(', ')}
                            </Text>
                            <span className="usage-badge">
                              <Text size="xs">
                                Used {group.usageCount}x
                              </Text>
                            </span>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                <Button variant="outline" size="md">
                  Select {DIFFICULTY_LABELS[color]} Group
                </Button>
              )}
            </Box>
          </Box>
        ))}
      </div>

      {/* Preview & Save */}
      {allSelected && (
        <Box className="preview-section" padding="4">
          <Box display="flex" flexDirection="column" gap="md">
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Heading level={2} size="lg">
                Puzzle Preview
              </Heading>
              <Text size="md">
                Quality Score: {qualityScore}
              </Text>
            </Box>

            <Box display="flex" flexDirection="column" gap="sm">
              {colors.map((color) => (
                <Box
                  key={color}
                  display="flex"
                  gap="md"
                  alignItems="center"
                  className="preview-row"
                >
                  <div
                    className="preview-color"
                    style={{ backgroundColor: DIFFICULTY_COLORS[color] }}
                  />
                  <Box display="flex" flexDirection="column">
                    <Text size="md" weight="medium">
                      {selectedGroups[color]!.connection}
                    </Text>
                    <Text size="xs">
                      {selectedGroups[color]!.films.map((f) => f.title).join(' | ')}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" padding="4">
              <Button variant="primary" size="lg">
                Save to Queue
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

const meta: Meta<typeof PuzzleBuilderDisplay> = {
  title: 'Admin/PuzzleBuilder',
  component: PuzzleBuilderDisplay,
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
type Story = StoryObj<typeof PuzzleBuilderDisplay>;

export const Empty: Story = {
  args: {
    title: '',
    selectedGroups: {
      yellow: null,
      green: null,
      blue: null,
      purple: null,
    },
    groupsByColor: mockGroupsByColor,
    activeColor: null,
  },
};

export const SelectingYellow: Story = {
  args: {
    title: '',
    selectedGroups: {
      yellow: null,
      green: null,
      blue: null,
      purple: null,
    },
    groupsByColor: mockGroupsByColor,
    activeColor: 'yellow',
  },
};

export const PartiallyFilled: Story = {
  args: {
    title: 'Movie Masters',
    selectedGroups: {
      yellow: mockGroupsByColor.yellow[0],
      green: mockGroupsByColor.green[0],
      blue: null,
      purple: null,
    },
    groupsByColor: mockGroupsByColor,
    activeColor: null,
  },
};

export const AllSelected: Story = {
  args: {
    title: 'Ultimate Film Challenge',
    selectedGroups: {
      yellow: mockGroupsByColor.yellow[0],
      green: mockGroupsByColor.green[0],
      blue: mockGroupsByColor.blue[0],
      purple: mockGroupsByColor.purple[0],
    },
    groupsByColor: mockGroupsByColor,
    activeColor: null,
  },
};
