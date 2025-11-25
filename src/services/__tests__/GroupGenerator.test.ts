/**
 * GroupGenerator Tests
 *
 * TDD tests for the GroupGenerator service that generates
 * connection groups for the curated pool.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupGenerator } from '../GroupGenerator';
import type { TMDBMovieDetails } from '../../types';
import type { AnalyzerResult } from '../../lib/puzzle-engine/types';

// Mock the analyzer registry
vi.mock('../../lib/puzzle-engine/core/AnalyzerRegistry', () => ({
  analyzerRegistry: {
    getEnabled: vi.fn(),
    clear: vi.fn(),
    register: vi.fn(),
  },
}));

// Mock TMDB movie data
const createMockMovie = (
  id: number,
  title: string,
  year: number = 2020
): TMDBMovieDetails => ({
  id,
  title,
  release_date: `${year}-01-15`,
  poster_path: `/poster${id}.jpg`,
  genre_ids: [28, 12], // Action, Adventure
  overview: `Overview for ${title}`,
  vote_count: 1000,
  popularity: 50,
  genres: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
  ],
  credits: {
    cast: [
      { id: 1, name: 'Actor 1', character: 'Lead', order: 0 },
    ],
    crew: [
      { id: 100, name: 'Director 1', job: 'Director', department: 'Directing' },
    ],
  },
});

// Mock analyzer result
const createMockAnalyzerResult = (
  connection: string,
  connectionType: string,
  filmIds: number[],
  difficultyScore: number = 5000
): AnalyzerResult => ({
  films: filmIds.map((id) => createMockMovie(id, `Film ${id}`)),
  connection,
  connectionType,
  difficultyScore,
});

describe('GroupGenerator', () => {
  let generator: GroupGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default config when none provided', () => {
      generator = new GroupGenerator();
      const config = generator.getConfig();

      expect(config.moviePoolSize).toBe(200);
      expect(config.qualityThreshold).toBe(35);
      expect(config.maxGroupsPerBatch).toBe(50);
    });

    it('should merge custom config with defaults', () => {
      generator = new GroupGenerator({
        moviePoolSize: 300,
        qualityThreshold: 50,
      });

      const config = generator.getConfig();
      expect(config.moviePoolSize).toBe(300);
      expect(config.qualityThreshold).toBe(50);
      expect(config.maxGroupsPerBatch).toBe(50); // Still default
    });
  });

  describe('generateGroups', () => {
    it('should filter movie pool based on configuration', async () => {
      // Create movies with varying years - enough to pass minimum pool check after filtering
      const oldMovies = Array.from({ length: 10 }, (_, i) =>
        createMockMovie(i + 1, `Old Movie ${i}`, 1950)
      );
      const newMovies = Array.from({ length: 25 }, (_, i) =>
        createMockMovie(i + 100, `New Movie ${i}`, 2020)
      );
      const movies = [...oldMovies, ...newMovies];

      generator = new GroupGenerator({
        poolFilters: {
          minYear: 1980,
          maxYear: 2025,
        },
      });

      // Mock the registry to return a mock analyzer
      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      await generator.generateGroups(movies);

      // Should only analyze filtered movies (2020 movies)
      expect(mockAnalyzer.analyze).toHaveBeenCalled();
      const analyzedMovies = mockAnalyzer.analyze.mock.calls[0][0];
      expect(analyzedMovies).toHaveLength(25);
      // All analyzed movies should be from the new movies
      analyzedMovies.forEach((m: TMDBMovieDetails) => {
        expect(m.id).toBeGreaterThanOrEqual(100);
      });
    });

    it('should filter by vote count', async () => {
      // Create enough high vote movies to pass minimum pool check
      const lowVoteMovies = Array.from({ length: 10 }, (_, i) => ({
        ...createMockMovie(i + 1, `Low Votes ${i}`),
        vote_count: 10,
      }));
      const highVoteMovies = Array.from({ length: 25 }, (_, i) => ({
        ...createMockMovie(i + 100, `High Votes ${i}`),
        vote_count: 500,
      }));
      const movies = [...lowVoteMovies, ...highVoteMovies];

      generator = new GroupGenerator({
        poolFilters: {
          minVoteCount: 100,
        },
      });

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      await generator.generateGroups(movies);

      const analyzedMovies = mockAnalyzer.analyze.mock.calls[0][0];
      expect(analyzedMovies).toHaveLength(25);
      // All analyzed movies should be high vote movies
      analyzedMovies.forEach((m: TMDBMovieDetails) => {
        expect(m.id).toBeGreaterThanOrEqual(100);
      });
    });

    it('should return generated groups with difficulty assigned', async () => {
      const movies = Array.from({ length: 50 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      // Mock analyzer returns groups with varying difficulty scores
      const mockResults: AnalyzerResult[] = [
        createMockAnalyzerResult('Easy Connection', 'director', [1, 2, 3, 4], 2000),
        createMockAnalyzerResult('Medium Connection', 'actor', [5, 6, 7, 8], 5000),
        createMockAnalyzerResult('Hard Connection', 'decade', [9, 10, 11, 12], 7500),
        createMockAnalyzerResult('Hardest Connection', 'year', [13, 14, 15, 16], 9000),
      ];

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      const result = await generator.generateGroups(movies);

      expect(result.groups.length).toBeGreaterThan(0);

      // Each group should have proper structure
      result.groups.forEach((group) => {
        expect(group.films).toHaveLength(4);
        expect(group.connection).toBeDefined();
        expect(group.connectionType).toBeDefined();
        expect(group.difficultyScore).toBeGreaterThan(0);
      });
    });

    it('should limit groups to maxGroupsPerBatch', async () => {
      const movies = Array.from({ length: 100 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator({
        maxGroupsPerBatch: 3,
      });

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      // Return more groups than maxGroupsPerBatch
      const mockResults: AnalyzerResult[] = Array.from({ length: 10 }, (_, i) =>
        createMockAnalyzerResult(`Connection ${i}`, 'director', [i * 4 + 1, i * 4 + 2, i * 4 + 3, i * 4 + 4])
      );

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      const result = await generator.generateGroups(movies);

      expect(result.groups.length).toBeLessThanOrEqual(3);
    });

    it('should throw error when no analyzers are enabled', async () => {
      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([]);

      // Need enough movies to pass the pool check
      const movies = Array.from({ length: 25 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      await expect(generator.generateGroups(movies)).rejects.toThrow(
        'No analyzers are registered or enabled'
      );
    });

    it('should exclude groups using recent connections', async () => {
      const movies = Array.from({ length: 50 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      const mockResults: AnalyzerResult[] = [
        createMockAnalyzerResult('Recent Connection', 'director', [1, 2, 3, 4]),
        createMockAnalyzerResult('New Connection', 'actor', [5, 6, 7, 8]),
      ];

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      // Pass recent connections to exclude
      const recentConnections = new Set(['Recent Connection']);
      const result = await generator.generateGroups(movies, recentConnections);

      // Should only return the new connection
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].connection).toBe('New Connection');
    });

    it('should deduplicate groups with identical films', async () => {
      const movies = Array.from({ length: 50 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      // Return groups with identical films but different connections
      // (like Harry Potter with different actors)
      const mockResults: AnalyzerResult[] = [
        createMockAnalyzerResult('Starring Daniel Radcliffe', 'actor', [1, 2, 3, 4]),
        createMockAnalyzerResult('Starring Emma Watson', 'actor', [1, 2, 3, 4]),
        createMockAnalyzerResult('Starring Rupert Grint', 'actor', [1, 2, 3, 4]),
        createMockAnalyzerResult('Different Group', 'director', [5, 6, 7, 8]),
      ];

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      const result = await generator.generateGroups(movies);

      // Should only keep one of the identical groups plus the different one
      expect(result.groups).toHaveLength(2);
      expect(result.groups.map((g) => g.connection)).toContain('Different Group');
    });

    it('should filter groups with high overlap (3+ shared films)', async () => {
      const movies = Array.from({ length: 50 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      // Return groups with high overlap (3 shared films)
      const mockResults: AnalyzerResult[] = [
        createMockAnalyzerResult('Group A', 'director', [1, 2, 3, 4]),
        createMockAnalyzerResult('Group B', 'actor', [1, 2, 3, 5]), // 3 shared with A
        createMockAnalyzerResult('Group C', 'decade', [10, 11, 12, 13]), // No overlap
      ];

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      const result = await generator.generateGroups(movies);

      // Group B should be filtered due to 3 shared films with Group A
      expect(result.groups).toHaveLength(2);
      expect(result.groups.map((g) => g.connection)).toEqual(['Group A', 'Group C']);
    });

    it('should allow groups with only 2 shared films', async () => {
      const movies = Array.from({ length: 50 }, (_, i) =>
        createMockMovie(i + 1, `Movie ${i + 1}`)
      );

      generator = new GroupGenerator();

      const { analyzerRegistry } = await import(
        '../../lib/puzzle-engine/core/AnalyzerRegistry'
      );

      // Return groups with acceptable overlap (2 shared films)
      const mockResults: AnalyzerResult[] = [
        createMockAnalyzerResult('Group A', 'director', [1, 2, 3, 4]),
        createMockAnalyzerResult('Group B', 'actor', [1, 2, 5, 6]), // Only 2 shared
      ];

      const mockAnalyzer = {
        analyze: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(analyzerRegistry.getEnabled).mockReturnValue([mockAnalyzer as never]);

      const result = await generator.generateGroups(movies);

      // Both groups should be kept (only 2 films overlap)
      expect(result.groups).toHaveLength(2);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      generator = new GroupGenerator();

      generator.configure({
        moviePoolSize: 400,
        qualityThreshold: 60,
      });

      const config = generator.getConfig();
      expect(config.moviePoolSize).toBe(400);
      expect(config.qualityThreshold).toBe(60);
    });
  });
});
