/**
 * Director Analyzer
 *
 * Finds groups of films directed by the same person.
 * Sample implementation demonstrating the BaseAnalyzer pattern.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes director connections
 * - Open/Closed: Extends BaseAnalyzer without modifying it
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { TMDBMovieDetails } from '../../../types';
import type { AnalyzerResult, ConnectionType } from '../types';

/**
 * Analyzer that finds connections based on film directors.
 *
 * Groups films by their director and returns groups where
 * a director has made at least 4 films in the pool.
 *
 * Examples:
 * - "Directed by Christopher Nolan"
 * - "Directed by Quentin Tarantino"
 * - "Directed by Martin Scorsese"
 */
export class DirectorAnalyzer extends BaseAnalyzer {
  /**
   * Unique identifier for this analyzer.
   */
  readonly name = 'director';

  /**
   * Connection type this analyzer finds.
   */
  readonly connectionType: ConnectionType = 'director';

  /**
   * Find director-based connections in the movie pool.
   *
   * Algorithm:
   * 1. Group movies by director ID
   * 2. Filter directors with at least minGroupSize films
   * 3. Calculate difficulty based on vote counts
   * 4. Return groups with formatted connection text
   *
   * @param movies - Array of movies to analyze
   * @returns Promise resolving to array of director-based groups
   * @protected
   */
  protected async findConnections(
    movies: TMDBMovieDetails[]
  ): Promise<AnalyzerResult[]> {
    // Group movies by director
    const directorMap = this.groupMoviesByDirector(movies);

    // Convert to analyzer results
    const results: AnalyzerResult[] = [];

    for (const [directorId, directorData] of directorMap) {
      // Skip if director doesn't have enough films
      if (directorData.movies.length < this._config.minGroupSize) {
        continue;
      }

      // Shuffle films for variety
      const shuffledFilms = this.shuffleFilms(directorData.movies);

      // Take exactly maxGroupSize films
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score
      const difficultyScore = this.calculateDifficultyScore(selectedFilms);

      results.push({
        films: selectedFilms,
        connection: `Directed by ${directorData.name}`,
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          directorId,
          directorName: directorData.name,
          totalFilms: directorData.movies.length,
        },
      });
    }

    return results;
  }

  /**
   * Group movies by their director.
   *
   * Extracts director information from movie credits and groups
   * films by director ID.
   *
   * @param movies - Movies to group
   * @returns Map of director ID to director data
   * @private
   */
  private groupMoviesByDirector(
    movies: TMDBMovieDetails[]
  ): Map<number, DirectorData> {
    const directorMap = new Map<number, DirectorData>();

    for (const movie of movies) {
      // Extract directors from credits
      const directors =
        movie.credits?.crew?.filter((crew) => crew.job === 'Director') || [];

      for (const director of directors) {
        // Initialize director entry if new
        if (!directorMap.has(director.id)) {
          directorMap.set(director.id, {
            id: director.id,
            name: director.name,
            movies: [],
          });
        }

        // Add movie to director's filmography
        directorMap.get(director.id)!.movies.push(movie);
      }
    }

    return directorMap;
  }
}

/**
 * Internal data structure for tracking director information.
 *
 * @private
 */
interface DirectorData {
  id: number;
  name: string;
  movies: TMDBMovieDetails[];
}
