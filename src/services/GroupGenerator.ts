/**
 * GroupGenerator Service
 *
 * Generates connection groups for the curated pool.
 * Uses the same analyzer pipeline as PuzzleGenerator but returns
 * individual groups instead of complete puzzles.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only generates groups, doesn't manage storage
 * - Open/Closed: New analyzers can be added without modification
 * - Dependency Inversion: Uses analyzer registry abstraction
 */

import type { TMDBMovieDetails, Film } from '../types';
import type { AnalyzerResult } from '../lib/puzzle-engine/types';
import { analyzerRegistry } from '../lib/puzzle-engine/core/AnalyzerRegistry';
import type { DifficultyColor, DifficultyLevel, GroupInput } from '../lib/supabase/storage';

/**
 * Movie pool filter configuration
 */
export interface MoviePoolFilter {
  minYear?: number;
  maxYear?: number;
  minVoteCount?: number;
  maxVoteCount?: number;
  minPopularity?: number;
  allowedGenres?: number[];
  excludedGenres?: number[];
}

/**
 * Configuration for GroupGenerator
 */
export interface GroupGeneratorConfig {
  /** Size of movie pool to analyze (default: 200) */
  moviePoolSize?: number;

  /** Minimum quality score (0-100) for group acceptance (default: 35) */
  qualityThreshold?: number;

  /** Maximum groups to generate per batch (default: 50) */
  maxGroupsPerBatch?: number;

  /** Enabled analyzer names */
  enabledAnalyzers?: string[];

  /** Movie pool filters */
  poolFilters?: MoviePoolFilter;
}

/**
 * Generated group ready for storage
 */
export interface GeneratedGroup {
  films: Film[];
  connection: string;
  connectionType: string;
  difficultyScore: number;
  difficulty: DifficultyLevel;
  color: DifficultyColor;
}

/**
 * Result of group generation
 */
export interface GroupGenerationResult {
  groups: GeneratedGroup[];
  totalFound: number;
  filteredCount: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<GroupGeneratorConfig, 'enabledAnalyzers' | 'poolFilters'>> = {
  moviePoolSize: 200,
  qualityThreshold: 35,
  maxGroupsPerBatch: 50,
};

/**
 * GroupGenerator Implementation
 *
 * Generates connection groups using analyzers.
 */
export class GroupGenerator {
  private config: Required<Omit<GroupGeneratorConfig, 'enabledAnalyzers' | 'poolFilters'>>;
  private enabledAnalyzers?: string[];
  private poolFilters?: MoviePoolFilter;

  constructor(config: GroupGeneratorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enabledAnalyzers = config.enabledAnalyzers;
    this.poolFilters = config.poolFilters;
  }

  /**
   * Generate groups from a movie pool.
   *
   * @param moviePool - Array of movies to analyze
   * @param recentConnections - Optional set of recently used connections to exclude
   * @returns Generated groups with statistics
   */
  async generateGroups(
    moviePool: TMDBMovieDetails[],
    recentConnections?: Set<string>
  ): Promise<GroupGenerationResult> {
    // Apply movie pool filters
    const filteredPool = this.applyPoolFilters(moviePool);

    if (filteredPool.length < 20) {
      throw new Error(
        `Filtered movie pool too small: ${filteredPool.length} movies (minimum: 20)`
      );
    }

    // Get enabled analyzers
    const analyzers = analyzerRegistry.getEnabled();

    if (analyzers.length === 0) {
      throw new Error('No analyzers are registered or enabled');
    }

    // Run all enabled analyzers in parallel
    const allResults = await Promise.all(
      analyzers.map((analyzer) => analyzer.analyze(filteredPool))
    );

    // Flatten results from all analyzers
    let potentialGroups = allResults.flat();

    const totalFound = potentialGroups.length;

    // Filter out recently used connections
    if (recentConnections && recentConnections.size > 0) {
      potentialGroups = potentialGroups.filter(
        (group) => !recentConnections.has(group.connection)
      );
    }

    // Deduplicate groups with identical or highly overlapping films
    const deduplicatedGroups = this.deduplicateByFilms(potentialGroups);

    // Convert to GeneratedGroup format with difficulty assignment
    const groups = deduplicatedGroups
      .slice(0, this.config.maxGroupsPerBatch)
      .map((result) => this.analyzerResultToGroup(result));

    return {
      groups,
      totalFound,
      filteredCount: totalFound - deduplicatedGroups.length,
    };
  }

  /**
   * Convert analyzer result to generated group.
   */
  private analyzerResultToGroup(result: AnalyzerResult): GeneratedGroup {
    const { difficulty, color } = this.calculateDifficulty(result.difficultyScore);

    return {
      films: result.films.map(this.tmdbToFilm),
      connection: result.connection,
      connectionType: result.connectionType,
      difficultyScore: result.difficultyScore,
      difficulty,
      color,
    };
  }

  /**
   * Calculate difficulty level and color from score.
   * Uses quartile-based assignment.
   *
   * Score ranges (based on analyzer output):
   * - 0-3000: Easy (Yellow)
   * - 3001-6000: Medium (Green)
   * - 6001-8000: Hard (Blue)
   * - 8001+: Hardest (Purple)
   */
  private calculateDifficulty(
    score: number
  ): { difficulty: DifficultyLevel; color: DifficultyColor } {
    if (score <= 3000) {
      return { difficulty: 'easy', color: 'yellow' };
    } else if (score <= 6000) {
      return { difficulty: 'medium', color: 'green' };
    } else if (score <= 8000) {
      return { difficulty: 'hard', color: 'blue' };
    } else {
      return { difficulty: 'hardest', color: 'purple' };
    }
  }

  /**
   * Convert TMDB movie to game film format.
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
   * Apply configured filters to movie pool.
   */
  private applyPoolFilters(movies: TMDBMovieDetails[]): TMDBMovieDetails[] {
    if (!this.poolFilters) {
      return movies;
    }

    return movies.filter((movie) => {
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
  }

  /**
   * Deduplicate groups by film content.
   * Removes groups that have identical films or high overlap (3+ shared films).
   */
  private deduplicateByFilms(groups: AnalyzerResult[]): AnalyzerResult[] {
    const accepted: AnalyzerResult[] = [];
    const seenFilmSets = new Set<string>();

    for (const group of groups) {
      // Create fingerprint from sorted film IDs
      const filmIds = group.films.map((f) => f.id).sort((a, b) => a - b);
      const fingerprint = filmIds.join(',');

      // Skip if we've seen this exact combination
      if (seenFilmSets.has(fingerprint)) {
        continue;
      }

      // Check for high overlap with already accepted groups (3+ shared films)
      const filmIdSet = new Set(filmIds);
      let hasHighOverlap = false;

      for (const acceptedGroup of accepted) {
        const acceptedIds = new Set(acceptedGroup.films.map((f) => f.id));
        let sharedCount = 0;

        for (const id of filmIdSet) {
          if (acceptedIds.has(id)) {
            sharedCount++;
          }
        }

        // If 3 or more films overlap, consider it too similar
        if (sharedCount >= 3) {
          hasHighOverlap = true;
          break;
        }
      }

      if (hasHighOverlap) {
        continue;
      }

      // Accept this group
      seenFilmSets.add(fingerprint);
      accepted.push(group);
    }

    return accepted;
  }

  /**
   * Update configuration.
   */
  configure(config: Partial<GroupGeneratorConfig>): void {
    Object.assign(this.config, config);

    if (config.enabledAnalyzers) {
      this.enabledAnalyzers = config.enabledAnalyzers;
    }

    if (config.poolFilters) {
      this.poolFilters = config.poolFilters;
    }
  }

  /**
   * Get current configuration (read-only).
   */
  getConfig(): GroupGeneratorConfig {
    return {
      ...this.config,
      enabledAnalyzers: this.enabledAnalyzers ? [...this.enabledAnalyzers] : undefined,
      poolFilters: this.poolFilters ? { ...this.poolFilters } : undefined,
    };
  }

  /**
   * Convert GeneratedGroup to GroupInput for storage.
   */
  static toGroupInput(group: GeneratedGroup): GroupInput {
    return {
      films: group.films,
      connection: group.connection,
      connectionType: group.connectionType,
      difficultyScore: group.difficultyScore,
      difficulty: group.difficulty,
      color: group.color,
      status: 'pending',
    };
  }
}
