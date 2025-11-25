/**
 * Base Analyzer Abstract Class
 *
 * Provides common functionality for all puzzle analyzers using the Template Method pattern.
 * Following SOLID principles:
 * - Single Responsibility: Base functionality for analyzers
 * - Open/Closed: Open for extension via inheritance, closed for modification
 * - Dependency Inversion: Depends on IAnalyzer abstraction
 *
 * @abstract
 */

import type { TMDBMovieDetails } from '../../../types';
import type {
  IAnalyzer,
  AnalyzerResult,
  AnalyzerConfig,
  ConnectionType,
} from '../types';

/**
 * Abstract base class for all analyzers.
 *
 * Provides:
 * - Default configuration
 * - Template method for analysis flow
 * - Common validation logic
 * - Shared utility methods
 *
 * Subclasses must implement:
 * - `name` property
 * - `connectionType` property
 * - `findConnections()` method
 */
export abstract class BaseAnalyzer implements IAnalyzer {
  /**
   * Unique name identifier for this analyzer.
   * Must be implemented by subclass.
   */
  abstract readonly name: string;

  /**
   * Type of connection this analyzer finds.
   * Must be implemented by subclass.
   */
  abstract readonly connectionType: ConnectionType;

  /**
   * Configuration for this analyzer with sensible defaults.
   */
  protected _config: AnalyzerConfig = {
    minGroupSize: 4,
    maxGroupSize: 4,
    enabled: true,
  };

  /**
   * Get current analyzer configuration (read-only).
   */
  get config(): AnalyzerConfig {
    return { ...this._config };
  }

  /**
   * Update analyzer configuration.
   *
   * @param config - Partial configuration to merge
   */
  public configure(config: Partial<AnalyzerConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /**
   * Analyze movies to find potential connections.
   *
   * Template Method pattern: orchestrates the analysis flow.
   * Subclasses implement findConnections() to customize behavior.
   *
   * @param movies - Array of movies to analyze
   * @returns Array of valid analyzer results
   */
  async analyze(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    // Skip if analyzer is disabled
    if (!this._config.enabled) {
      return [];
    }

    // Skip if pool is too small
    if (movies.length < this._config.minGroupSize) {
      return [];
    }

    // Call subclass implementation to find connections
    const results = await this.findConnections(movies);

    // Filter results through validation
    return results.filter((result) => this.validateResult(result));
  }

  /**
   * Find potential connections in the movie pool.
   *
   * Abstract method that subclasses must implement.
   * This is where analyzer-specific logic lives.
   *
   * @param movies - Array of movies to analyze
   * @returns Promise resolving to array of potential connections
   * @protected
   */
  protected abstract findConnections(
    movies: TMDBMovieDetails[]
  ): Promise<AnalyzerResult[]>;

  /**
   * Validate an analyzer result.
   *
   * Default validation checks:
   * - Group size is within configured bounds
   * - Connection text is not empty
   *
   * Subclasses can override for custom validation.
   *
   * @param result - Result to validate
   * @returns true if result is valid
   */
  validateResult(result: AnalyzerResult): boolean {
    const filmCount = result.films.length;

    // Check group size bounds
    if (filmCount < this._config.minGroupSize) {
      return false;
    }

    if (filmCount > this._config.maxGroupSize) {
      return false;
    }

    // Check connection text
    if (!result.connection || result.connection.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Calculate difficulty score based on movie vote counts.
   *
   * Lower vote counts = higher difficulty (more obscure films).
   * Uses inverse relationship: 10000 - avgVoteCount.
   *
   * @param movies - Array of movies to score
   * @returns Difficulty score (higher = more difficult)
   * @protected
   */
  protected calculateDifficultyScore(movies: TMDBMovieDetails[]): number {
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
   * Shuffle an array of films (Fisher-Yates algorithm).
   *
   * Creates a new array without mutating the original.
   *
   * @param films - Array to shuffle
   * @returns Shuffled copy of the array
   * @protected
   */
  protected shuffleFilms(films: TMDBMovieDetails[]): TMDBMovieDetails[] {
    const shuffled = [...films];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Filter movies by minimum vote count.
   *
   * @param movies - Movies to filter
   * @param minVotes - Minimum vote count threshold
   * @returns Filtered array of movies
   * @protected
   */
  protected filterByVoteCount(
    movies: TMDBMovieDetails[],
    minVotes: number = 500
  ): TMDBMovieDetails[] {
    return movies.filter((movie) => (movie.vote_count || 0) >= minVotes);
  }

  /**
   * Group movies by a key extractor function.
   *
   * Utility for finding common attributes across movies.
   *
   * @param movies - Movies to group
   * @param keyExtractor - Function to extract grouping key from movie
   * @returns Map of key to movies
   * @protected
   */
  protected groupBy<K>(
    movies: TMDBMovieDetails[],
    keyExtractor: (movie: TMDBMovieDetails) => K | K[]
  ): Map<K, TMDBMovieDetails[]> {
    const groups = new Map<K, TMDBMovieDetails[]>();

    for (const movie of movies) {
      const keys = keyExtractor(movie);
      const keysArray = Array.isArray(keys) ? keys : [keys];

      for (const key of keysArray) {
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(movie);
      }
    }

    return groups;
  }
}
