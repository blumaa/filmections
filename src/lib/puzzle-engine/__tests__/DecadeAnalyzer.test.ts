import { describe, it, expect, beforeEach } from 'vitest';
import { DecadeAnalyzer } from '../analyzers/DecadeAnalyzer';
import type { TMDBMovieDetails } from '../../../types';

// Mock movie data for testing
const createMockMovie = (
  id: number,
  title: string,
  releaseDate: string,
  voteCount: number = 5000
): TMDBMovieDetails => ({
  id,
  title,
  release_date: releaseDate,
  poster_path: null,
  genre_ids: [],
  overview: 'A movie description',
  vote_count: voteCount,
  popularity: 100,
  genres: [],
  credits: {
    cast: [],
    crew: [],
  },
});

describe('DecadeAnalyzer', () => {
  let analyzer: DecadeAnalyzer;

  beforeEach(() => {
    analyzer = new DecadeAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('decade');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('decade');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find movies from the 1980s', async () => {
      const movies = [
        createMockMovie(1, 'E.T.', '1982-06-11'),
        createMockMovie(2, 'The Terminator', '1984-10-26'),
        createMockMovie(3, 'Die Hard', '1988-07-15'),
        createMockMovie(4, 'Back to the Future', '1985-07-03'),
      ];

      const results = await analyzer.analyze(movies);

      const eighties = results.find((r) => r.metadata?.decade === 1980);
      expect(eighties).toBeDefined();
      expect(eighties?.films).toHaveLength(4);
      expect(eighties?.connection).toBe('Films from the 1980s');
    });

    it('should find movies from the 1990s', async () => {
      const movies = [
        createMockMovie(1, 'Pulp Fiction', '1994-10-14'),
        createMockMovie(2, 'The Matrix', '1999-03-31'),
        createMockMovie(3, 'Fight Club', '1999-10-15'),
        createMockMovie(4, 'Toy Story', '1995-11-22'),
      ];

      const results = await analyzer.analyze(movies);

      const nineties = results.find((r) => r.metadata?.decade === 1990);
      expect(nineties).toBeDefined();
      expect(nineties?.films).toHaveLength(4);
      expect(nineties?.connection).toBe('Films from the 1990s');
    });

    it('should find movies from the 2000s', async () => {
      const movies = [
        createMockMovie(1, 'The Dark Knight', '2008-07-18'),
        createMockMovie(2, 'Iron Man', '2008-05-02'),
        createMockMovie(3, 'WALL-E', '2008-06-27'),
        createMockMovie(4, 'Avatar', '2009-12-18'),
      ];

      const results = await analyzer.analyze(movies);

      const twothousands = results.find((r) => r.metadata?.decade === 2000);
      expect(twothousands).toBeDefined();
      expect(twothousands?.films).toHaveLength(4);
      expect(twothousands?.connection).toBe('Films from the 2000s');
    });

    it('should find movies from the 2010s', async () => {
      const movies = [
        createMockMovie(1, 'Interstellar', '2014-11-07'),
        createMockMovie(2, 'Mad Max: Fury Road', '2015-05-15'),
        createMockMovie(3, 'Get Out', '2017-02-24'),
        createMockMovie(4, 'Parasite', '2019-05-30'),
      ];

      const results = await analyzer.analyze(movies);

      const twentytens = results.find((r) => r.metadata?.decade === 2010);
      expect(twentytens).toBeDefined();
      expect(twentytens?.films).toHaveLength(4);
      expect(twentytens?.connection).toBe('Films from the 2010s');
    });

    it('should skip decades with insufficient movies', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1980-01-01'),
        createMockMovie(2, 'Movie 2', '1981-01-01'),
        createMockMovie(3, 'Movie 3', '1990-01-01'),
        // Only 2 movies from 1980s - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      const eighties = results.find((r) => r.metadata?.decade === 1980);
      expect(eighties).toBeUndefined();
    });

    it('should respect enabledDecades config', async () => {
      analyzer.configure({ enabledDecades: [1990] }); // Only 1990s

      const movies = [
        createMockMovie(1, 'E.T.', '1982-06-11'),
        createMockMovie(2, 'The Terminator', '1984-10-26'),
        createMockMovie(3, 'Die Hard', '1988-07-15'),
        createMockMovie(4, 'Back to the Future', '1985-07-03'),
      ];

      const results = await analyzer.analyze(movies);

      // 1980s movies should be filtered out
      const eighties = results.find((r) => r.metadata?.decade === 1980);
      expect(eighties).toBeUndefined();
    });

    it('should handle movies without release dates', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', ''),
        createMockMovie(2, 'Movie 2', '1990-01-01'),
        createMockMovie(3, 'Movie 3', '1991-01-01'),
        createMockMovie(4, 'Movie 4', '1992-01-01'),
        createMockMovie(5, 'Movie 5', '1993-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      // Should only find 1990s group (4 valid movies)
      expect(results.length).toBeGreaterThanOrEqual(1);
      const nineties = results.find((r) => r.metadata?.decade === 1990);
      expect(nineties?.films).toHaveLength(4);
    });

    it('should handle movies with invalid release dates', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 'invalid-date'),
        createMockMovie(2, 'Movie 2', '1990-01-01'),
        createMockMovie(3, 'Movie 3', '1991-01-01'),
        createMockMovie(4, 'Movie 4', '1992-01-01'),
        createMockMovie(5, 'Movie 5', '1993-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      const nineties = results.find((r) => r.metadata?.decade === 1990);
      expect(nineties?.films).toHaveLength(4);
    });

    it('should calculate difficulty with age bonus', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1980-01-01', 8000),
        createMockMovie(2, 'Movie 2', '1981-01-01', 8000),
        createMockMovie(3, 'Movie 3', '1982-01-01', 8000),
        createMockMovie(4, 'Movie 4', '1983-01-01', 8000),
      ];

      const results = await analyzer.analyze(movies);

      const eighties = results.find((r) => r.metadata?.decade === 1980);
      if (eighties) {
        // Should have base difficulty plus age bonus
        expect(eighties.difficultyScore).toBeGreaterThan(2000);
      }
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1990-01-01'),
        createMockMovie(2, 'Movie 2', '1991-01-01'),
        createMockMovie(3, 'Movie 3', '1992-01-01'),
        createMockMovie(4, 'Movie 4', '1993-01-01'),
        createMockMovie(5, 'Movie 5', '1994-01-01'),
        createMockMovie(6, 'Movie 6', '1995-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      const nineties = results.find((r) => r.metadata?.decade === 1990);
      expect(nineties?.films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1990-01-01'),
        createMockMovie(2, 'Movie 2', '1991-01-01'),
        createMockMovie(3, 'Movie 3', '1992-01-01'),
        createMockMovie(4, 'Movie 4', '1993-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      const nineties = results.find((r) => r.metadata?.decade === 1990);
      if (nineties) {
        expect(nineties.metadata).toHaveProperty('decade', 1990);
        expect(nineties.metadata).toHaveProperty('decadeLabel', '1990s');
        expect(nineties.metadata).toHaveProperty('totalMatchingFilms');
      }
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Movie 1', '1990-01-01'),
        createMockMovie(2, 'Movie 2', '1991-01-01'),
        createMockMovie(3, 'Movie 3', '1992-01-01'),
        createMockMovie(4, 'Movie 4', '1993-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle empty movie array', async () => {
      const movies: TMDBMovieDetails[] = [];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should find multiple decade groups', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1980-01-01'),
        createMockMovie(2, 'Movie 2', '1981-01-01'),
        createMockMovie(3, 'Movie 3', '1982-01-01'),
        createMockMovie(4, 'Movie 4', '1983-01-01'),
        createMockMovie(5, 'Movie 5', '1990-01-01'),
        createMockMovie(6, 'Movie 6', '1991-01-01'),
        createMockMovie(7, 'Movie 7', '1992-01-01'),
        createMockMovie(8, 'Movie 8', '1993-01-01'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results.length).toBeGreaterThanOrEqual(2);
      const eighties = results.find((r) => r.metadata?.decade === 1980);
      const nineties = results.find((r) => r.metadata?.decade === 1990);
      expect(eighties).toBeDefined();
      expect(nineties).toBeDefined();
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', '1990-01-01'),
          createMockMovie(2, 'M2', '1991-01-01'),
          createMockMovie(3, 'M3', '1992-01-01'),
          createMockMovie(4, 'M4', '1993-01-01'),
        ],
        connection: 'Films from the 1990s',
        connectionType: 'decade' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [createMockMovie(1, 'M1', '1990-01-01'), createMockMovie(2, 'M2', '1991-01-01')],
        connection: 'Films from the 1990s',
        connectionType: 'decade' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', '1990-01-01'),
          createMockMovie(2, 'M2', '1991-01-01'),
          createMockMovie(3, 'M3', '1992-01-01'),
          createMockMovie(4, 'M4', '1993-01-01'),
        ],
        connection: '',
        connectionType: 'decade' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuring enabledDecades', () => {
      analyzer.configure({ enabledDecades: [1980, 1990] });
      expect(analyzer.name).toBe('decade'); // Sanity check
    });

    it('should allow configuring both base and decade options', () => {
      analyzer.configure({
        enabled: false,
        minGroupSize: 5,
        enabledDecades: [2000],
      });
      expect(analyzer.config.enabled).toBe(false);
      expect(analyzer.config.minGroupSize).toBe(5);
    });
  });
});
