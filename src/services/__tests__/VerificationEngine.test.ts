/**
 * VerificationEngine Tests
 *
 * TDD tests for the VerificationEngine that validates
 * AI-suggested connections against actual film data.
 */

import { describe, it, expect } from 'vitest';
import { VerificationEngine } from '../VerificationEngine';
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
  overview: `A thrilling adventure about ${title.toLowerCase()}`,
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

describe('VerificationEngine', () => {
  const engine = new VerificationEngine();

  describe('overview-keywords verification', () => {
    it('passes when keyword is found in overview', () => {
      const films = [
        createMockMovie(1, 'Test Movie', { overview: 'A story about revenge and betrayal' }),
      ];

      const result = engine.verify(
        'Films about revenge',
        'overview-keywords',
        { keywords: ['revenge'] },
        films
      );

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('passes when ANY keyword matches (OR logic)', () => {
      const films = [
        createMockMovie(1, 'Test Movie', { overview: 'A love story in Paris' }),
      ];

      const result = engine.verify(
        'Films about love or war',
        'overview-keywords',
        { keywords: ['love', 'war', 'death'] },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when no keywords match', () => {
      const films = [
        createMockMovie(1, 'Test Movie', { overview: 'A comedy about friendship' }),
      ];

      const result = engine.verify(
        'Films about revenge',
        'overview-keywords',
        { keywords: ['revenge', 'betrayal'] },
        films
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Test Movie');
    });

    it('is case-insensitive', () => {
      const films = [
        createMockMovie(1, 'Test', { overview: 'A tale of REVENGE' }),
      ];

      const result = engine.verify(
        'Films about revenge',
        'overview-keywords',
        { keywords: ['revenge'] },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('with requireAll=true, requires ALL keywords to match', () => {
      const films = [
        createMockMovie(1, 'Test', { overview: 'A story about revenge and betrayal' }),
      ];

      const result = engine.verify(
        'Films about revenge and betrayal',
        'overview-keywords',
        { keywords: ['revenge', 'betrayal'], requireAll: true },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('with requireAll=true, fails if any keyword missing', () => {
      const films = [
        createMockMovie(1, 'Test', { overview: 'A story about revenge' }),
      ];

      const result = engine.verify(
        'Films about revenge and betrayal',
        'overview-keywords',
        { keywords: ['revenge', 'betrayal'], requireAll: true },
        films
      );

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('betrayal');
    });
  });

  describe('title-contains verification', () => {
    it('passes when substring is found in title', () => {
      const films = [createMockMovie(1, 'The Dark Knight')];

      const result = engine.verify(
        'Films with "Dark" in title',
        'title-contains',
        { substring: 'Dark' },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when substring not found', () => {
      const films = [createMockMovie(1, 'The Matrix')];

      const result = engine.verify(
        'Films with "Dark" in title',
        'title-contains',
        { substring: 'Dark' },
        films
      );

      expect(result.valid).toBe(false);
    });

    it('is case-insensitive', () => {
      const films = [createMockMovie(1, 'THE DARK KNIGHT')];

      const result = engine.verify(
        'Films with "dark" in title',
        'title-contains',
        { substring: 'dark' },
        films
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('title-pattern verification', () => {
    it('passes when title matches regex pattern', () => {
      const films = [
        createMockMovie(1, 'Alien'),
        createMockMovie(2, 'Heat'),
      ];

      const result = engine.verify(
        'One-word titles',
        'title-pattern',
        { pattern: '^\\w+$' },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when title does not match pattern', () => {
      const films = [createMockMovie(1, 'The Dark Knight')];

      const result = engine.verify(
        'One-word titles',
        'title-pattern',
        { pattern: '^\\w+$' },
        films
      );

      expect(result.valid).toBe(false);
    });

    it('handles invalid regex gracefully', () => {
      const films = [createMockMovie(1, 'Test')];

      const result = engine.verify(
        'Invalid pattern',
        'title-pattern',
        { pattern: '[invalid' },
        films
      );

      expect(result.valid).toBe(false);
      expect(result.issues[0]).toContain('Invalid regex');
    });
  });

  describe('genre-includes verification', () => {
    it('passes when film has the genre', () => {
      const films = [
        createMockMovie(1, 'Action Movie', {
          genres: [{ id: 28, name: 'Action' }],
        }),
      ];

      const result = engine.verify(
        'Action films',
        'genre-includes',
        { genreId: 28 },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when film lacks the genre', () => {
      const films = [
        createMockMovie(1, 'Drama Movie', {
          genres: [{ id: 18, name: 'Drama' }],
        }),
      ];

      const result = engine.verify(
        'Action films',
        'genre-includes',
        { genreId: 28 },
        films
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('director verification', () => {
    it('passes when film has the director', () => {
      const films = [
        createMockMovie(1, 'Test', {
          credits: {
            cast: [],
            crew: [{ id: 525, name: 'Christopher Nolan', job: 'Director', department: 'Directing' }],
          },
        }),
      ];

      const result = engine.verify(
        'Directed by Christopher Nolan',
        'director',
        { personId: 525 },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when director ID does not match', () => {
      const films = [
        createMockMovie(1, 'Test', {
          credits: {
            cast: [],
            crew: [{ id: 100, name: 'Other Director', job: 'Director', department: 'Directing' }],
          },
        }),
      ];

      const result = engine.verify(
        'Directed by Christopher Nolan',
        'director',
        { personId: 525 },
        films
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('actor verification', () => {
    it('passes when film has the actor', () => {
      const films = [
        createMockMovie(1, 'Test', {
          credits: {
            cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
      ];

      const result = engine.verify(
        'Starring Leonardo DiCaprio',
        'actor',
        { personId: 6193 },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when actor ID does not match', () => {
      const films = [
        createMockMovie(1, 'Test', {
          credits: {
            cast: [{ id: 1, name: 'Other Actor', character: 'Lead', order: 0 }],
            crew: [],
          },
        }),
      ];

      const result = engine.verify(
        'Starring Leonardo DiCaprio',
        'actor',
        { personId: 6193 },
        films
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('decade verification', () => {
    it('passes when film is from correct decade', () => {
      const films = [
        createMockMovie(1, 'Test', { release_date: '1985-06-15' }),
      ];

      const result = engine.verify(
        '1980s films',
        'decade',
        { decade: 1980 },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when film is from different decade', () => {
      const films = [
        createMockMovie(1, 'Test', { release_date: '1995-06-15' }),
      ];

      const result = engine.verify(
        '1980s films',
        'decade',
        { decade: 1980 },
        films
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('year-range verification', () => {
    it('passes when film is within range', () => {
      const films = [
        createMockMovie(1, 'Test', { release_date: '2005-06-15' }),
      ];

      const result = engine.verify(
        'Films from 2000-2010',
        'year-range',
        { minYear: 2000, maxYear: 2010 },
        films
      );

      expect(result.valid).toBe(true);
    });

    it('fails when film is outside range', () => {
      const films = [
        createMockMovie(1, 'Test', { release_date: '2015-06-15' }),
      ];

      const result = engine.verify(
        'Films from 2000-2010',
        'year-range',
        { minYear: 2000, maxYear: 2010 },
        films
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('multiple films validation', () => {
    it('passes only when ALL films match', () => {
      const films = [
        createMockMovie(1, 'Red Dawn', { overview: 'A story of survival' }),
        createMockMovie(2, 'The Red Tent', { overview: 'Arctic survival tale' }),
        createMockMovie(3, 'Red October', { overview: 'Submarine survival' }),
        createMockMovie(4, 'Red Dragon', { overview: 'A survival thriller' }),
      ];

      const result = engine.verify(
        'Films with "Red" in title',
        'title-contains',
        { substring: 'Red' },
        films
      );

      expect(result.valid).toBe(true);
      expect(result.filmResults.every((r) => r.passed)).toBe(true);
    });

    it('fails when any film does not match', () => {
      const films = [
        createMockMovie(1, 'Red Dawn'),
        createMockMovie(2, 'The Matrix'), // Does not have "Red"
        createMockMovie(3, 'Red October'),
      ];

      const result = engine.verify(
        'Films with "Red" in title',
        'title-contains',
        { substring: 'Red' },
        films
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toContain('Matrix');
    });

    it('reports all failing films', () => {
      const films = [
        createMockMovie(1, 'The Matrix'),
        createMockMovie(2, 'Inception'),
        createMockMovie(3, 'Red Dawn'),
      ];

      const result = engine.verify(
        'Films with "Red" in title',
        'title-contains',
        { substring: 'Red' },
        films
      );

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(2);
    });
  });
});
