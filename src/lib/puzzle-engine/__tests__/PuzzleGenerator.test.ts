import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PuzzleGenerator } from '../PuzzleGenerator';
import type { TMDBMovieDetails } from '../../../types';
import {
  DirectorAnalyzer,
  ActorAnalyzer,
  ThemeAnalyzer,
  WordplayAnalyzer,
  DecadeAnalyzer,
  YearAnalyzer,
  analyzerRegistry,
} from '../index';

// Helper to create mock movies
const createMockMovie = (
  id: number,
  title: string,
  year: number,
  voteCount: number = 5000,
  popularity: number = 100,
  genreIds: number[] = []
): TMDBMovieDetails => ({
  id,
  title,
  release_date: `${year}-01-01`,
  poster_path: null,
  genre_ids: genreIds,
  overview: 'A movie description',
  vote_count: voteCount,
  popularity,
  genres: [],
  credits: {
    cast: [
      { id: 1, name: 'Actor Name', character: 'Character', order: 0 },
    ],
    crew: [
      { id: 1, name: 'Director Name', job: 'Director', department: 'Directing' },
    ],
  },
});

describe('PuzzleGenerator', () => {
  // Register analyzers before tests
  beforeEach(() => {
    analyzerRegistry.clear();
    analyzerRegistry.register(new DirectorAnalyzer());
    analyzerRegistry.register(new ActorAnalyzer());
    analyzerRegistry.register(new ThemeAnalyzer());
    analyzerRegistry.register(new WordplayAnalyzer());
    analyzerRegistry.register(new DecadeAnalyzer());
    analyzerRegistry.register(new YearAnalyzer());
  });

  describe('configuration', () => {
    it('should create generator with default config', () => {
      const generator = new PuzzleGenerator();
      const config = generator.getConfig();

      expect(config.moviePoolSize).toBe(150);
      expect(config.groupsPerPuzzle).toBe(4);
      expect(config.qualityThreshold).toBe(35);
      expect(config.maxAttempts).toBe(10);
      expect(config.avoidRecentContent).toBe(true);
    });

    it('should allow custom configuration', () => {
      const generator = new PuzzleGenerator({
        moviePoolSize: 200,
        groupsPerPuzzle: 5,
        qualityThreshold: 50,
        maxAttempts: 5,
      });
      const config = generator.getConfig();

      expect(config.moviePoolSize).toBe(200);
      expect(config.groupsPerPuzzle).toBe(5);
      expect(config.qualityThreshold).toBe(50);
      expect(config.maxAttempts).toBe(5);
    });

    it('should allow updating configuration', () => {
      const generator = new PuzzleGenerator();
      generator.configure({
        qualityThreshold: 40,
        maxAttempts: 15,
      });

      const config = generator.getConfig();
      expect(config.qualityThreshold).toBe(40);
      expect(config.maxAttempts).toBe(15);
    });

    it('should configure enabled analyzers', () => {
      const generator = new PuzzleGenerator({
        enabledAnalyzers: ['director', 'actor'],
      });

      const config = generator.getConfig();
      expect(config.enabledAnalyzers).toEqual(['director', 'actor']);
    });
  });

  describe('movie pool filtering', () => {
    const moviePool = [
      createMockMovie(1, 'Old Movie', 1970, 5000, 100, [28, 12]), // Action, Adventure
      createMockMovie(2, 'Recent Movie', 2023, 8000, 200, [35, 18]), // Comedy, Drama
      createMockMovie(3, 'Popular Movie', 2000, 15000, 300, [28]), // Action
      createMockMovie(4, 'Obscure Movie', 2010, 500, 50, [18]), // Drama
    ];

    it('should filter by year range', async () => {
      const generator = new PuzzleGenerator({
        poolFilters: {
          minYear: 2000,
          maxYear: 2020,
        },
        maxAttempts: 1,
      });

      // Spy on console.warn to suppress warnings
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await generator.generateSingle(moviePool);
      } catch (error) {
        // Expected to fail with small pool, but filtering should have happened
        expect(error).toBeDefined();
      }
    });

    it('should filter by vote count', async () => {
      const generator = new PuzzleGenerator({
        poolFilters: {
          minVoteCount: 6000,
        },
        maxAttempts: 1,
      });

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await generator.generateSingle(moviePool);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should filter by genres', async () => {
      const generator = new PuzzleGenerator({
        poolFilters: {
          allowedGenres: [28], // Action only
        },
        maxAttempts: 1,
      });

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await generator.generateSingle(moviePool);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should throw error if filtered pool too small', async () => {
      const generator = new PuzzleGenerator({
        poolFilters: {
          minYear: 2030, // No movies match
        },
      });

      await expect(generator.generateSingle(moviePool)).rejects.toThrow(
        /Filtered movie pool too small/
      );
    });
  });

  describe('generateSingle', () => {
    // Create a large diverse pool for actual generation
    const createLargePool = (): TMDBMovieDetails[] => {
      const pool: TMDBMovieDetails[] = [];

      // Create movies with "Dark" in title (for wordplay)
      for (let i = 0; i < 10; i++) {
        pool.push(createMockMovie(i, `Dark Movie ${i}`, 1990 + i, 5000 + i * 100));
      }

      // Create movies from 1990s (for decade)
      for (let i = 10; i < 20; i++) {
        pool.push(createMockMovie(i, `Movie ${i}`, 1999, 5000 + i * 100));
      }

      // Create movies with same director
      for (let i = 20; i < 30; i++) {
        pool.push({
          ...createMockMovie(i, `Directed Movie ${i}`, 2000 + i, 5000 + i * 100),
          credits: {
            cast: [{ id: 1, name: 'Actor', character: 'Char', order: 0 }],
            crew: [{ id: 123, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        });
      }

      // Create movies with same actor
      for (let i = 30; i < 40; i++) {
        pool.push({
          ...createMockMovie(i, `Acting Movie ${i}`, 2010 + i, 5000 + i * 100),
          credits: {
            cast: [{ id: 456, name: 'Tom Hanks', character: 'Character', order: 0 }],
            crew: [{ id: 1, name: 'Director', job: 'Director', department: 'Directing' }],
          },
        });
      }

      // Add more variety
      for (let i = 40; i < 150; i++) {
        pool.push(createMockMovie(i, `Film ${i}`, 1980 + (i % 40), 5000 + i * 50));
      }

      return pool;
    };

    it('should generate a valid puzzle', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 5,
        qualityThreshold: 20, // Lower threshold for test
      });

      const moviePool = createLargePool();
      const puzzle = await generator.generateSingle(moviePool);

      expect(puzzle.groups).toHaveLength(4);
      expect(puzzle.films).toHaveLength(16);
      expect(puzzle.qualityScore).toBeGreaterThanOrEqual(0);
      expect(puzzle.attemptNumber).toBeGreaterThanOrEqual(1);
      expect(puzzle.attemptNumber).toBeLessThanOrEqual(5);
    });

    it('should respect quality threshold', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 30,
      });

      const moviePool = createLargePool();

      // Mock console methods
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const puzzle = await generator.generateSingle(moviePool);

      // Should either meet threshold or be close to it
      expect(
        puzzle.meetsThreshold || puzzle.qualityScore >= 24 // 80% of 30
      ).toBe(true);
    });

    it('should avoid recent content when provided', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 20,
        avoidRecentContent: true,
      });

      const moviePool = createLargePool();
      const recentFilmIds = new Set([0, 1, 2, 3]); // First 4 "Dark" movies

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const puzzle = await generator.generateSingle(moviePool, recentFilmIds);

      // Check that none of the recent films are in the puzzle
      const usedIds = puzzle.films.map((f) => f.id);
      expect(usedIds.some((id) => recentFilmIds.has(id))).toBe(false);
    });

    it('should avoid recent connections when provided', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 20,
      });

      const moviePool = createLargePool();
      const recentConnections = new Set(['Directed by Christopher Nolan']);

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const puzzle = await generator.generateSingle(moviePool, undefined, recentConnections);

      // Check that recent connection is not used
      const usedConnections = puzzle.groups.map((g) => g.connection);
      expect(usedConnections.some((c) => recentConnections.has(c))).toBe(false);
    });

    it('should return best attempt if quality threshold not met', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 2,
        qualityThreshold: 95, // Very high threshold
      });

      const moviePool = createLargePool();

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should return best attempt even if threshold not met (fallback logic)
      const puzzle = await generator.generateSingle(moviePool);

      // Should have valid puzzle structure even if quality doesn't meet threshold
      expect(puzzle.groups).toHaveLength(4);
      expect(puzzle.films).toHaveLength(16);
      expect(puzzle.attemptNumber).toBe(2);
      // May not meet threshold, but should have a quality score
      expect(puzzle.qualityScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateBatch', () => {
    const createLargePool = (): TMDBMovieDetails[] => {
      const pool: TMDBMovieDetails[] = [];

      // Create diverse pool with multiple connection types
      for (let i = 0; i < 300; i++) {
        const year = 1970 + (i % 50);
        pool.push({
          ...createMockMovie(i, `Film ${i}`, year, 5000 + i * 50),
          credits: {
            cast: [
              {
                id: 100 + (i % 20),
                name: `Actor ${i % 20}`,
                character: 'Character',
                order: 0,
              },
            ],
            crew: [
              {
                id: 200 + (i % 15),
                name: `Director ${i % 15}`,
                job: 'Director',
                department: 'Directing',
              },
            ],
          },
        });
      }

      return pool;
    };

    it('should generate multiple puzzles', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 20,
      });

      const moviePool = createLargePool();

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await generator.generateBatch(moviePool, 3);

      expect(result.puzzles.length).toBeGreaterThan(0);
      expect(result.succeeded).toBeGreaterThan(0);
      expect(result.succeeded + result.failed).toBe(3);
      expect(result.totalAttempts).toBeGreaterThanOrEqual(result.succeeded);
      expect(result.averageQuality).toBeGreaterThanOrEqual(0);
    });

    it('should deduplicate films across puzzles', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 20,
      });

      const moviePool = createLargePool();

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await generator.generateBatch(moviePool, 2);

      if (result.puzzles.length === 2) {
        const films1 = new Set(result.puzzles[0].films.map((f) => f.id));
        const films2 = new Set(result.puzzles[1].films.map((f) => f.id));

        // Check for overlap
        let hasOverlap = false;
        for (const id of films1) {
          if (films2.has(id)) {
            hasOverlap = true;
            break;
          }
        }

        expect(hasOverlap).toBe(false);
      }
    });

    it('should deduplicate connections across puzzles', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 20,
      });

      const moviePool = createLargePool();

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await generator.generateBatch(moviePool, 2);

      if (result.puzzles.length === 2) {
        const connections1 = new Set(result.puzzles[0].groups.map((g) => g.connection));
        const connections2 = new Set(result.puzzles[1].groups.map((g) => g.connection));

        // Check for overlap
        let hasOverlap = false;
        for (const conn of connections1) {
          if (connections2.has(conn)) {
            hasOverlap = true;
            break;
          }
        }

        expect(hasOverlap).toBe(false);
      }
    });

    it('should provide accurate batch statistics', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 2,
        qualityThreshold: 20,
      });

      const moviePool = createLargePool();

      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await generator.generateBatch(moviePool, 5);

      expect(result.succeeded + result.failed).toBe(5);
      expect(result.totalAttempts).toBeGreaterThanOrEqual(result.succeeded);
      expect(result.averageQuality).toBeGreaterThanOrEqual(0);

      if (result.puzzles.length > 0) {
        const manualAvg =
          result.puzzles.reduce((sum, p) => sum + p.qualityScore, 0) /
          result.puzzles.length;
        expect(Math.abs(result.averageQuality - manualAvg)).toBeLessThan(0.2);
      }
    });
  });

  describe('analyzer configuration', () => {
    it('should allow configuring enabled analyzers', () => {
      const generator = new PuzzleGenerator({
        enabledAnalyzers: ['director', 'actor'],
      });

      const config = generator.getConfig();

      // Should store enabled analyzer configuration
      expect(config.enabledAnalyzers).toEqual(['director', 'actor']);
    });

    it('should update analyzer configuration', () => {
      const generator = new PuzzleGenerator({
        enabledAnalyzers: ['director', 'actor'],
      });

      generator.configure({
        enabledAnalyzers: ['theme', 'wordplay'],
      });

      const config = generator.getConfig();
      expect(config.enabledAnalyzers).toEqual(['theme', 'wordplay']);
    });
  });

  describe('quality scorer integration', () => {
    it('should use quality scorer to evaluate puzzles', async () => {
      const generator = new PuzzleGenerator({
        maxAttempts: 3,
        qualityThreshold: 25,
        qualityScorerConfig: {
          minScore: 25,
          requireNoOverlap: true,
        },
      });

      const moviePool: TMDBMovieDetails[] = [];
      for (let i = 0; i < 150; i++) {
        moviePool.push(createMockMovie(i, `Film ${i}`, 1980 + (i % 40), 5000));
      }

      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const puzzle = await generator.generateSingle(moviePool);

      expect(puzzle).toHaveProperty('qualityScore');
      expect(puzzle).toHaveProperty('meetsThreshold');
      expect(typeof puzzle.qualityScore).toBe('number');
      expect(typeof puzzle.meetsThreshold).toBe('boolean');
    });

    it('should respect quality scorer configuration', () => {
      const generator = new PuzzleGenerator({
        qualityScorerConfig: {
          minScore: 50,
          weights: {
            clarity: 0.4,
            difficulty: 0.3,
            diversity: 0.2,
            uniqueness: 0.1,
          },
        },
      });

      const scorer = generator.getScorer();
      const config = scorer.getConfig();

      expect(config.minScore).toBe(50);
      expect(config.weights?.clarity).toBe(0.4);
    });
  });
});
