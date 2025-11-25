/**
 * Difficulty Scoring Utilities
 *
 * Functions for calculating puzzle difficulty based on movie popularity metrics.
 */

import type { TMDBMovieDetails } from '../../../types';

/**
 * Calculate difficulty score based on movie vote counts.
 *
 * Uses inverse relationship: lower vote counts indicate more obscure films,
 * which makes the puzzle more difficult.
 *
 * Formula: 10000 - avgVoteCount
 *
 * Examples:
 * - Very popular films (10000 votes): Score = 0 (easiest)
 * - Moderately popular (5000 votes): Score = 5000
 * - Obscure films (500 votes): Score = 9500 (hardest)
 *
 * @param movies - Array of movies to score
 * @returns Difficulty score (higher = more difficult)
 */
export function calculateDifficultyScore(movies: TMDBMovieDetails[]): number {
  if (movies.length === 0) {
    return 0;
  }

  const totalVotes = movies.reduce((sum, movie) => {
    return sum + (movie.vote_count || 0);
  }, 0);

  const avgVoteCount = totalVotes / movies.length;

  // Invert: lower votes = higher difficulty
  return 10000 - avgVoteCount;
}

/**
 * Scale a predefined difficulty value to match vote-based scoring.
 *
 * Used when analyzer has a predetermined difficulty (1-4) that needs
 * to be normalized to the same scale as vote-based scoring.
 *
 * Scaling:
 * - 1 (easiest): 2000
 * - 2: 4000
 * - 3: 6000
 * - 4 (hardest): 8000
 *
 * @param difficulty - Predefined difficulty (1-4)
 * @returns Scaled difficulty score
 */
export function scalePredefinedDifficulty(difficulty: number): number {
  return difficulty * 2000;
}

/**
 * Normalize difficulty score to 0-100 scale.
 *
 * Useful for displaying difficulty as a percentage or comparing
 * with other normalized metrics.
 *
 * Assumes difficulty scores range from 0 (easiest) to 10000 (hardest).
 *
 * @param score - Raw difficulty score
 * @returns Normalized score (0-100)
 */
export function normalizeDifficultyScore(score: number): number {
  const clamped = Math.max(0, Math.min(10000, score));
  return (clamped / 10000) * 100;
}
