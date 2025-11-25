/**
 * Era-Balanced Pool Builder
 *
 * Fetches films with EQUAL distribution across 5 eras (20% each).
 * This ensures the AI has diverse films to find connections with,
 * not just recent popular movies.
 *
 * Key design decisions:
 * - Lower vote thresholds for older films (they have fewer votes)
 * - Equal distribution ensures classic films are available
 * - Individual groups do NOT need to span eras - this is just for the pool
 */

import type { TMDBMovieDetails } from '../types';
import { TMDBService } from './tmdb';

export interface EraConfig {
  name: string;
  startYear: number;
  endYear: number;
  minVoteCount: number; // Lower for older films
}

// 5 eras with equal distribution (20% each)
export const ERAS: EraConfig[] = [
  { name: 'Silent/Classic', startYear: 1920, endYear: 1959, minVoteCount: 100 },
  { name: 'New Hollywood', startYear: 1960, endYear: 1979, minVoteCount: 200 },
  { name: 'Blockbuster', startYear: 1980, endYear: 1999, minVoteCount: 400 },
  { name: 'Modern', startYear: 2000, endYear: 2014, minVoteCount: 500 },
  { name: 'Contemporary', startYear: 2015, endYear: 2025, minVoteCount: 500 },
];

export interface PoolBuildResult {
  films: TMDBMovieDetails[];
  eraDistribution: Record<string, number>;
  totalFetched: number;
}

export class EraBalancedPoolBuilder {
  private tmdb: TMDBService;

  constructor(tmdb?: TMDBService) {
    this.tmdb = tmdb || new TMDBService();
  }

  /**
   * Build a pool with equal distribution across all eras
   */
  async buildPool(targetSize: number): Promise<PoolBuildResult> {
    const filmsPerEra = Math.ceil(targetSize / ERAS.length);
    const pool: TMDBMovieDetails[] = [];
    const eraDistribution: Record<string, number> = {};
    const seenIds = new Set<number>();

    for (const era of ERAS) {
      const eraFilms = await this.fetchFromEra(era, filmsPerEra, seenIds);
      pool.push(...eraFilms);
      eraDistribution[era.name] = eraFilms.length;

      // Track seen IDs to avoid duplicates across eras
      for (const film of eraFilms) {
        seenIds.add(film.id);
      }
    }

    // Shuffle the pool so films from different eras are mixed
    const shuffled = this.shuffle(pool);

    return {
      films: shuffled,
      eraDistribution,
      totalFetched: shuffled.length,
    };
  }

  /**
   * Fetch films from a specific era
   */
  private async fetchFromEra(
    era: EraConfig,
    count: number,
    seenIds: Set<number>
  ): Promise<TMDBMovieDetails[]> {
    const films: TMDBMovieDetails[] = [];

    // Fetch from multiple pages to get variety
    // Use random pages to avoid always getting the same top results
    const pagesToTry = this.getRandomPages(5);

    for (const page of pagesToTry) {
      if (films.length >= count) break;

      try {
        const response = await this.tmdb.discoverMovies({
          page,
          sort_by: 'vote_average.desc', // Quality films, not just popular
          minYear: era.startYear,
          maxYear: era.endYear,
          vote_count_gte: era.minVoteCount,
        });

        // Get details for each movie (includes credits)
        for (const movie of response.results) {
          if (films.length >= count) break;
          if (seenIds.has(movie.id)) continue;

          try {
            const details = await this.tmdb.getMovieDetails(movie.id);

            // Only include films with complete data
            if (this.isValidFilm(details)) {
              films.push(details);
              seenIds.add(movie.id);
            }
          } catch (err) {
            console.warn(`Failed to fetch details for movie ${movie.id}:`, err);
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch page ${page} for era ${era.name}:`, err);
      }
    }

    return films;
  }

  /**
   * Check if a film has all required data
   */
  private isValidFilm(film: TMDBMovieDetails): boolean {
    return Boolean(
      film.credits?.cast?.length > 0 &&
        film.credits?.crew?.length > 0 &&
        film.overview &&
        film.overview.length > 20 && // Meaningful overview
        film.title
    );
  }

  /**
   * Get random page numbers to fetch from
   */
  private getRandomPages(count: number): number[] {
    const pages: number[] = [];
    const usedPages = new Set<number>();

    while (pages.length < count) {
      // TMDB has ~500 pages max, but quality drops after page 20
      const page = Math.floor(Math.random() * 20) + 1;
      if (!usedPages.has(page)) {
        pages.push(page);
        usedPages.add(page);
      }
    }

    return pages.sort((a, b) => a - b);
  }

  /**
   * Fisher-Yates shuffle
   */
  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
