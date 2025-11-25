/**
 * HybridGroupGenerator Tests
 *
 * TDD tests for the hybrid approach that combines:
 * 1. Deterministic discovery (guaranteed valid)
 * 2. AI naming/polishing of deterministic groups
 * 3. AI-suggested thematic connections (looser verification)
 */

import { describe, it, expect } from 'vitest';
import { HybridGroupGenerator } from '../HybridGroupGenerator';
import type { TMDBMovieDetails } from '../../types';

// Helper to create mock movie data
const createMockMovie = (
  id: number,
  title: string,
  overrides: Partial<TMDBMovieDetails> = {}
): TMDBMovieDetails => ({
  id,
  title,
  release_date: '2020-01-15',
  poster_path: `/poster${id}.jpg`,
  genre_ids: [28, 12],
  overview: `A movie about ${title.toLowerCase()}`,
  vote_count: 1000,
  popularity: 50,
  genres: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
  ],
  credits: {
    cast: [{ id: 1, name: 'Actor One', character: 'Lead', order: 0 }],
    crew: [{ id: 100, name: 'Director One', job: 'Director', department: 'Directing' }],
  },
  ...overrides,
});

describe('HybridGroupGenerator', () => {
  describe('formatDeterministicGroup', () => {
    it('formats director groups with creative connection text', () => {
      const generator = new HybridGroupGenerator();

      const result = generator.formatDeterministicGroup({
        films: [
          createMockMovie(1, 'Inception'),
          createMockMovie(2, 'Interstellar'),
          createMockMovie(3, 'Dunkirk'),
          createMockMovie(4, 'Tenet'),
        ],
        connectionType: 'director',
        connectionValue: 'Christopher Nolan',
        category: 'crew',
        verificationType: 'director',
        verificationParams: { personId: 525 },
      });

      expect(result.connection).toContain('Christopher Nolan');
      expect(result.films).toHaveLength(4);
      expect(result.category).toBe('crew');
      expect(result.difficulty).toBe('easy'); // Director connections are easy
    });

    it('formats actor groups', () => {
      const generator = new HybridGroupGenerator();

      const result = generator.formatDeterministicGroup({
        films: [
          createMockMovie(1, 'Inception'),
          createMockMovie(2, 'The Revenant'),
          createMockMovie(3, 'The Wolf of Wall Street'),
          createMockMovie(4, 'Shutter Island'),
        ],
        connectionType: 'actor',
        connectionValue: 'Leonardo DiCaprio',
        category: 'cast',
        verificationType: 'actor',
        verificationParams: { personId: 6193 },
      });

      expect(result.connection).toContain('Leonardo DiCaprio');
      expect(result.category).toBe('cast');
      expect(result.difficulty).toBe('easy');
    });

    it('formats title pattern groups', () => {
      const generator = new HybridGroupGenerator();

      const result = generator.formatDeterministicGroup({
        films: [
          createMockMovie(1, 'Red Dawn'),
          createMockMovie(2, 'Red Dragon'),
          createMockMovie(3, 'The Red Tent'),
          createMockMovie(4, 'Red October'),
        ],
        connectionType: 'title-colors',
        connectionValue: 'Color "red" in title',
        category: 'title',
        verificationType: 'title-contains',
        verificationParams: { substring: 'red' },
      });

      expect(result.connection.toLowerCase()).toContain('red');
      expect(result.category).toBe('title');
      expect(result.difficulty).toBe('medium'); // Title patterns are medium
    });
  });

  describe('selectBestGroups', () => {
    it('prioritizes diversity across categories', () => {
      const generator = new HybridGroupGenerator();

      const groups = [
        // Multiple director groups
        generator.formatDeterministicGroup({
          films: [createMockMovie(1, 'A'), createMockMovie(2, 'B'), createMockMovie(3, 'C'), createMockMovie(4, 'D')],
          connectionType: 'director',
          connectionValue: 'Director 1',
          category: 'crew',
          verificationType: 'director',
          verificationParams: { personId: 1 },
        }),
        generator.formatDeterministicGroup({
          films: [createMockMovie(5, 'E'), createMockMovie(6, 'F'), createMockMovie(7, 'G'), createMockMovie(8, 'H')],
          connectionType: 'director',
          connectionValue: 'Director 2',
          category: 'crew',
          verificationType: 'director',
          verificationParams: { personId: 2 },
        }),
        // One title group
        generator.formatDeterministicGroup({
          films: [createMockMovie(9, 'Red A'), createMockMovie(10, 'Red B'), createMockMovie(11, 'Red C'), createMockMovie(12, 'Red D')],
          connectionType: 'title-colors',
          connectionValue: 'Color "red" in title',
          category: 'title',
          verificationType: 'title-contains',
          verificationParams: { substring: 'red' },
        }),
        // One actor group
        generator.formatDeterministicGroup({
          films: [createMockMovie(13, 'I'), createMockMovie(14, 'J'), createMockMovie(15, 'K'), createMockMovie(16, 'L')],
          connectionType: 'actor',
          connectionValue: 'Actor 1',
          category: 'cast',
          verificationType: 'actor',
          verificationParams: { personId: 100 },
        }),
      ];

      const selected = generator.selectBestGroups(groups, 3);

      // Should prefer diversity - one from each category
      const categories = selected.map((g) => g.category);
      expect(new Set(categories).size).toBeGreaterThanOrEqual(2);
    });

    it('respects maximum group count', () => {
      const generator = new HybridGroupGenerator();

      const groups = Array.from({ length: 10 }, (_, i) =>
        generator.formatDeterministicGroup({
          films: [
            createMockMovie(i * 4 + 1, 'A'),
            createMockMovie(i * 4 + 2, 'B'),
            createMockMovie(i * 4 + 3, 'C'),
            createMockMovie(i * 4 + 4, 'D'),
          ],
          connectionType: 'director',
          connectionValue: `Director ${i}`,
          category: 'crew',
          verificationType: 'director',
          verificationParams: { personId: i },
        })
      );

      const selected = generator.selectBestGroups(groups, 4);

      expect(selected).toHaveLength(4);
    });
  });
});
