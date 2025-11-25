/**
 * Puzzle Generator Service
 *
 * Main entry point for puzzle generation using the modular PuzzleEngine.
 * Refactored from monolithic implementation to use SOLID-compliant architecture.
 */

import type { Film, Group } from '../types';
import { tmdbService } from './tmdb';
import { recentContentService } from './recentContent';
import {
  PuzzleEngine,
  DirectorAnalyzer,
  ActorAnalyzer,
  ThemeAnalyzer,
  WordplayAnalyzer,
  DecadeAnalyzer,
  YearAnalyzer,
  analyzerRegistry,
} from '../lib/puzzle-engine';
import { shuffleArray } from '../lib/puzzle-engine/utils/shuffle';

// Register all available analyzers on module load
analyzerRegistry.register(new DirectorAnalyzer());
analyzerRegistry.register(new ActorAnalyzer());
analyzerRegistry.register(new ThemeAnalyzer());
analyzerRegistry.register(new WordplayAnalyzer());
analyzerRegistry.register(new DecadeAnalyzer());
analyzerRegistry.register(new YearAnalyzer());

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
 * Generate a production puzzle using the PuzzleEngine.
 *
 * Workflow:
 * 1. Fetch random movie pool from TMDB
 * 2. Filter out recently used content
 * 3. Run all registered analyzers via PuzzleEngine
 * 4. Select non-overlapping groups with balanced difficulty
 * 5. Shuffle and format for game
 *
 * @returns Promise resolving to generated puzzle
 */
export async function generatePuzzle(): Promise<{
  groups: Group[];
  films: Film[];
}> {
  try {
    // Get recently used content to avoid repetition
    const recentFilmIds = recentContentService.getRecentFilmIds();
    const recentConnections = recentContentService.getRecentConnections();

    // Fetch random pool of movies from different eras (150 total for better variety)
    const moviePool = await tmdbService.getRandomMoviePool(150);

    // Create engine with configuration
    const engine = new PuzzleEngine({
      poolSize: 150,
      groupsNeeded: 4,
      avoidRecentContent: true,
      maxRetries: 3,
    });

    // Generate puzzle
    const puzzle = await engine.generatePuzzle(
      moviePool,
      recentFilmIds,
      recentConnections
    );

    return puzzle;
  } catch (error) {
    console.error('Error generating puzzle:', error);

    // Retry without recent content filtering if we failed
    console.warn('Retrying puzzle generation without recent content filter...');

    try {
      const moviePool = await tmdbService.getRandomMoviePool(150);
      const engine = new PuzzleEngine({
        poolSize: 150,
        groupsNeeded: 4,
        avoidRecentContent: false,
        maxRetries: 3,
      });

      return await engine.generatePuzzle(moviePool);
    } catch (retryError) {
      console.error('Retry also failed:', retryError);
      throw new Error('Failed to generate puzzle after retry');
    }
  }
}

/**
 * Re-export shuffle utility for backward compatibility.
 */
export { shuffleArray };
