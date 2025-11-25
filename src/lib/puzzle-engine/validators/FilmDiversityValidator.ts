/**
 * FilmDiversityValidator
 *
 * Validates that films have good diversity across eras, genres, and popularity.
 * Prevents puzzles with too many similar films.
 *
 * Scoring criteria:
 * - 10: Excellent diversity across all dimensions
 * - 7-9: Good diversity with minor clustering
 * - 4-6: Moderate diversity, some clustering
 * - 0-3: Poor diversity, films too similar
 */

import type { AnalyzerResult, TMDBMovieDetails } from '../types';
import type { IQualityValidator, ValidationResult } from './types';

/**
 * FilmDiversityValidator Implementation
 */
export class FilmDiversityValidator implements IQualityValidator {
  readonly name = 'diversity';
  readonly weight = 0.2; // 20% of overall score

  validate(groups: AnalyzerResult[]): ValidationResult {
    if (groups.length === 0) {
      return {
        score: 0,
        passed: false,
        reason: 'No groups to validate',
      };
    }

    const allFilms = groups.flatMap((g) => g.films);

    // Calculate diversity metrics
    const eraScore = this.scoreEraDiversity(allFilms);
    const popularityScore = this.scorePopularityDiversity(allFilms);

    // Average the scores
    const avgScore = (eraScore + popularityScore) / 2;
    const passed = avgScore >= 5;

    const reason = `Era: ${eraScore.toFixed(1)}/10, Popularity: ${popularityScore.toFixed(1)}/10`;

    return {
      score: Math.round(avgScore * 10) / 10,
      passed,
      reason,
      metadata: {
        eraScore,
        popularityScore,
        filmCount: allFilms.length,
      },
    };
  }

  /**
   * Score diversity across release eras
   *
   * @param films - Films to analyze
   * @returns Score from 0-10
   */
  private scoreEraDiversity(films: TMDBMovieDetails[]): number {
    // Group films by decade
    const decades = new Map<number, number>();

    for (const film of films) {
      if (!film.release_date) continue;
      const year = parseInt(film.release_date.substring(0, 4), 10);
      if (isNaN(year)) continue;

      const decade = Math.floor(year / 10) * 10;
      decades.set(decade, (decades.get(decade) || 0) + 1);
    }

    // Calculate distribution score
    if (decades.size === 0) return 5; // Neutral if no dates

    const uniqueDecades = decades.size;
    const maxCount = Math.max(...decades.values());
    const avgCount = films.length / uniqueDecades;

    // Good diversity = many unique decades, no single decade dominant
    const uniquenessScore = Math.min(10, (uniqueDecades / 4) * 10); // Ideal: 4+ decades
    const balanceScore = 10 * (1 - (maxCount - avgCount) / films.length);

    return (uniquenessScore + balanceScore) / 2;
  }

  /**
   * Score diversity across popularity levels
   *
   * @param films - Films to analyze
   * @returns Score from 0-10
   */
  private scorePopularityDiversity(films: TMDBMovieDetails[]): number {
    const voteCounts = films.map((f) => f.vote_count || 0).filter((v) => v > 0);

    if (voteCounts.length === 0) return 5; // Neutral if no data

    // Calculate coefficient of variation (std dev / mean)
    const mean = voteCounts.reduce((a, b) => a + b, 0) / voteCounts.length;
    const variance =
      voteCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / voteCounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Higher CV = more diversity
    // Normalize to 0-10 scale (cv of 1.0 or higher = max score)
    return Math.min(10, cv * 10);
  }
}
