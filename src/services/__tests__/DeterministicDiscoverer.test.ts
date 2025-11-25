/**
 * DeterministicDiscoverer Tests
 *
 * TDD tests for finding guaranteed-valid connection groups
 * from a pool of films without relying on AI.
 */

import { describe, it, expect } from 'vitest';
import { DeterministicDiscoverer } from '../DeterministicDiscoverer';
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

describe('DeterministicDiscoverer', () => {
  const discoverer = new DeterministicDiscoverer();

  describe('findDirectorGroups', () => {
    it('finds groups of 4+ films by the same director', () => {
      const films = [
        createMockMovie(1, 'Film A', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(2, 'Film B', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(3, 'Film C', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(4, 'Film D', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(5, 'Film E', {
          credits: {
            cast: [],
            crew: [{ id: 999, name: 'Other Director', job: 'Director', department: 'Directing' }],
          },
        }),
      ];

      const groups = discoverer.findDirectorGroups(films);

      expect(groups.length).toBe(1);
      expect(groups[0].films).toHaveLength(4);
      expect(groups[0].connectionValue).toBe('Christopher Nolan');
      expect(groups[0].category).toBe('crew');
      expect(groups[0].verificationType).toBe('director');
      expect(groups[0].verificationParams.personId).toBe(525);
    });

    it('returns empty array when no director has 4+ films', () => {
      const films = [
        createMockMovie(1, 'Film A', {
          credits: {
            cast: [],
            crew: [{ id: 1, name: 'Director 1', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(2, 'Film B', {
          credits: {
            cast: [],
            crew: [{ id: 2, name: 'Director 2', job: 'Director', department: 'Directing' }],
          },
        }),
      ];

      const groups = discoverer.findDirectorGroups(films);

      expect(groups).toHaveLength(0);
    });

    it('creates multiple groups if director has 8+ films', () => {
      const films = Array.from({ length: 8 }, (_, i) =>
        createMockMovie(i + 1, `Film ${i + 1}`, {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        })
      );

      const groups = discoverer.findDirectorGroups(films);

      expect(groups.length).toBe(2);
      expect(groups[0].films).toHaveLength(4);
      expect(groups[1].films).toHaveLength(4);
    });
  });

  describe('findActorGroups', () => {
    it('finds groups of 4+ films with the same actor', () => {
      const films = [
        createMockMovie(1, 'Film A', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
        createMockMovie(2, 'Film B', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
        createMockMovie(3, 'Film C', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
        createMockMovie(4, 'Film D', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
      ];

      const groups = discoverer.findActorGroups(films);

      expect(groups.length).toBe(1);
      expect(groups[0].films).toHaveLength(4);
      expect(groups[0].connectionValue).toBe('Leonardo DiCaprio');
      expect(groups[0].category).toBe('cast');
      expect(groups[0].verificationType).toBe('actor');
      expect(groups[0].verificationParams.personId).toBe(6193);
    });

    it('only considers top-billed actors (order < 5)', () => {
      const films = [
        createMockMovie(1, 'Film A', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cameo', order: 10 }],
            crew: [],
          },
        }),
        createMockMovie(2, 'Film B', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cameo', order: 10 }],
            crew: [],
          },
        }),
        createMockMovie(3, 'Film C', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cameo', order: 10 }],
            crew: [],
          },
        }),
        createMockMovie(4, 'Film D', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cameo', order: 10 }],
            crew: [],
          },
        }),
      ];

      const groups = discoverer.findActorGroups(films);

      expect(groups).toHaveLength(0);
    });
  });

  describe('findTitlePatternGroups', () => {
    it('finds films with colors in titles', () => {
      const films = [
        createMockMovie(1, 'The Red Dragon'),
        createMockMovie(2, 'Red Dawn'),
        createMockMovie(3, 'Seeing Red'),
        createMockMovie(4, 'Red October'),
        createMockMovie(5, 'Blue Velvet'),
        createMockMovie(6, 'The Matrix'),
      ];

      const groups = discoverer.findTitlePatternGroups(films);
      const redGroup = groups.find((g) => g.connectionValue.toLowerCase().includes('red'));

      expect(redGroup).toBeDefined();
      expect(redGroup!.films).toHaveLength(4);
      expect(redGroup!.category).toBe('title');
      expect(redGroup!.verificationType).toBe('title-contains');
    });

    it('finds films with numbers in titles', () => {
      const films = [
        createMockMovie(1, 'Seven Samurai'),
        createMockMovie(2, 'The Magnificent Seven'),
        createMockMovie(3, 'Seven Pounds'),
        createMockMovie(4, 'Se7en'), // Contains "seven" when we search
        createMockMovie(5, 'The Seven Year Itch'),
        createMockMovie(6, 'The Matrix'),
      ];

      const groups = discoverer.findTitlePatternGroups(films);
      const sevenGroup = groups.find((g) => g.connectionValue.toLowerCase().includes('seven'));

      expect(sevenGroup).toBeDefined();
      expect(sevenGroup!.films).toHaveLength(4);
    });

    it('finds films with animals in titles', () => {
      const films = [
        createMockMovie(1, 'Lone Wolf'),
        createMockMovie(2, 'Teen Wolf'),
        createMockMovie(3, 'Wolf of Wall Street'),
        createMockMovie(4, 'Werewolf'),
        createMockMovie(5, 'The Matrix'),
      ];

      const groups = discoverer.findTitlePatternGroups(films);
      const wolfGroup = groups.find((g) => g.connectionValue.toLowerCase().includes('wolf'));

      expect(wolfGroup).toBeDefined();
      expect(wolfGroup!.films).toHaveLength(4);
      expect(wolfGroup!.category).toBe('title');
    });
  });

  describe('findGenreGroups', () => {
    it('finds films sharing the same genre combination', () => {
      const films = [
        createMockMovie(1, 'Film A', { genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }] }),
        createMockMovie(2, 'Film B', { genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }] }),
        createMockMovie(3, 'Film C', { genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }] }),
        createMockMovie(4, 'Film D', { genres: [{ id: 28, name: 'Action' }, { id: 53, name: 'Thriller' }] }),
        createMockMovie(5, 'Film E', { genres: [{ id: 35, name: 'Comedy' }] }),
      ];

      const groups = discoverer.findGenreGroups(films);

      expect(groups.length).toBeGreaterThanOrEqual(1);
      expect(groups[0].films).toHaveLength(4);
      expect(groups[0].category).toBe('plot'); // Genre fits under plot category
    });
  });

  describe('discoverAll', () => {
    it('returns combined groups from all discoverers', () => {
      const films = [
        // 4 Nolan films
        createMockMovie(1, 'Inception', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cobb', order: 0 }],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(2, 'Interstellar', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(3, 'Dunkirk', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        createMockMovie(4, 'Tenet', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
        // 4 films with "Red" in title
        createMockMovie(5, 'Red Dawn'),
        createMockMovie(6, 'Red Dragon'),
        createMockMovie(7, 'The Red Tent'),
        createMockMovie(8, 'Red October'),
      ];

      const allGroups = discoverer.discoverAll(films);

      expect(allGroups.length).toBeGreaterThanOrEqual(2); // At least director + title groups
    });

    it('limits total groups returned', () => {
      const films = Array.from({ length: 100 }, (_, i) =>
        createMockMovie(i + 1, `Film ${i + 1}`, {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        })
      );

      const allGroups = discoverer.discoverAll(films, { maxGroups: 5 });

      expect(allGroups.length).toBeLessThanOrEqual(5);
    });
  });
});
