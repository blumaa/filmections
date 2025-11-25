/**
 * Puzzle Engine
 *
 * Main orchestrator for puzzle generation.
 * Coordinates analyzers, validators, and selectors to create complete puzzles.
 *
 * Following SOLID principles:
 * - Single Responsibility: Orchestrates the puzzle generation process
 * - Dependency Inversion: Depends on abstractions (interfaces), not concrete implementations
 * - Open/Closed: New analyzers can be added without modifying this class
 */

import type { TMDBMovieDetails, Film, Group } from '../../types';
import type { GeneratorConfig, GeneratedPuzzle } from './types';
import { AnalyzerRegistry, analyzerRegistry } from './core/AnalyzerRegistry';
import { GroupSelector } from './core/GroupSelector';
import { QualityValidator } from './core/QualityValidator';
import { shuffleArray } from './utils/shuffle';

/**
 * Main puzzle generation engine.
 *
 * Coordinates the entire puzzle generation pipeline:
 * 1. Run all enabled analyzers in parallel
 * 2. Collect and filter results
 * 3. Select non-overlapping groups with balanced difficulty
 * 4. Shuffle and format for game consumption
 *
 * Usage:
 * ```typescript
 * const engine = new PuzzleEngine({
 *   poolSize: 150,
 *   groupsNeeded: 4,
 * });
 *
 * const puzzle = await engine.generatePuzzle(moviePool);
 * ```
 */
export class PuzzleEngine {
  private registry: AnalyzerRegistry;
  private selector: GroupSelector;
  private validator: QualityValidator;
  private config: GeneratorConfig;

  /**
   * Create a new puzzle engine with configuration.
   *
   * @param config - Optional configuration overrides
   */
  constructor(config: Partial<GeneratorConfig> = {}) {
    this.registry = analyzerRegistry;
    this.selector = new GroupSelector();
    this.validator = new QualityValidator();

    // Merge with defaults
    this.config = {
      poolSize: 150,
      groupsNeeded: 4,
      avoidRecentContent: true,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Generate a complete puzzle from a movie pool.
   *
   * @param moviePool - Array of movies to analyze
   * @param recentFilmIds - Optional set of recently used film IDs to avoid
   * @param recentConnections - Optional set of recently used connections to avoid
   * @returns Generated puzzle with groups and shuffled films
   * @throws Error if unable to generate enough groups
   */
  async generatePuzzle(
    moviePool: TMDBMovieDetails[],
    recentFilmIds?: Set<number>,
    recentConnections?: Set<string>
  ): Promise<GeneratedPuzzle> {
    // Filter recent content if enabled
    let pool = moviePool;
    if (this.config.avoidRecentContent && recentFilmIds) {
      pool = moviePool.filter((movie) => !recentFilmIds.has(movie.id));

      // Fallback to full pool if filtered pool is too small
      if (pool.length < 100) {
        console.warn(
          'Filtered pool too small, falling back to full pool'
        );
        pool = moviePool;
      }
    }

    // Run all enabled analyzers in parallel
    const analyzers = this.registry.getEnabled();

    if (analyzers.length === 0) {
      throw new Error('No analyzers are registered or enabled');
    }

    const allResults = await Promise.all(
      analyzers.map((analyzer) => analyzer.analyze(pool))
    );

    // Flatten results from all analyzers
    let potentialGroups = allResults.flat();

    // Filter out recently used connections
    if (recentConnections && recentConnections.size > 0) {
      potentialGroups = potentialGroups.filter(
        (group) => !recentConnections.has(group.connection)
      );
    }

    // Check if we have enough groups
    if (potentialGroups.length < this.config.groupsNeeded) {
      throw new Error(
        `Not enough potential groups found. Need ${this.config.groupsNeeded}, found ${potentialGroups.length}`
      );
    }

    // Select non-overlapping groups with balanced difficulty
    const selectedGroups = this.selector.selectGroups(
      potentialGroups,
      this.config.groupsNeeded
    );

    // Check if selection succeeded
    if (selectedGroups.length < this.config.groupsNeeded) {
      throw new Error(
        `Failed to select enough non-overlapping groups. Need ${this.config.groupsNeeded}, selected ${selectedGroups.length}`
      );
    }

    // Convert to game format
    const groups: Group[] = selectedGroups.map((group, index) => ({
      id: `${group.connectionType}-${index}`,
      films: group.films.map(this.tmdbToFilm),
      connection: group.connection,
      difficulty: group.difficulty,
      color: group.color,
    }));

    // Flatten and shuffle all films
    const allFilms = groups.flatMap((group) => group.films);
    const films = shuffleArray(allFilms);

    return { groups, films };
  }

  /**
   * Convert TMDB movie to game film format.
   *
   * @param movie - TMDB movie details
   * @returns Game film object
   * @private
   */
  private tmdbToFilm(movie: TMDBMovieDetails): Film {
    return {
      id: movie.id,
      title: movie.title,
      year: new Date(movie.release_date).getFullYear(),
      poster_path: movie.poster_path || undefined,
    };
  }

  /**
   * Get the analyzer registry (for external analyzer registration).
   *
   * @returns The analyzer registry instance
   */
  getRegistry(): AnalyzerRegistry {
    return this.registry;
  }

  /**
   * Get current configuration (read-only).
   *
   * @returns Copy of current configuration
   */
  getConfig(): GeneratorConfig {
    return { ...this.config };
  }

  /**
   * Update configuration.
   *
   * @param config - Partial configuration to merge
   */
  configure(config: Partial<GeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get quality validator (for threshold configuration).
   *
   * @returns The quality validator instance
   */
  getValidator(): QualityValidator {
    return this.validator;
  }
}
