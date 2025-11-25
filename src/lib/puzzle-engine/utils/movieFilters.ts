/**
 * Movie Filtering Utilities
 *
 * Functions for filtering movie pools based on various criteria.
 */

import type { TMDBMovieDetails } from '../../../types';

/**
 * Filter out recently used films.
 *
 * Prevents repetition by excluding films that were used in recent puzzles.
 *
 * @param movies - Movies to filter
 * @param recentIds - Set of recently used movie IDs
 * @returns Filtered array of movies
 */
export function filterRecentFilms(
  movies: TMDBMovieDetails[],
  recentIds: Set<number>
): TMDBMovieDetails[] {
  return movies.filter((movie) => !recentIds.has(movie.id));
}

/**
 * Filter movies by minimum vote count.
 *
 * Ensures films have sufficient popularity/ratings data.
 * Default threshold of 500 votes filters out very obscure or unrated films.
 *
 * @param movies - Movies to filter
 * @param minVotes - Minimum vote count threshold (default: 500)
 * @returns Filtered array of movies
 */
export function filterByVoteCount(
  movies: TMDBMovieDetails[],
  minVotes: number = 500
): TMDBMovieDetails[] {
  return movies.filter((movie) => (movie.vote_count || 0) >= minVotes);
}

/**
 * Filter movies by release year range.
 *
 * @param movies - Movies to filter
 * @param minYear - Minimum release year (inclusive)
 * @param maxYear - Maximum release year (inclusive)
 * @returns Filtered array of movies
 */
export function filterByYearRange(
  movies: TMDBMovieDetails[],
  minYear: number,
  maxYear: number
): TMDBMovieDetails[] {
  return movies.filter((movie) => {
    if (!movie.release_date) return false;
    const year = new Date(movie.release_date).getFullYear();
    return year >= minYear && year <= maxYear;
  });
}

/**
 * Filter movies by genre IDs.
 *
 * Returns movies that have at least one of the specified genres.
 *
 * @param movies - Movies to filter
 * @param genreIds - Array of genre IDs to match
 * @returns Filtered array of movies
 */
export function filterByGenres(
  movies: TMDBMovieDetails[],
  genreIds: number[]
): TMDBMovieDetails[] {
  return movies.filter((movie) => {
    return movie.genres?.some((genre) => genreIds.includes(genre.id));
  });
}

/**
 * Check if a movie has minimum vote count.
 *
 * Utility for single movie validation.
 *
 * @param movie - Movie to check
 * @param minVotes - Minimum vote count (default: 500)
 * @returns true if movie meets threshold
 */
export function hasMinimumVoteCount(
  movie: TMDBMovieDetails,
  minVotes: number = 500
): boolean {
  return (movie.vote_count || 0) >= minVotes;
}
