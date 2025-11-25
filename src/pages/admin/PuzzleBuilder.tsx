/**
 * PuzzleBuilder Admin Page
 *
 * Allows building puzzles by selecting 4 groups (one per color)
 * from the approved group pool.
 */

import { useState, useMemo } from 'react';
import { Box, Heading, Text, Button } from '@mond-design-system/theme';
import { SupabaseGroupStorage } from '../../lib/supabase/storage/SupabaseGroupStorage';
import { SupabaseStorage } from '../../lib/supabase/storage/SupabaseStorage';
import {
  useGroupList,
  useIncrementGroupUsage,
} from '../../lib/supabase/storage/useGroupStorage';
import { useSavePuzzle } from '../../lib/supabase/storage/usePuzzleStorage';
import type { StoredGroup, DifficultyColor, PuzzleInput } from '../../lib/supabase/storage';
import { supabase } from '../../lib/supabase/client';
import { useToast } from '../../providers/useToast';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../constants/difficulty';
import './PuzzleBuilder.css';

// Create storage instances
const groupStorage = new SupabaseGroupStorage(supabase);
const puzzleStorage = new SupabaseStorage(supabase);

// Color order for puzzle building
const colors: DifficultyColor[] = ['yellow', 'green', 'blue', 'purple'];

export function PuzzleBuilder() {
  const toast = useToast();

  // Selected groups state (one per color)
  const [selectedGroups, setSelectedGroups] = useState<Record<DifficultyColor, StoredGroup | null>>({
    yellow: null,
    green: null,
    blue: null,
    purple: null,
  });

  // Puzzle title
  const [title, setTitle] = useState('');

  // Active color being selected
  const [activeColor, setActiveColor] = useState<DifficultyColor | null>(null);

  // Query approved groups for each color
  const yellowQuery = useGroupList({ status: 'approved', color: 'yellow', limit: 100 }, groupStorage);
  const greenQuery = useGroupList({ status: 'approved', color: 'green', limit: 100 }, groupStorage);
  const blueQuery = useGroupList({ status: 'approved', color: 'blue', limit: 100 }, groupStorage);
  const purpleQuery = useGroupList({ status: 'approved', color: 'purple', limit: 100 }, groupStorage);

  const groupsByColor = useMemo(() => ({
    yellow: yellowQuery.data?.groups || [],
    green: greenQuery.data?.groups || [],
    blue: blueQuery.data?.groups || [],
    purple: purpleQuery.data?.groups || [],
  }), [yellowQuery.data, greenQuery.data, blueQuery.data, purpleQuery.data]);

  // Mutations
  const savePuzzleMutation = useSavePuzzle(puzzleStorage);
  const incrementUsageMutation = useIncrementGroupUsage(groupStorage);

  // Check if all groups are selected
  const allSelected = colors.every((color) => selectedGroups[color] !== null);

  // Calculate quality score (normalized to 0-100 scale)
  // Raw difficulty scores range from ~0-10000, normalize to 0-100
  const qualityScore = useMemo(() => {
    const selected = Object.values(selectedGroups).filter((g): g is StoredGroup => g !== null);
    if (selected.length === 0) return 0;
    const avgScore = selected.reduce((sum, g) => sum + g.difficultyScore, 0) / selected.length;
    // Normalize: 0-10000 -> 0-100, capped at 100
    return Math.min(100, Math.round(avgScore / 100));
  }, [selectedGroups]);

  const handleSelectGroup = (color: DifficultyColor, group: StoredGroup) => {
    setSelectedGroups((prev) => ({ ...prev, [color]: group }));
    setActiveColor(null);
  };

  const handleRemoveGroup = (color: DifficultyColor) => {
    setSelectedGroups((prev) => ({ ...prev, [color]: null }));
  };

  const handleSavePuzzle = async () => {
    if (!allSelected) return;

    const groupIds = colors.map((color) => selectedGroups[color]!.id);

    const puzzleInput: PuzzleInput = {
      groupIds,
      title: title.trim() || undefined,
      qualityScore,
    };

    try {
      await savePuzzleMutation.mutateAsync(puzzleInput);

      // Increment usage count for selected groups
      await incrementUsageMutation.mutateAsync(groupIds);

      // Reset form
      setSelectedGroups({
        yellow: null,
        green: null,
        blue: null,
        purple: null,
      });
      setTitle('');

      toast.showSuccess('Puzzle saved successfully!');
    } catch (error) {
      console.error('Failed to save puzzle:', error);
      toast.showError('Failed to save puzzle', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap="lg" padding="4">
      <Box display="flex" flexDirection="column" gap="sm">
        <Heading level={1} size="2xl">
          Puzzle Builder
        </Heading>
        <Text variant="body">
          Select one group from each difficulty level to create a puzzle
        </Text>
      </Box>

      {/* Puzzle Title */}
      <Box display="flex" flexDirection="column" gap="xs" className="title-section">
        <Text variant="body" weight="medium">
          Puzzle Title (optional)
        </Text>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for this puzzle..."
          className="title-input"
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
                  <Text variant="body" weight="medium">
                    {DIFFICULTY_LABELS[color]}
                  </Text>
                </Box>
                <Text variant="caption">
                  {groupsByColor[color].length} available
                </Text>
              </Box>
            </div>

            {/* Selected Group or Selector */}
            <Box className="slot-content" padding="3">
              {selectedGroups[color] ? (
                <Box display="flex" flexDirection="column" gap="sm">
                  <Text variant="body" weight="medium">
                    {selectedGroups[color]!.connection}
                  </Text>
                  <Box display="flex" gap="xs" className="films-preview">
                    {selectedGroups[color]!.films.map((film) => (
                      <Text key={film.id} variant="caption">
                        {film.title}
                      </Text>
                    ))}
                  </Box>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveGroup(color)}
                  >
                    Remove
                  </Button>
                </Box>
              ) : activeColor === color ? (
                <Box display="flex" flexDirection="column" gap="sm" className="group-list">
                  {groupsByColor[color].length === 0 ? (
                    <Text variant="caption">No approved groups available</Text>
                  ) : (
                    <>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Text variant="caption">Select a group:</Text>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveColor(null)}
                        >
                          Cancel
                        </Button>
                      </Box>
                      <Box className="group-options">
                        {groupsByColor[color].map((group) => (
                          <Box
                            key={group.id}
                            className="group-option"
                            onClick={() => handleSelectGroup(color, group)}
                          >
                            <Text variant="body" weight="medium">
                              {group.connection}
                            </Text>
                            <Text variant="caption">
                              {group.films.map((f) => f.title).join(', ')}
                            </Text>
                            <span className="usage-badge">
                              <Text variant="caption">
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
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveColor(color)}
                >
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
              <Text variant="body">
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
                    <Text variant="body" weight="medium">
                      {selectedGroups[color]!.connection}
                    </Text>
                    <Text variant="caption">
                      {selectedGroups[color]!.films.map((f) => f.title).join(' | ')}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" padding="4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSavePuzzle}
                disabled={savePuzzleMutation.isPending}
              >
                {savePuzzleMutation.isPending ? 'Saving...' : 'Save to Queue'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
