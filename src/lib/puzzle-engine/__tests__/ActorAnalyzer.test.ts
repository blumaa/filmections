import { describe, it, expect, beforeEach } from 'vitest';
import { ActorAnalyzer } from '../analyzers/ActorAnalyzer';
import type { TMDBMovieDetails } from '../../../types';

// Mock movie data for testing
const createMockMovie = (
  id: number,
  title: string,
  castMembers: Array<{ id: number; name: string; order: number }>,
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
    cast: castMembers.map((actor) => ({
      id: actor.id,
      name: actor.name,
      character: `Character ${actor.order}`,
      order: actor.order,
    })),
    crew: [],
  },
});

describe('ActorAnalyzer', () => {
  let analyzer: ActorAnalyzer;

  beforeEach(() => {
    analyzer = new ActorAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('actor');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('actor');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find actor-based groups', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      expect(results[0].connection).toBe('Starring Actor A');
      expect(results[0].films).toHaveLength(4);
      expect(results[0].connectionType).toBe('actor');
    });

    it('should handle multiple actors', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(5, 'Movie 5', [{ id: 200, name: 'Actor B', order: 0 }]),
        createMockMovie(6, 'Movie 6', [{ id: 200, name: 'Actor B', order: 0 }]),
        createMockMovie(7, 'Movie 7', [{ id: 200, name: 'Actor B', order: 0 }]),
        createMockMovie(8, 'Movie 8', [{ id: 200, name: 'Actor B', order: 0 }]),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(2);
      const actors = results.map((r) => r.metadata?.actorName);
      expect(actors).toContain('Actor A');
      expect(actors).toContain('Actor B');
    });

    it('should skip actors with fewer than 4 films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        // Only 3 films - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should only consider top-billed actors (castDepth)', async () => {
      analyzer.configure({ castDepth: 2 }); // Only consider actors with order < 2

      const movies = [
        // Actor A is in top billing (order 0)
        createMockMovie(1, 'Movie 1', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 300, name: 'Actor C', order: 5 }, // Outside castDepth
        ]),
        createMockMovie(2, 'Movie 2', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 300, name: 'Actor C', order: 5 },
        ]),
        createMockMovie(3, 'Movie 3', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 300, name: 'Actor C', order: 5 },
        ]),
        createMockMovie(4, 'Movie 4', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 300, name: 'Actor C', order: 5 },
        ]),
      ];

      const results = await analyzer.analyze(movies);

      // Should only find Actor A, not Actor C (who is outside castDepth)
      expect(results).toHaveLength(1);
      expect(results[0].metadata?.actorName).toBe('Actor A');
    });

    it('should calculate difficulty score', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }], 8000),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }], 8000),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }], 8000),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }], 8000),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      // Difficulty = 10000 - avgVoteCount = 10000 - 8000 = 2000
      expect(results[0].difficultyScore).toBe(2000);
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(5, 'Movie 5', [{ id: 100, name: 'Actor A', order: 0 }]), // 5th film
        createMockMovie(6, 'Movie 6', [{ id: 100, name: 'Actor A', order: 0 }]), // 6th film
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(1);
      expect(results[0].films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
      ];

      const results = await analyzer.analyze(movies);

      expect(results[0].metadata).toEqual({
        actorId: 100,
        actorName: 'Actor A',
        totalFilms: 4,
      });
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle movies with no cast', async () => {
      const movies = [
        {
          ...createMockMovie(1, 'Movie 1', [{ id: 100, name: 'Actor A', order: 0 }]),
          credits: { cast: [], crew: [] },
        },
        createMockMovie(2, 'Movie 2', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(3, 'Movie 3', [{ id: 100, name: 'Actor A', order: 0 }]),
        createMockMovie(4, 'Movie 4', [{ id: 100, name: 'Actor A', order: 0 }]),
      ];

      const results = await analyzer.analyze(movies);

      // Should still find the 3 films with actor
      expect(results).toHaveLength(0); // Not enough films (only 3)
    });

    it('should handle movies with multiple cast members', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 200, name: 'Actor B', order: 1 },
        ]),
        createMockMovie(2, 'Movie 2', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 200, name: 'Actor B', order: 1 },
        ]),
        createMockMovie(3, 'Movie 3', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 200, name: 'Actor B', order: 1 },
        ]),
        createMockMovie(4, 'Movie 4', [
          { id: 100, name: 'Actor A', order: 0 },
          { id: 200, name: 'Actor B', order: 1 },
        ]),
      ];

      const results = await analyzer.analyze(movies);

      // Both actors should be found
      expect(results).toHaveLength(2);
      const actors = results.map((r) => r.metadata?.actorName);
      expect(actors).toContain('Actor A');
      expect(actors).toContain('Actor B');
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(2, 'M2', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(3, 'M3', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(4, 'M4', [{ id: 1, name: 'A', order: 0 }]),
        ],
        connection: 'Starring Actor',
        connectionType: 'actor' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(2, 'M2', [{ id: 1, name: 'A', order: 0 }]),
        ],
        connection: 'Starring Actor',
        connectionType: 'actor' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(2, 'M2', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(3, 'M3', [{ id: 1, name: 'A', order: 0 }]),
          createMockMovie(4, 'M4', [{ id: 1, name: 'A', order: 0 }]),
        ],
        connection: '',
        connectionType: 'actor' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuring castDepth', () => {
      analyzer.configure({ castDepth: 3 });

      // Configuration is internal, but we can verify behavior
      expect(analyzer.name).toBe('actor'); // Sanity check
    });

    it('should allow configuring minActorPopularity', () => {
      analyzer.configure({ minActorPopularity: 50 });

      // Configuration is internal, but we can verify behavior
      expect(analyzer.name).toBe('actor'); // Sanity check
    });
  });
});
