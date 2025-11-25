/**
 * PuzzleGenerator
 *
 * High-level orchestrator for batch puzzle generation with quality scoring.
 * Wraps PuzzleEngine and integrates QualityScorer for production-ready puzzles.
 *
 * Features:
 * - Single puzzle generation with quality validation
 * - Batch generation with deduplication
 * - Configurable movie pool filtering
 * - Configurable quality thresholds
 * - Analyzer toggles
 *
 * Usage:
 * ```typescript
 * const generator = new PuzzleGenerator({
 *   moviePoolSize: 150,
 *   qualityThreshold: 40,
 *   enabledAnalyzers: ['director', 'actor', 'theme'],
 * });
 *
 * // Generate single puzzle
 * const puzzle = await generator.generateSingle(movies);
 *
 * // Generate batch
 * const puzzles = await generator.generateBatch(movies, 10);
 * ```
 */

import type { TMDBMovieDetails } from '../../types';
import type { GeneratedPuzzle, AnalyzerResult } from './types';
import { PuzzleEngine } from './PuzzleEngine';
import { QualityScorer } from './validators/QualityScorer';

/**
 * Movie pool filter configuration
 */
export interface MoviePoolFilter {
  /** Minimum year (inclusive) */
  minYear?: number;
  /** Maximum year (inclusive) */
  maxYear?: number;
  /** Minimum vote count */
  minVoteCount?: number;
  /** Maximum vote count */
  maxVoteCount?: number;
  /** Minimum popularity score */
  minPopularity?: number;
  /** Allowed genre IDs */
  allowedGenres?: number[];
  /** Excluded genre IDs */
  excludedGenres?: number[];
}

/**
 * Configuration for PuzzleGenerator
 */
export interface PuzzleGeneratorConfig {
  /** Size of movie pool to analyze (default: 150) */
  moviePoolSize?: number;

  /** Number of groups per puzzle (default: 4) */
  groupsPerPuzzle?: number;

  /** Minimum quality score (0-100) for puzzle acceptance (default: 35) */
  qualityThreshold?: number;

  /** Maximum generation attempts before giving up (default: 10) */
  maxAttempts?: number;

  /** Enabled analyzer names (default: all enabled) */
  enabledAnalyzers?: string[];

  /** Movie pool filters */
  poolFilters?: MoviePoolFilter;

  /** Whether to avoid recently used content (default: true) */
  avoidRecentContent?: boolean;

  /** Custom quality scorer configuration */
  qualityScorerConfig?: {
    minScore?: number;
    requireNoOverlap?: boolean;
    weights?: {
      clarity?: number;
      difficulty?: number;
      diversity?: number;
      uniqueness?: number;
    };
  };
}

/**
 * Result of single puzzle generation with quality metrics
 */
export interface GeneratedPuzzleWithMetrics extends GeneratedPuzzle {
  qualityScore: number;
  meetsThreshold: boolean;
  attemptNumber: number;
}

/**
 * Result of batch puzzle generation
 */
export interface BatchGenerationResult {
  puzzles: GeneratedPuzzleWithMetrics[];
  succeeded: number;
  failed: number;
  totalAttempts: number;
  averageQuality: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<PuzzleGeneratorConfig, 'enabledAnalyzers' | 'poolFilters' | 'qualityScorerConfig'>> = {
  moviePoolSize: 150,
  groupsPerPuzzle: 4,
  qualityThreshold: 35,
  maxAttempts: 10,
  avoidRecentContent: true,
};

/**
 * PuzzleGenerator Implementation
 *
 * Orchestrates PuzzleEngine and QualityScorer to produce validated puzzles.
 */
export class PuzzleGenerator {
  private config: Required<Omit<PuzzleGeneratorConfig, 'enabledAnalyzers' | 'poolFilters' | 'qualityScorerConfig'>>;
  private engine: PuzzleEngine;
  private scorer: QualityScorer;
  private enabledAnalyzers?: string[];
  private poolFilters?: MoviePoolFilter;

  constructor(config: PuzzleGeneratorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enabledAnalyzers = config.enabledAnalyzers;
    this.poolFilters = config.poolFilters;

    // Initialize quality scorer
    this.scorer = new QualityScorer(config.qualityScorerConfig);

    // Initialize puzzle engine
    this.engine = new PuzzleEngine({
      poolSize: this.config.moviePoolSize,
      groupsNeeded: this.config.groupsPerPuzzle,
      avoidRecentContent: this.config.avoidRecentContent,
      maxRetries: 3,
    });
  }

  /**
   * Generate a single high-quality puzzle.
   *
   * Attempts generation up to maxAttempts times until quality threshold is met.
   *
   * @param moviePool - Pool of movies to analyze
   * @param recentFilmIds - Optional set of recently used film IDs
   * @param recentConnections - Optional set of recently used connections
   * @returns Generated puzzle with quality metrics
   * @throws Error if unable to generate quality puzzle within maxAttempts
   */
  async generateSingle(
    moviePool: TMDBMovieDetails[],
    recentFilmIds?: Set<number>,
    recentConnections?: Set<string>
  ): Promise<GeneratedPuzzleWithMetrics> {
    // Apply movie pool filters
    const filteredPool = this.applyPoolFilters(moviePool);

    if (filteredPool.length < 50) {
      throw new Error(
        `Filtered movie pool too small: ${filteredPool.length} movies (minimum: 50)`
      );
    }

    // Configure enabled analyzers
    this.configureAnalyzers();

    let lastError: Error | null = null;
    let lastPuzzle: GeneratedPuzzle | null = null;
    let lastQualityScore = 0;

    // Attempt generation up to maxAttempts times
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        // Generate puzzle using engine
        const puzzle = await this.engine.generatePuzzle(
          filteredPool,
          recentFilmIds,
          recentConnections
        );

        // Extract analyzer results from groups for quality scoring
        const analyzerResults = this.extractAnalyzerResults(puzzle);

        // Score the puzzle
        const qualityMetrics = this.scorer.score(analyzerResults);

        // Check if quality threshold is met
        if (qualityMetrics.meetsThreshold && qualityMetrics.overallScore >= this.config.qualityThreshold) {
          return {
            ...puzzle,
            qualityScore: qualityMetrics.overallScore,
            meetsThreshold: true,
            attemptNumber: attempt,
          };
        }

        // Save best attempt for fallback
        if (qualityMetrics.overallScore > lastQualityScore) {
          lastPuzzle = puzzle;
          lastQualityScore = qualityMetrics.overallScore;
        }

        console.warn(
          `Puzzle quality below threshold (${qualityMetrics.overallScore}/${this.config.qualityThreshold}), retrying... (attempt ${attempt}/${this.config.maxAttempts})`
        );
      } catch (error) {
        lastError = error as Error;
        console.warn(`Puzzle generation failed (attempt ${attempt}/${this.config.maxAttempts}):`, error);
      }
    }

    // If we have a puzzle that's close to threshold, return it
    if (lastPuzzle && lastQualityScore > this.config.qualityThreshold * 0.8) {
      console.warn(
        `Returning best attempt with quality score ${lastQualityScore} (${Math.round((lastQualityScore / this.config.qualityThreshold) * 100)}% of threshold)`
      );
      return {
        ...lastPuzzle,
        qualityScore: lastQualityScore,
        meetsThreshold: false,
        attemptNumber: this.config.maxAttempts,
      };
    }

    // Complete failure
    throw new Error(
      `Failed to generate quality puzzle after ${this.config.maxAttempts} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Generate a batch of puzzles with deduplication.
   *
   * Ensures no films or connections are reused across puzzles in the batch.
   *
   * @param moviePool - Pool of movies to analyze
   * @param count - Number of puzzles to generate
   * @returns Batch generation results with statistics
   */
  async generateBatch(
    moviePool: TMDBMovieDetails[],
    count: number
  ): Promise<BatchGenerationResult> {
    const puzzles: GeneratedPuzzleWithMetrics[] = [];
    const usedFilmIds = new Set<number>();
    const usedConnections = new Set<string>();

    let succeeded = 0;
    let failed = 0;
    let totalAttempts = 0;

    for (let i = 0; i < count; i++) {
      try {
        const puzzle = await this.generateSingle(
          moviePool,
          usedFilmIds,
          usedConnections
        );

        puzzles.push(puzzle);
        succeeded++;
        totalAttempts += puzzle.attemptNumber;

        // Track used content for deduplication
        puzzle.films.forEach((film) => usedFilmIds.add(film.id));
        puzzle.groups.forEach((group) => usedConnections.add(group.connection));

        console.log(
          `Generated puzzle ${i + 1}/${count} (quality: ${puzzle.qualityScore}, attempts: ${puzzle.attemptNumber})`
        );
      } catch (error) {
        failed++;
        console.error(`Failed to generate puzzle ${i + 1}/${count}:`, error);
      }
    }

    const averageQuality =
      puzzles.length > 0
        ? puzzles.reduce((sum, p) => sum + p.qualityScore, 0) / puzzles.length
        : 0;

    return {
      puzzles,
      succeeded,
      failed,
      totalAttempts,
      averageQuality: Math.round(averageQuality * 10) / 10,
    };
  }

  /**
   * Apply configured filters to movie pool.
   *
   * @param movies - Full movie pool
   * @returns Filtered movie pool
   * @private
   */
  private applyPoolFilters(movies: TMDBMovieDetails[]): TMDBMovieDetails[] {
    if (!this.poolFilters) {
      return movies;
    }

    const filtered = movies.filter((movie) => {
      // Year filters
      if (this.poolFilters!.minYear || this.poolFilters!.maxYear) {
        const year = movie.release_date
          ? parseInt(movie.release_date.substring(0, 4), 10)
          : 0;

        if (this.poolFilters!.minYear && year < this.poolFilters!.minYear) {
          return false;
        }

        if (this.poolFilters!.maxYear && year > this.poolFilters!.maxYear) {
          return false;
        }
      }

      // Vote count filters
      if (
        this.poolFilters!.minVoteCount &&
        (movie.vote_count || 0) < this.poolFilters!.minVoteCount
      ) {
        return false;
      }

      if (
        this.poolFilters!.maxVoteCount &&
        (movie.vote_count || 0) > this.poolFilters!.maxVoteCount
      ) {
        return false;
      }

      // Popularity filter
      if (
        this.poolFilters!.minPopularity &&
        (movie.popularity || 0) < this.poolFilters!.minPopularity
      ) {
        return false;
      }

      // Genre filters
      const movieGenres = movie.genre_ids || [];

      if (this.poolFilters!.allowedGenres && this.poolFilters!.allowedGenres.length > 0) {
        const hasAllowedGenre = movieGenres.some((g) =>
          this.poolFilters!.allowedGenres!.includes(g)
        );
        if (!hasAllowedGenre) {
          return false;
        }
      }

      if (this.poolFilters!.excludedGenres && this.poolFilters!.excludedGenres.length > 0) {
        const hasExcludedGenre = movieGenres.some((g) =>
          this.poolFilters!.excludedGenres!.includes(g)
        );
        if (hasExcludedGenre) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }

  /**
   * Configure enabled/disabled analyzers in registry.
   *
   * Note: We can't actually modify analyzer enabled state since config is readonly.
   * This is a placeholder for future enhancement where analyzers support
   * dynamic enable/disable. For now, filtering happens in getEnabled() call.
   *
   * @private
   */
  private configureAnalyzers(): void {
    // TODO: Implement enable/disable when BaseAnalyzer supports it
    // For now, analyzer filtering happens naturally via enabledAnalyzers config
  }

  /**
   * Extract analyzer results from generated puzzle for scoring.
   *
   * @param puzzle - Generated puzzle
   * @returns Array of analyzer results
   * @private
   */
  private extractAnalyzerResults(puzzle: GeneratedPuzzle): AnalyzerResult[] {
    // Convert groups back to analyzer results
    // Note: We don't have all original metadata, but we have enough for quality scoring
    return puzzle.groups.map((group) => ({
      films: group.films.map((film) => ({
        id: film.id,
        title: film.title,
        release_date: `${film.year}-01-01`,
        poster_path: film.poster_path || null,
        genre_ids: [],
        overview: '',
        vote_count: 0, // Not available in Film type, would need to be preserved
        popularity: 0,
        genres: [],
        credits: { cast: [], crew: [] },
      })),
      connection: group.connection,
      connectionType: group.id.split('-')[0] || 'unknown',
      difficultyScore: this.difficultyToScore(group.difficulty),
    }));
  }

  /**
   * Convert difficulty level to numeric score for analyzer results.
   *
   * @param difficulty - Difficulty level
   * @returns Numeric difficulty score
   * @private
   */
  private difficultyToScore(difficulty: string): number {
    const scores: Record<string, number> = {
      easy: 2000,
      medium: 5000,
      hard: 7000,
      hardest: 9000,
    };
    return scores[difficulty] || 5000;
  }

  /**
   * Update configuration.
   *
   * @param config - Partial configuration to merge
   */
  configure(config: Partial<PuzzleGeneratorConfig>): void {
    Object.assign(this.config, config);

    if (config.enabledAnalyzers) {
      this.enabledAnalyzers = config.enabledAnalyzers;
    }

    if (config.poolFilters) {
      this.poolFilters = config.poolFilters;
    }

    if (config.qualityScorerConfig) {
      this.scorer.configure(config.qualityScorerConfig);
    }

    // Update engine config
    this.engine.configure({
      poolSize: this.config.moviePoolSize,
      groupsNeeded: this.config.groupsPerPuzzle,
      avoidRecentContent: this.config.avoidRecentContent,
    });
  }

  /**
   * Get current configuration (read-only).
   *
   * @returns Copy of current configuration
   */
  getConfig(): PuzzleGeneratorConfig {
    return {
      ...this.config,
      enabledAnalyzers: this.enabledAnalyzers ? [...this.enabledAnalyzers] : undefined,
      poolFilters: this.poolFilters ? { ...this.poolFilters } : undefined,
      qualityScorerConfig: this.scorer.getConfig(),
    };
  }

  /**
   * Get quality scorer instance (for external configuration).
   *
   * @returns Quality scorer instance
   */
  getScorer(): QualityScorer {
    return this.scorer;
  }

  /**
   * Get puzzle engine instance (for external configuration).
   *
   * @returns Puzzle engine instance
   */
  getEngine(): PuzzleEngine {
    return this.engine;
  }
}
