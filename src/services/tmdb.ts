import type { TMDBMovie, TMDBMovieDetails, TMDBDiscoverResponse } from '../types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  console.warn('TMDB_API_KEY is not set. Please add VITE_TMDB_API_KEY to your .env file');
}

export class TMDBService {
  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', TMDB_API_KEY);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  async discoverMovies(params: {
    year?: number;
    with_genres?: string;
    with_people?: string;
    sort_by?: string;
    page?: number;
  }): Promise<TMDBDiscoverResponse> {
    const queryParams: Record<string, string> = {
      page: String(params.page || 1),
      sort_by: params.sort_by || 'popularity.desc',
    };

    if (params.year) queryParams.year = String(params.year);
    if (params.with_genres) queryParams.with_genres = params.with_genres;
    if (params.with_people) queryParams.with_people = params.with_people;

    return this.fetch<TMDBDiscoverResponse>('/discover/movie', queryParams);
  }

  async getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
    return this.fetch<TMDBMovieDetails>(`/movie/${movieId}`, {
      append_to_response: 'credits',
    });
  }

  async searchMovies(query: string, page = 1): Promise<TMDBDiscoverResponse> {
    return this.fetch<TMDBDiscoverResponse>('/search/movie', {
      query,
      page: String(page),
    });
  }

  async getMoviesByDirector(directorId: number, limit = 10): Promise<TMDBMovie[]> {
    const response = await this.discoverMovies({
      with_people: String(directorId),
      sort_by: 'popularity.desc',
      page: 1,
    });

    return response.results.slice(0, limit);
  }

  async getMoviesByActor(actorId: number, limit = 10): Promise<TMDBMovie[]> {
    const response = await this.discoverMovies({
      with_people: String(actorId),
      sort_by: 'popularity.desc',
      page: 1,
    });

    return response.results.slice(0, limit);
  }

  async getMoviesByGenre(genreId: number, limit = 10): Promise<TMDBMovie[]> {
    const response = await this.discoverMovies({
      with_genres: String(genreId),
      sort_by: 'popularity.desc',
      page: 1,
    });

    return response.results.slice(0, limit);
  }

  async getMoviesByDecade(decade: number, limit = 10): Promise<TMDBMovie[]> {
    const startYear = decade;
    const endYear = decade + 9;

    // Get movies from multiple years in the decade
    const results: TMDBMovie[] = [];

    for (let year = startYear; year <= endYear && results.length < limit; year++) {
      const response = await this.discoverMovies({
        year,
        sort_by: 'popularity.desc',
        page: 1,
      });

      results.push(...response.results);

      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  }

  async getRandomMoviePool(size = 150): Promise<TMDBMovieDetails[]> {
    const movies: TMDBMovieDetails[] = [];
    const seenIds = new Set<number>();

    // Define eras to ensure good year distribution (1930-now)
    const currentYear = new Date().getFullYear();
    const eras = [
      { start: 1930, end: 1959, weight: 0.15 }, // Classic era
      { start: 1960, end: 1979, weight: 0.2 },  // Golden age
      { start: 1980, end: 1999, weight: 0.25 }, // Modern classics
      { start: 2000, end: 2014, weight: 0.2 },  // Recent classics
      { start: 2015, end: currentYear, weight: 0.2 }, // Contemporary
    ];

    for (const era of eras) {
      const targetCount = Math.floor(size * era.weight);
      const eraMovies: TMDBMovieDetails[] = [];

      // Fetch 2-3 pages from this era
      const pages = [1, 2, Math.floor(Math.random() * 3) + 3];

      for (const page of pages) {
        if (eraMovies.length >= targetCount) break;

        const response = await this.fetch<TMDBDiscoverResponse>('/discover/movie', {
          sort_by: 'popularity.desc',
          page: String(page),
          'primary_release_date.gte': `${era.start}-01-01`,
          'primary_release_date.lte': `${era.end}-12-31`,
          'vote_count.gte': '500', // Only well-known films
          include_adult: 'false',
        });

        // Get full details for movies in this era
        for (const movie of response.results) {
          if (seenIds.has(movie.id) || eraMovies.length >= targetCount) break;

          try {
            const details = await this.getMovieDetails(movie.id);

            // Only include movies with full data and good vote count
            if (details.credits?.cast && details.credits?.crew && details.vote_count >= 500) {
              eraMovies.push(details);
              seenIds.add(movie.id);
            }
          } catch (error) {
            console.warn(`Failed to fetch details for movie ${movie.id}`, error);
          }
        }
      }

      movies.push(...eraMovies);
      if (movies.length >= size) break;
    }

    return movies;
  }
}

export const tmdbService = new TMDBService();
