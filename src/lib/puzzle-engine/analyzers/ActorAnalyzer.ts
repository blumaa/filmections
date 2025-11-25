/**
 * ActorAnalyzer
 *
 * Finds movie connections based on shared cast members.
 * Groups movies that feature the same actor in the top billing positions.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes actor-based connections
 * - Open/Closed: Extends BaseAnalyzer, adding actor-specific logic
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 * - Interface Segregation: Implements focused IAnalyzer interface
 * - Dependency Inversion: Depends on TMDBMovieDetails abstraction
 *
 * Following KISS: Simple, focused implementation with clear logic
 * Following DRY: Reuses BaseAnalyzer utilities for grouping and scoring
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, AnalyzerConfig, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';

/**
 * Configuration specific to ActorAnalyzer
 */
export interface ActorAnalyzerConfig {
  /** Only consider actors in top N billing positions (default: 5) */
  castDepth: number;
  /** Minimum popularity score for actors to consider (default: 0) */
  minActorPopularity: number;
}

/**
 * Combined configuration type for ActorAnalyzer
 */
export type ActorAnalyzerFullConfig = Partial<AnalyzerConfig & ActorAnalyzerConfig>;

/**
 * ActorAnalyzer Implementation
 *
 * Analyzes movies to find groups connected by shared actors.
 * Only considers actors in top billing positions (configurable via castDepth).
 *
 * Algorithm:
 * 1. Extract actors from top billing positions of each movie
 * 2. Group movies by actor ID
 * 3. Filter actors with sufficient films (minGroupSize)
 * 4. Calculate difficulty based on average vote counts
 * 5. Return valid connections
 *
 * @example
 * ```typescript
 * const analyzer = new ActorAnalyzer();
 * analyzer.configure({ castDepth: 3 }); // Only consider top 3 billed actors
 * const results = await analyzer.analyze(movies);
 * ```
 */
export class ActorAnalyzer extends BaseAnalyzer {
  readonly name = 'actor';
  readonly connectionType: ConnectionType = 'actor';

  private actorConfig: ActorAnalyzerConfig = {
    castDepth: 5,
    minActorPopularity: 0,
  };

  /**
   * Configure actor-specific and base analyzer options
   */
  configure(config: ActorAnalyzerFullConfig): void {
    // Handle base config properties (enabled, minGroupSize, maxGroupSize)
    super.configure(config);

    // Handle actor-specific config properties
    const { castDepth, minActorPopularity } = config;
    if (castDepth !== undefined || minActorPopularity !== undefined) {
      this.actorConfig = {
        ...this.actorConfig,
        ...(castDepth !== undefined && { castDepth }),
        ...(minActorPopularity !== undefined && { minActorPopularity }),
      };
    }
  }

  /**
   * Find actor-based connections in the movie pool
   *
   * @param movies - Array of movies with cast information
   * @returns Array of potential actor-based groups
   */
  protected async findConnections(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    // Group movies by actor
    const actorMap = this.groupMoviesByActor(movies);

    const results: AnalyzerResult[] = [];

    // Process each actor's filmography
    for (const [actorId, actorData] of actorMap) {
      // Skip if actor doesn't have enough films
      if (actorData.movies.length < this._config.minGroupSize) {
        continue;
      }

      // Shuffle and select films
      const shuffledFilms = this.shuffleFilms(actorData.movies);
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score
      const difficultyScore = this.calculateDifficultyScore(selectedFilms);

      results.push({
        films: selectedFilms,
        connection: `Starring ${actorData.name}`,
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          actorId,
          actorName: actorData.name,
          totalFilms: actorData.movies.length,
        },
      });
    }

    return results;
  }

  /**
   * Group movies by actor ID
   *
   * Only considers actors in top billing positions (up to castDepth).
   *
   * @param movies - Movies to group
   * @returns Map of actor ID to actor data and movies
   */
  private groupMoviesByActor(
    movies: TMDBMovieDetails[]
  ): Map<number, { name: string; movies: TMDBMovieDetails[] }> {
    const actorMap = new Map<number, { name: string; movies: TMDBMovieDetails[] }>();

    for (const movie of movies) {
      // Get top-billed actors (sorted by order)
      const topActors = movie.credits.cast
        .filter((actor) => actor.order < this.actorConfig.castDepth)
        .sort((a, b) => a.order - b.order);

      // Add movie to each actor's filmography
      for (const actor of topActors) {
        if (!actorMap.has(actor.id)) {
          actorMap.set(actor.id, {
            name: actor.name,
            movies: [],
          });
        }

        actorMap.get(actor.id)!.movies.push(movie);
      }
    }

    return actorMap;
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
