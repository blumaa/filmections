/**
 * YearAnalyzer
 *
 * Finds movie connections based on specific release years.
 * Focuses on interesting/significant years in cinema history.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes year-based connections
 * - Open/Closed: Extends BaseAnalyzer, adding year-specific logic
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 * - Interface Segregation: Implements focused IAnalyzer interface
 * - Dependency Inversion: Depends on TMDBMovieDetails abstraction
 *
 * Following KISS: Simple year extraction from release date
 * Following DRY: Reuses BaseAnalyzer utilities
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';

/**
 * Configuration specific to YearAnalyzer
 */
export interface YearAnalyzerConfig {
  /** Specific years to consider */
  interestingYears: number[];
}

/**
 * Combined configuration type for YearAnalyzer
 */
export type YearAnalyzerFullConfig = Partial<
  import('../types').AnalyzerConfig & YearAnalyzerConfig
>;

/**
 * Default interesting years with significant cinema releases
 * Selected based on cultural impact and memorable films
 */
const DEFAULT_INTERESTING_YEARS = [
  1939, // Gone with the Wind, Wizard of Oz
  1972, // The Godfather
  1977, // Star Wars
  1982, // E.T., Blade Runner, The Thing
  1984, // The Terminator, Ghostbusters
  1994, // Pulp Fiction, Shawshank Redemption, Forrest Gump
  1995, // Se7en, Toy Story, Heat
  1999, // The Matrix, Fight Club, The Sixth Sense
  2001, // Lord of the Rings, Shrek
  2007, // No Country for Old Men, There Will Be Blood
  2008, // The Dark Knight, WALL-E
  2010, // Inception, The Social Network
  2014, // Interstellar, Whiplash, Birdman
  2017, // Get Out, Blade Runner 2049
  2019, // Parasite, Joker, 1917
];

/**
 * YearAnalyzer Implementation
 *
 * Analyzes movies to find groups from the same specific year.
 * Uses release_date to determine year.
 *
 * Algorithm:
 * 1. Extract year from each movie's release date
 * 2. Group movies by year (only interesting years)
 * 3. Filter years with sufficient films (minGroupSize)
 * 4. Select and shuffle films for valid years
 * 5. Calculate difficulty based on year age and popularity
 * 6. Return valid connections
 *
 * Examples:
 * - "The Matrix" (1999), "Fight Club" (1999), "The Sixth Sense" (1999) → "Films from 1999"
 * - "Pulp Fiction" (1994), "Shawshank Redemption" (1994), "Forrest Gump" (1994) → "Films from 1994"
 *
 * @example
 * ```typescript
 * const analyzer = new YearAnalyzer();
 * analyzer.configure({ interestingYears: [1999, 2001] }); // Only specific years
 * const results = await analyzer.analyze(movies);
 * ```
 */
export class YearAnalyzer extends BaseAnalyzer {
  readonly name = 'year';
  readonly connectionType: ConnectionType = 'year';

  private yearConfig: YearAnalyzerConfig = {
    interestingYears: DEFAULT_INTERESTING_YEARS,
  };

  /**
   * Configure year-specific and base analyzer options
   */
  configure(config: YearAnalyzerFullConfig): void {
    // Handle base config properties (enabled, minGroupSize, maxGroupSize)
    super.configure(config);

    // Handle year-specific config properties
    const { interestingYears } = config;
    if (interestingYears !== undefined) {
      this.yearConfig = {
        ...this.yearConfig,
        interestingYears,
      };
    }
  }

  /**
   * Find year-based connections in the movie pool
   *
   * @param movies - Array of movies to analyze
   * @returns Array of potential year-based groups
   */
  protected async findConnections(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    // Build year-to-movies map
    const yearMap = this.buildYearMap(movies);

    const results: AnalyzerResult[] = [];

    // Process each year
    for (const [year, moviesInYear] of yearMap) {
      // Skip if not enough movies from this year
      if (moviesInYear.length < this._config.minGroupSize) {
        continue;
      }

      // Skip if year not in interesting years list
      if (!this.yearConfig.interestingYears.includes(year)) {
        continue;
      }

      // Shuffle and select films
      const shuffledFilms = this.shuffleFilms(moviesInYear);
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score
      // More recent years are typically easier (more familiar)
      // Older years are harder
      const baseDifficulty = this.calculateDifficultyScore(selectedFilms);
      const yearDiff = new Date().getFullYear() - year;
      const ageBonus = yearDiff * 50; // +50 per year of age
      const difficultyScore = baseDifficulty + ageBonus;

      results.push({
        films: selectedFilms,
        connection: `Films from ${year}`,
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          year,
          totalMatchingFilms: moviesInYear.length,
        },
      });
    }

    return results;
  }

  /**
   * Build a map of years to movies
   *
   * @param movies - Movies to process
   * @returns Map of year -> movies
   */
  private buildYearMap(movies: TMDBMovieDetails[]): Map<number, TMDBMovieDetails[]> {
    const yearMap = new Map<number, TMDBMovieDetails[]>();

    for (const movie of movies) {
      const year = this.getYear(movie);
      if (year === null) continue;

      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year)!.push(movie);
    }

    return yearMap;
  }

  /**
   * Extract year from movie release date
   *
   * @param movie - Movie to extract year from
   * @returns Year or null if invalid
   */
  private getYear(movie: TMDBMovieDetails): number | null {
    if (!movie.release_date) return null;

    const year = parseInt(movie.release_date.substring(0, 4), 10);
    if (isNaN(year)) return null;

    return year;
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
