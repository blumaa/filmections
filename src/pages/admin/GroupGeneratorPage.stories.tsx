import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Heading, Text, Button, Badge } from '@mond-design-system/theme';
import { ToastProvider } from '../../providers/ToastProvider';
import { MockThemeProvider } from '../../../.storybook/MockThemeProvider';
import { DIFFICULTY_COLORS } from '../../constants/difficulty';
import type { DifficultyColor, DifficultyLevel } from '../../lib/supabase/storage';
import './GroupGeneratorPage.css';

// Mock generated group type
interface MockGeneratedGroup {
  films: Array<{ id: number; title: string; year: number }>;
  connection: string;
  color: DifficultyColor;
  difficulty: DifficultyLevel;
  category?: string;
  explanation?: string;
  source?: 'deterministic' | 'ai-thematic';
}

// Mock data for stories
const mockGeneratedGroups: MockGeneratedGroup[] = [
  {
    films: [
      { id: 1, title: 'Pulp Fiction', year: 1994 },
      { id: 2, title: 'Kill Bill: Volume 1', year: 2003 },
      { id: 3, title: 'Reservoir Dogs', year: 1992 },
      { id: 4, title: 'Django Unchained', year: 2012 },
    ],
    connection: 'Directed by Quentin Tarantino',
    color: 'yellow',
    difficulty: 'easy',
    category: 'director',
    source: 'deterministic',
    explanation: 'All films directed by Quentin Tarantino',
  },
  {
    films: [
      { id: 5, title: 'The Godfather', year: 1972 },
      { id: 6, title: 'Scarface', year: 1983 },
      { id: 7, title: 'Heat', year: 1995 },
      { id: 8, title: 'The Irishman', year: 2019 },
    ],
    connection: 'Films starring Al Pacino',
    color: 'green',
    difficulty: 'medium',
    category: 'actor',
    source: 'deterministic',
    explanation: 'Al Pacino appears in all four films',
  },
  {
    films: [
      { id: 9, title: 'Inception', year: 2010 },
      { id: 10, title: 'The Matrix', year: 1999 },
      { id: 11, title: 'Tenet', year: 2020 },
      { id: 12, title: 'Memento', year: 2000 },
    ],
    connection: 'Mind-bending narratives with non-linear storytelling',
    color: 'blue',
    difficulty: 'hard',
    category: 'theme',
    source: 'ai-thematic',
    explanation: 'These films share complex narrative structures that challenge conventional storytelling',
  },
  {
    films: [
      { id: 13, title: 'Interstellar', year: 2014 },
      { id: 14, title: 'Arrival', year: 2016 },
      { id: 15, title: '2001: A Space Odyssey', year: 1968 },
      { id: 16, title: 'Contact', year: 1997 },
    ],
    connection: 'Humanity encounters the unknown in space',
    color: 'purple',
    difficulty: 'hardest',
    category: 'theme',
    source: 'ai-thematic',
    explanation: 'Films exploring first contact or cosmic mysteries with philosophical undertones',
  },
];

// Presentational component for generated groups display
interface GeneratedGroupsDisplayProps {
  groups: MockGeneratedGroup[];
  progress?: string;
  error?: string;
  isGenerating?: boolean;
  isSaving?: boolean;
}

function GeneratedGroupsDisplay({
  groups,
  progress,
  error,
  isGenerating = false,
  isSaving = false,
}: GeneratedGroupsDisplayProps) {
  return (
    <Box className="generator-section generator-results">
      <Box display="flex" flexDirection="column" gap="md">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Heading level={2} size="lg">
            Generated Groups
          </Heading>
          <Button variant="primary" size="md" disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </Box>

        {progress && (
          <Box className="progress-message" padding="2">
            <Text size="md">{progress}</Text>
          </Box>
        )}

        {error && (
          <Box className="error-message" padding="2">
            <Text size="md">{error}</Text>
          </Box>
        )}

        {groups.length > 0 ? (
          <>
            <Box display="flex" flexDirection="column" gap="md">
              {groups.map((group, index) => (
                <Box key={index} className="puzzle-result" padding="3">
                  <Box display="flex" flexDirection="column" gap="sm">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap="sm">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: DIFFICULTY_COLORS[group.color],
                          }}
                        />
                        <Text size="md" weight="medium">
                          {group.connection}
                        </Text>
                        <span className="verification-badge verified" title="Verified against actual data">
                          ✓
                        </span>
                      </Box>
                      <Box display="flex" alignItems="center" gap="sm">
                        {group.source === 'deterministic' && (
                          <Badge variant="default" size="sm">
                            guaranteed
                          </Badge>
                        )}
                        {group.category && (
                          <Badge variant="outline" size="sm">
                            {group.category}
                          </Badge>
                        )}
                        <Text size="xs">
                          {group.difficulty}
                        </Text>
                        <button
                          className="remove-group-btn"
                          aria-label="Remove group"
                        >
                          &times;
                        </button>
                      </Box>
                    </Box>
                    <Text size="xs">
                      {group.films.map((f) => `${f.title} (${f.year})`).join(', ')}
                    </Text>
                    {group.explanation && (
                      <span className="explanation-text">
                        <Text size="xs">{group.explanation}</Text>
                      </span>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" padding="4">
              <Button variant="primary" size="lg" disabled={isSaving}>
                {isSaving ? 'Saving...' : `Save ${groups.length} Groups to Pool`}
              </Button>
            </Box>
          </>
        ) : isGenerating ? (
          <Box className="empty-state" display="flex" flexDirection="column" alignItems="center" gap="md">
            <Text size="md">Generating groups...</Text>
            {progress && <Text size="xs">{progress}</Text>}
          </Box>
        ) : (
          <Box className="empty-state">
            <Text size="md">No groups generated yet</Text>
            <Text size="xs">
              Configure settings and click Generate with AI to find creative connections
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const meta: Meta<typeof GeneratedGroupsDisplay> = {
  title: 'Admin/GroupGenerator',
  component: GeneratedGroupsDisplay,
  parameters: {
    layout: 'padded',
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
type Story = StoryObj<typeof GeneratedGroupsDisplay>;

export const WithGeneratedGroups: Story = {
  args: {
    groups: mockGeneratedGroups,
    progress: 'Found 4 verified groups (2 guaranteed, 2 AI-thematic)',
  },
};

export const Empty: Story = {
  args: {
    groups: [],
  },
};

export const Generating: Story = {
  args: {
    groups: [],
    isGenerating: true,
    progress: 'Building era-balanced film pool (1920s-present)...',
  },
};

export const WithProgress: Story = {
  args: {
    groups: [],
    progress: 'Pool built: 200 films across 5 eras',
  },
};

export const WithError: Story = {
  args: {
    groups: [],
    error: 'API key not configured. Add VITE_ANTHROPIC_API_KEY to your .env.local file.',
  },
};

export const Saving: Story = {
  args: {
    groups: mockGeneratedGroups,
    isSaving: true,
  },
};

export const DeterministicOnly: Story = {
  args: {
    groups: mockGeneratedGroups.filter(g => g.source === 'deterministic'),
    progress: 'Found 2 guaranteed connections (100% verified)',
  },
};

export const AIThematicOnly: Story = {
  args: {
    groups: mockGeneratedGroups.filter(g => g.source === 'ai-thematic'),
    progress: 'Generated 2 verified AI-thematic groups',
  },
};
