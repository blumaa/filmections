/**
 * DecadeAnalyzer
 *
 * Finds movie connections based on release decade.
 * Groups movies from the same decade (1970s, 1980s, 1990s, 2000s, 2010s, 2020s).
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes decade-based connections
 * - Open/Closed: Extends BaseAnalyzer, adding decade-specific logic
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 * - Interface Segregation: Implements focused IAnalyzer interface
 * - Dependency Inversion: Depends on TMDBMovieDetails abstraction
 *
 * Following KISS: Simple decade extraction from release date
 * Following DRY: Reuses BaseAnalyzer utilities
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';

/**
 * Configuration specific to DecadeAnalyzer
 */
export interface DecadeAnalyzerConfig {
  /** Decades to consider (default: all from 1970s to 2020s) */
  enabledDecades: number[];
}

/**
 * Combined configuration type for DecadeAnalyzer
 */
export type DecadeAnalyzerFullConfig = Partial<
  import('../types').AnalyzerConfig & DecadeAnalyzerConfig
>;

/**
 * Default decades to analyze
 */
const DEFAULT_DECADES = [1970, 1980, 1990, 2000, 2010, 2020];

/**
 * DecadeAnalyzer Implementation
 *
 * Analyzes movies to find groups from the same decade.
 * Uses release_date to determine decade.
 *
 * Algorithm:
 * 1. Extract decade from each movie's release date
 * 2. Group movies by decade
 * 3. Filter decades with sufficient films (minGroupSize)
 * 4. Select and shuffle films for valid decades
 * 5. Calculate difficulty based on decade popularity
 * 6. Return valid connections
 *
 * Examples:
 * - "The Godfather" (1972), "Star Wars" (1977), "Alien" (1979) → "Films from the 1970s"
 * - "E.T." (1982), "The Terminator" (1984), "Die Hard" (1988) → "Films from the 1980s"
 *
 * @example
 * ```typescript
 * const analyzer = new DecadeAnalyzer();
 * analyzer.configure({ enabledDecades: [1980, 1990] }); // Only 80s and 90s
 * const results = await analyzer.analyze(movies);
 * ```
 */
export class DecadeAnalyzer extends BaseAnalyzer {
  readonly name = 'decade';
  readonly connectionType: ConnectionType = 'decade';

  private decadeConfig: DecadeAnalyzerConfig = {
    enabledDecades: DEFAULT_DECADES,
  };

  /**
   * Configure decade-specific and base analyzer options
   */
  configure(config: DecadeAnalyzerFullConfig): void {
    // Handle base config properties (enabled, minGroupSize, maxGroupSize)
    super.configure(config);

    // Handle decade-specific config properties
    const { enabledDecades } = config;
    if (enabledDecades !== undefined) {
      this.decadeConfig = {
        ...this.decadeConfig,
        enabledDecades,
      };
    }
  }

  /**
   * Find decade-based connections in the movie pool
   *
   * @param movies - Array of movies to analyze
   * @returns Array of potential decade-based groups
   */
  protected async findConnections(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    // Build decade-to-movies map
    const decadeMap = this.buildDecadeMap(movies);

    const results: AnalyzerResult[] = [];

    // Process each decade
    for (const [decade, moviesInDecade] of decadeMap) {
      // Skip if not enough movies from this decade
      if (moviesInDecade.length < this._config.minGroupSize) {
        continue;
      }

      // Skip if decade not enabled
      if (!this.decadeConfig.enabledDecades.includes(decade)) {
        continue;
      }

      // Shuffle and select films
      const shuffledFilms = this.shuffleFilms(moviesInDecade);
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score
      // More recent decades are typically easier (more familiar)
      // Older decades are harder
      const baseDifficulty = this.calculateDifficultyScore(selectedFilms);
      const yearDiff = new Date().getFullYear() - decade;
      const ageBonus = Math.floor(yearDiff / 10) * 200; // +200 per decade of age
      const difficultyScore = baseDifficulty + ageBonus;

      results.push({
        films: selectedFilms,
        connection: this.formatDecadeConnection(decade),
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          decade,
          totalMatchingFilms: moviesInDecade.length,
          decadeLabel: this.getDecadeLabel(decade),
        },
      });
    }

    return results;
  }

  /**
   * Build a map of decades to movies
   *
   * @param movies - Movies to process
   * @returns Map of decade -> movies
   */
  private buildDecadeMap(movies: TMDBMovieDetails[]): Map<number, TMDBMovieDetails[]> {
    const decadeMap = new Map<number, TMDBMovieDetails[]>();

    for (const movie of movies) {
      const decade = this.getDecade(movie);
      if (decade === null) continue;

      if (!decadeMap.has(decade)) {
        decadeMap.set(decade, []);
      }
      decadeMap.get(decade)!.push(movie);
    }

    return decadeMap;
  }

  /**
   * Extract decade from movie release date
   *
   * @param movie - Movie to extract decade from
   * @returns Decade (e.g., 1980, 1990, 2000) or null if invalid
   */
  private getDecade(movie: TMDBMovieDetails): number | null {
    if (!movie.release_date) return null;

    const year = parseInt(movie.release_date.substring(0, 4), 10);
    if (isNaN(year)) return null;

    // Round down to nearest decade
    return Math.floor(year / 10) * 10;
  }

  /**
   * Format decade as connection text
   *
   * @param decade - Decade start year (e.g., 1980)
   * @returns Formatted connection text
   */
  private formatDecadeConnection(decade: number): string {
    const label = this.getDecadeLabel(decade);
    return `Films from the ${label}`;
  }

  /**
   * Get human-readable decade label
   *
   * @param decade - Decade start year (e.g., 1980)
   * @returns Decade label (e.g., "1980s")
   */
  private getDecadeLabel(decade: number): string {
    return `${decade}s`;
  }

  /**
   * Shuffle films array using Fisher-Yates algorithm
   *
   * @param films - Films to shuffle
   * @returns Shuffled copy of films array
   */
  protected shuffleFilms(films: TMDBMovieDetails[]): TMDBMovieDetails[] {
    const shuffled = [...films];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
