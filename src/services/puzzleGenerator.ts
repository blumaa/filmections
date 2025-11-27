/**
 * Puzzle Generator Service
 *
 * Provides test puzzle generation and utility functions.
 */

import type { Film, Group } from '../types';
import { shuffleArray } from '../lib/puzzle-engine/utils/shuffle';

/**
 * Generate a test puzzle with hardcoded data.
 *
 * Used for testing without API calls or when in test mode.
 *
 * @returns Promise resolving to test puzzle
 */
export async function generateTestPuzzle(): Promise<{
  groups: Group[];
  films: Film[];
}> {
  // Simple test puzzle with one group of each color
  const groups: Group[] = [
    {
      id: 'test-yellow',
      films: [
        { id: 1, title: 'Yellow Film 1', year: 2020 },
        { id: 2, title: 'Yellow Film 2', year: 2021 },
        { id: 3, title: 'Yellow Film 3', year: 2022 },
        { id: 4, title: 'Yellow Film 4', year: 2023 },
      ],
      connection: 'Yellow Group (Easy)',
      difficulty: 'easy',
      color: 'yellow',
    },
    {
      id: 'test-green',
      films: [
        { id: 5, title: 'Green Film 1', year: 2020 },
        { id: 6, title: 'Green Film 2', year: 2021 },
        { id: 7, title: 'Green Film 3', year: 2022 },
        { id: 8, title: 'Green Film 4', year: 2023 },
      ],
      connection: 'Green Group (Medium)',
      difficulty: 'medium',
      color: 'green',
    },
    {
      id: 'test-blue',
      films: [
        { id: 9, title: 'Blue Film 1', year: 2020 },
        { id: 10, title: 'Blue Film 2', year: 2021 },
        { id: 11, title: 'Blue Film 3', year: 2022 },
        { id: 12, title: 'Blue Film 4', year: 2023 },
      ],
      connection: 'Blue Group (Hard)',
      difficulty: 'hard',
      color: 'blue',
    },
    {
      id: 'test-purple',
      films: [
        { id: 13, title: 'Purple Film 1', year: 2020 },
        { id: 14, title: 'Purple Film 2', year: 2021 },
        { id: 15, title: 'Purple Film 3', year: 2022 },
        { id: 16, title: 'Purple Film 4', year: 2023 },
      ],
      connection: 'Purple Group (Hardest)',
      difficulty: 'hardest',
      color: 'purple',
    },
  ];

  const films = groups.flatMap((group) => group.films);
  const shuffledFilms = shuffleArray(films);

  return {
    groups,
    films: shuffledFilms,
  };
}

/**
 * Re-export shuffle utility for backward compatibility.
 */
export { shuffleArray };
