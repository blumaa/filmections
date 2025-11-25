import { describe, it, expect, beforeEach } from 'vitest';
import { DirectorAnalyzer } from '../analyzers/DirectorAnalyzer';
import type { TMDBMovieDetails } from '../../../types';

// Mock movie data for testing
const createMockMovie = (
  id: number,
  title: string,
  directorId: number,
  directorName: string,
  voteCount: number = 5000
): TMDBMovieDetails => ({
  id,
  title,
  release_date: '2020-01-01',
  poster_path: null,
  genre_ids: [],
  overview: '',
  vote_count: voteCount,
  popularity: 100,
  genres: [],
  credits: {
    cast: [],
    crew: [
      {
        id: directorId,
        name: directorName,
        job: 'Director',
        department: 'Directing',
      },
    ],
  },
});

describe('DirectorAnalyzer', () => {
  let analyzer: DirectorAnalyzer;

  beforeEach(() => {
    analyzer = new DirectorAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('director');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('director');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find director-based groups', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      expect(results[0].connection).toBe('Directed by Director A');
      expect(results[0].films).toHaveLength(4);
      expect(results[0].connectionType).toBe('director');
    });

    it('should handle multiple directors', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
        createMockMovie(5, 'Movie 5', 200, 'Director B'),
        createMockMovie(6, 'Movie 6', 200, 'Director B'),
        createMockMovie(7, 'Movie 7', 200, 'Director B'),
        createMockMovie(8, 'Movie 8', 200, 'Director B'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(2);
      const directors = results.map(r => r.metadata?.directorName);
      expect(directors).toContain('Director A');
      expect(directors).toContain('Director B');
    });

    it('should skip directors with fewer than 4 films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        // Only 3 films - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should calculate difficulty score', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A', 8000),
        createMockMovie(2, 'Movie 2', 100, 'Director A', 8000),
        createMockMovie(3, 'Movie 3', 100, 'Director A', 8000),
        createMockMovie(4, 'Movie 4', 100, 'Director A', 8000),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      // Difficulty = 10000 - avgVoteCount = 10000 - 8000 = 2000
      expect(results[0].difficultyScore).toBe(2000);
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
        createMockMovie(5, 'Movie 5', 100, 'Director A'), // 5th film
        createMockMovie(6, 'Movie 6', 100, 'Director A'), // 6th film
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      expect(results[0].films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results[0].metadata).toEqual({
        directorId: 100,
        directorName: 'Director A',
        totalFilms: 4,
      });
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Movie 1', 100, 'Director A'),
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle movies with no director', async () => {
      const movies = [
        {
          ...createMockMovie(1, 'Movie 1', 100, 'Director A'),
          credits: { cast: [], crew: [] },
        },
        createMockMovie(2, 'Movie 2', 100, 'Director A'),
        createMockMovie(3, 'Movie 3', 100, 'Director A'),
        createMockMovie(4, 'Movie 4', 100, 'Director A'),
      ];

      const results = await analyzer.analyze(movies);

      // Should still find the 3 films with director
      expect(results).toHaveLength(0); // Not enough films (only 3)
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', 1, 'D'),
          createMockMovie(2, 'M2', 1, 'D'),
          createMockMovie(3, 'M3', 1, 'D'),
          createMockMovie(4, 'M4', 1, 'D'),
        ],
        connection: 'Directed by Director',
        connectionType: 'director' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', 1, 'D'),
          createMockMovie(2, 'M2', 1, 'D'),
        ],
        connection: 'Directed by Director',
        connectionType: 'director' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', 1, 'D'),
          createMockMovie(2, 'M2', 1, 'D'),
          createMockMovie(3, 'M3', 1, 'D'),
          createMockMovie(4, 'M4', 1, 'D'),
        ],
        connection: '',
        connectionType: 'director' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });
});
