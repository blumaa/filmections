import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdb';

export function useDiscoverMovies(params: {
  year?: number;
  with_genres?: string;
  with_people?: string;
}) {
  return useQuery({
    queryKey: ['discover-movies', params],
    queryFn: () => tmdbService.discoverMovies(params),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ['movie-details', movieId],
    queryFn: () => tmdbService.getMovieDetails(movieId),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useMoviesByDirector(directorId: number, limit = 10) {
  return useQuery({
    queryKey: ['movies-by-director', directorId, limit],
    queryFn: () => tmdbService.getMoviesByDirector(directorId, limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useMoviesByActor(actorId: number, limit = 10) {
  return useQuery({
    queryKey: ['movies-by-actor', actorId, limit],
    queryFn: () => tmdbService.getMoviesByActor(actorId, limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useMoviesByGenre(genreId: number, limit = 10) {
  return useQuery({
    queryKey: ['movies-by-genre', genreId, limit],
    queryFn: () => tmdbService.getMoviesByGenre(genreId, limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useMoviesByDecade(decade: number, limit = 10) {
  return useQuery({
    queryKey: ['movies-by-decade', decade, limit],
    queryFn: () => tmdbService.getMoviesByDecade(decade, limit),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
