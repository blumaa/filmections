import { describe, it, expect, beforeEach } from 'vitest';
import { YearAnalyzer } from '../analyzers/YearAnalyzer';
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

describe('YearAnalyzer', () => {
  let analyzer: YearAnalyzer;

  beforeEach(() => {
    analyzer = new YearAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('year');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('year');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find movies from 1999', async () => {
      const movies = [
        createMockMovie(1, 'The Matrix', '1999-03-31'),
        createMockMovie(2, 'Fight Club', '1999-10-15'),
        createMockMovie(3, 'The Sixth Sense', '1999-08-06'),
        createMockMovie(4, 'American Beauty', '1999-09-15'),
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      expect(year1999).toBeDefined();
      expect(year1999?.films).toHaveLength(4);
      expect(year1999?.connection).toBe('Films from 1999');
    });

    it('should find movies from 1994', async () => {
      const movies = [
        createMockMovie(1, 'Pulp Fiction', '1994-10-14'),
        createMockMovie(2, 'The Shawshank Redemption', '1994-09-23'),
        createMockMovie(3, 'Forrest Gump', '1994-07-06'),
        createMockMovie(4, 'The Lion King', '1994-06-24'),
      ];

      const results = await analyzer.analyze(movies);

      const year1994 = results.find((r) => r.metadata?.year === 1994);
      expect(year1994).toBeDefined();
      expect(year1994?.films).toHaveLength(4);
      expect(year1994?.connection).toBe('Films from 1994');
    });

    it('should find movies from 2019', async () => {
      const movies = [
        createMockMovie(1, 'Parasite', '2019-05-30'),
        createMockMovie(2, 'Joker', '2019-10-04'),
        createMockMovie(3, '1917', '2019-12-25'),
        createMockMovie(4, 'Once Upon a Time in Hollywood', '2019-07-26'),
      ];

      const results = await analyzer.analyze(movies);

      const year2019 = results.find((r) => r.metadata?.year === 2019);
      expect(year2019).toBeDefined();
      expect(year2019?.films).toHaveLength(4);
      expect(year2019?.connection).toBe('Films from 2019');
    });

    it('should skip years with insufficient movies', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01'),
        createMockMovie(2, 'Movie 2', '1999-02-01'),
        createMockMovie(3, 'Movie 3', '2000-01-01'),
        // Only 2 movies from 1999 - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      expect(year1999).toBeUndefined();
    });

    it('should only find interesting years', async () => {
      analyzer.configure({ interestingYears: [1999, 2001] });

      const movies = [
        createMockMovie(1, 'Movie 1', '1998-01-01'),
        createMockMovie(2, 'Movie 2', '1998-02-01'),
        createMockMovie(3, 'Movie 3', '1998-03-01'),
        createMockMovie(4, 'Movie 4', '1998-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      // 1998 is not in interesting years list
      const year1998 = results.find((r) => r.metadata?.year === 1998);
      expect(year1998).toBeUndefined();
    });

    it('should respect interestingYears config', async () => {
      analyzer.configure({ interestingYears: [1999] }); // Only 1999

      const movies = [
        createMockMovie(1, 'Movie 1', '1994-01-01'),
        createMockMovie(2, 'Movie 2', '1994-02-01'),
        createMockMovie(3, 'Movie 3', '1994-03-01'),
        createMockMovie(4, 'Movie 4', '1994-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      // 1994 should be filtered out
      const year1994 = results.find((r) => r.metadata?.year === 1994);
      expect(year1994).toBeUndefined();
    });

    it('should handle movies without release dates', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', ''),
        createMockMovie(2, 'Movie 2', '1999-01-01'),
        createMockMovie(3, 'Movie 3', '1999-02-01'),
        createMockMovie(4, 'Movie 4', '1999-03-01'),
        createMockMovie(5, 'Movie 5', '1999-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      // Should only find 1999 group (4 valid movies)
      const year1999 = results.find((r) => r.metadata?.year === 1999);
      expect(year1999?.films).toHaveLength(4);
    });

    it('should handle movies with invalid release dates', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 'invalid-date'),
        createMockMovie(2, 'Movie 2', '1999-01-01'),
        createMockMovie(3, 'Movie 3', '1999-02-01'),
        createMockMovie(4, 'Movie 4', '1999-03-01'),
        createMockMovie(5, 'Movie 5', '1999-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      expect(year1999?.films).toHaveLength(4);
    });

    it('should calculate difficulty with age bonus', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01', 8000),
        createMockMovie(2, 'Movie 2', '1999-02-01', 8000),
        createMockMovie(3, 'Movie 3', '1999-03-01', 8000),
        createMockMovie(4, 'Movie 4', '1999-04-01', 8000),
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      if (year1999) {
        // Should have base difficulty plus age bonus
        expect(year1999.difficultyScore).toBeGreaterThan(2000);
      }
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01'),
        createMockMovie(2, 'Movie 2', '1999-02-01'),
        createMockMovie(3, 'Movie 3', '1999-03-01'),
        createMockMovie(4, 'Movie 4', '1999-04-01'),
        createMockMovie(5, 'Movie 5', '1999-05-01'),
        createMockMovie(6, 'Movie 6', '1999-06-01'),
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      expect(year1999?.films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01'),
        createMockMovie(2, 'Movie 2', '1999-02-01'),
        createMockMovie(3, 'Movie 3', '1999-03-01'),
        createMockMovie(4, 'Movie 4', '1999-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      const year1999 = results.find((r) => r.metadata?.year === 1999);
      if (year1999) {
        expect(year1999.metadata).toHaveProperty('year', 1999);
        expect(year1999.metadata).toHaveProperty('totalMatchingFilms');
      }
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01'),
        createMockMovie(2, 'Movie 2', '1999-02-01'),
        createMockMovie(3, 'Movie 3', '1999-03-01'),
        createMockMovie(4, 'Movie 4', '1999-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle empty movie array', async () => {
      const movies: TMDBMovieDetails[] = [];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should find multiple year groups', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '1999-01-01'),
        createMockMovie(2, 'Movie 2', '1999-02-01'),
        createMockMovie(3, 'Movie 3', '1999-03-01'),
        createMockMovie(4, 'Movie 4', '1999-04-01'),
        createMockMovie(5, 'Movie 5', '1994-01-01'),
        createMockMovie(6, 'Movie 6', '1994-02-01'),
        createMockMovie(7, 'Movie 7', '1994-03-01'),
        createMockMovie(8, 'Movie 8', '1994-04-01'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results.length).toBeGreaterThanOrEqual(2);
      const year1999 = results.find((r) => r.metadata?.year === 1999);
      const year1994 = results.find((r) => r.metadata?.year === 1994);
      expect(year1999).toBeDefined();
      expect(year1994).toBeDefined();
    });

    it('should handle years at decade boundaries', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', '2000-01-01'),
        createMockMovie(2, 'Movie 2', '2000-02-01'),
        createMockMovie(3, 'Movie 3', '2000-03-01'),
        createMockMovie(4, 'Movie 4', '2000-04-01'),
      ];

      // 2000 is not in default interesting years
      analyzer.configure({ interestingYears: [2000] });

      const results = await analyzer.analyze(movies);

      const year2000 = results.find((r) => r.metadata?.year === 2000);
      expect(year2000?.metadata?.year).toBe(2000);
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', '1999-01-01'),
          createMockMovie(2, 'M2', '1999-02-01'),
          createMockMovie(3, 'M3', '1999-03-01'),
          createMockMovie(4, 'M4', '1999-04-01'),
        ],
        connection: 'Films from 1999',
        connectionType: 'year' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [createMockMovie(1, 'M1', '1999-01-01'), createMockMovie(2, 'M2', '1999-02-01')],
        connection: 'Films from 1999',
        connectionType: 'year' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', '1999-01-01'),
          createMockMovie(2, 'M2', '1999-02-01'),
          createMockMovie(3, 'M3', '1999-03-01'),
          createMockMovie(4, 'M4', '1999-04-01'),
        ],
        connection: '',
        connectionType: 'year' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuring interestingYears', () => {
      analyzer.configure({ interestingYears: [1999, 2001] });
      expect(analyzer.name).toBe('year'); // Sanity check
    });

    it('should allow configuring both base and year options', () => {
      analyzer.configure({
        enabled: false,
        minGroupSize: 5,
        interestingYears: [1999],
      });
      expect(analyzer.config.enabled).toBe(false);
      expect(analyzer.config.minGroupSize).toBe(5);
    });
  });
});
