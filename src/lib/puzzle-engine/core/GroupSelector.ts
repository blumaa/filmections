/**
 * Group Selector
 *
 * Selects non-overlapping groups with balanced difficulty distribution.
 * Uses quartile-based difficulty assignment to ensure varied challenge levels.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles group selection logic
 * - Open/Closed: Algorithm can be extended without modification
 */

import type {
  AnalyzerResult,
  SelectedGroup,
} from '../types';
import type { DifficultyColor, DifficultyLevel } from '../../../types';

/**
 * Selects non-overlapping puzzle groups with balanced difficulty.
 *
 * Selection algorithm:
 * 1. Sort all potential groups by difficulty score
 * 2. Assign difficulty colors based on quartiles (4 difficulty levels)
 * 3. Group candidates by color
 * 4. Select one non-overlapping group per color
 *
 * This ensures:
 * - Exactly one group per difficulty level
 * - No films appear in multiple groups
 * - Balanced puzzle difficulty progression
 */
export class GroupSelector {
  /**
   * Select non-overlapping groups with balanced difficulty.
   *
   * @param results - Array of potential groups from analyzers
   * @param count - Number of groups to select (default: 4)
   * @returns Array of selected groups with difficulty assignments
   */
  selectGroups(
    results: AnalyzerResult[],
    count: number = 4
  ): SelectedGroup[] {
    // Return empty if insufficient groups
    if (results.length < count) {
      return [];
    }

    // Sort by difficulty score (ascending)
    const sorted = [...results].sort(
      (a, b) => a.difficultyScore - b.difficultyScore
    );

    // Assign difficulty colors and levels based on quartiles
    const withDifficulties = this.assignDifficulties(sorted);

    // Group by color for easier selection
    const byColor = this.groupByColor(withDifficulties);

    // Select one non-overlapping group per color
    return this.selectNonOverlapping(byColor, count);
  }

  /**
   * Assign difficulty colors and levels based on quartile position.
   *
   * Divides sorted groups into 4 quartiles:
   * - Q1 (easiest): Yellow / Easy
   * - Q2: Green / Medium
   * - Q3: Blue / Hard
   * - Q4 (hardest): Purple / Hardest
   *
   * @param results - Sorted array of results (by difficulty)
   * @returns Results with difficulty assignments
   * @private
   */
  private assignDifficulties(
    results: AnalyzerResult[]
  ): SelectedGroup[] {
    return results.map((result, index) => {
      // Calculate quartile (0-3)
      const quartile = Math.floor((index / results.length) * 4);

      // Assign color and difficulty based on quartile
      let color: DifficultyColor;
      let difficulty: DifficultyLevel;

      switch (quartile) {
        case 0:
          color = 'yellow';
          difficulty = 'easy';
          break;
        case 1:
          color = 'green';
          difficulty = 'medium';
          break;
        case 2:
          color = 'blue';
          difficulty = 'hard';
          break;
        default:
          color = 'purple';
          difficulty = 'hardest';
          break;
      }

      return {
        ...result,
        color,
        difficulty,
      };
    });
  }

  /**
   * Group results by difficulty color.
   *
   * Shuffles groups within each color to add randomness.
   *
   * @param groups - Groups with difficulty assignments
   * @returns Map of color to groups
   * @private
   */
  private groupByColor(
    groups: SelectedGroup[]
  ): Map<DifficultyColor, SelectedGroup[]> {
    const map = new Map<DifficultyColor, SelectedGroup[]>();

    // Group by color
    for (const group of groups) {
      if (!map.has(group.color)) {
        map.set(group.color, []);
      }
      map.get(group.color)!.push(group);
    }

    // Shuffle within each color to add randomness
    for (const [color, colorGroups] of map) {
      map.set(color, this.shuffleArray(colorGroups));
    }

    return map;
  }

  /**
   * Select non-overlapping groups, one per color.
   *
   * Algorithm:
   * 1. Iterate through colors in order (yellow → green → blue → purple)
   * 2. For each color, find first group with no film overlaps
   * 3. Mark films as used to prevent future overlaps
   *
   * @param byColor - Map of color to candidate groups
   * @param count - Number of groups to select
   * @returns Array of non-overlapping groups
   * @private
   */
  private selectNonOverlapping(
    byColor: Map<DifficultyColor, SelectedGroup[]>,
    count: number
  ): SelectedGroup[] {
    const selected: SelectedGroup[] = [];
    const usedMovieIds = new Set<number>();
    const colors: DifficultyColor[] = ['yellow', 'green', 'blue', 'purple'];

    for (const color of colors) {
      // Stop if we have enough groups
      if (selected.length >= count) {
        break;
      }

      const groupsOfColor = byColor.get(color) || [];

      // Find first non-overlapping group of this color
      for (const group of groupsOfColor) {
        const hasOverlap = group.films.some((film) =>
          usedMovieIds.has(film.id)
        );

        if (!hasOverlap) {
          // Select this group
          selected.push(group);

          // Mark films as used
          group.films.forEach((film) => usedMovieIds.add(film.id));

          // Move to next color
          break;
        }
      }
    }

    return selected;
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm.
   *
   * Creates a new array without mutating the original.
   *
   * @param array - Array to shuffle
   * @returns Shuffled copy of the array
   * @private
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}
