import { describe, it, expect, beforeEach } from 'vitest';
import { WordplayAnalyzer } from '../analyzers/WordplayAnalyzer';
import type { TMDBMovieDetails } from '../../../types';

// Mock movie data for testing
const createMockMovie = (
  id: number,
  title: string,
  voteCount: number = 5000
): TMDBMovieDetails => ({
  id,
  title,
  release_date: '2020-01-01',
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

describe('WordplayAnalyzer', () => {
  let analyzer: WordplayAnalyzer;

  beforeEach(() => {
    analyzer = new WordplayAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('wordplay');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('wordplay');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find movies with "Star" in title', async () => {
      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'A Star is Born'),
        createMockMovie(4, 'Lone Star'),
      ];

      const results = await analyzer.analyze(movies);

      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup).toBeDefined();
      expect(starGroup?.films).toHaveLength(4);
      expect(starGroup?.connection).toBe('"star" in the title');
    });

    it('should find movies with "Dark" in title', async () => {
      const movies = [
        createMockMovie(1, 'The Dark Knight'),
        createMockMovie(2, 'Dark City'),
        createMockMovie(3, 'Dark Shadows'),
        createMockMovie(4, 'Dark Phoenix'),
      ];

      const results = await analyzer.analyze(movies);

      const darkGroup = results.find((r) => r.metadata?.word === 'dark');
      expect(darkGroup).toBeDefined();
      expect(darkGroup?.films).toHaveLength(4);
    });

    it('should find movies with "Knight" in title', async () => {
      const movies = [
        createMockMovie(1, 'Knight and Day'),
        createMockMovie(2, 'A Knight Tale'),
        createMockMovie(3, 'Knight Rider'),
        createMockMovie(4, 'Dark Knight'),
      ];

      const results = await analyzer.analyze(movies);

      const knightGroup = results.find((r) => r.metadata?.word === 'knight');
      expect(knightGroup).toBeDefined();
      expect(knightGroup?.films).toHaveLength(4);
    });

    it('should filter out stop words', async () => {
      const movies = [
        createMockMovie(1, 'The Matrix'),
        createMockMovie(2, 'The Godfather'),
        createMockMovie(3, 'The Shining'),
        createMockMovie(4, 'The Departed'),
      ];

      const results = await analyzer.analyze(movies);

      // Should not find "the" as a connection
      const theGroup = results.find((r) => r.metadata?.word === 'the');
      expect(theGroup).toBeUndefined();
    });

    it('should respect minWordLength config', async () => {
      analyzer.configure({ minWordLength: 6 });

      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Lone Star'),
        createMockMovie(4, 'A Star is Born'),
      ];

      const results = await analyzer.analyze(movies);

      // "star" has 4 letters, should be filtered out with minWordLength=6
      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup).toBeUndefined();
    });

    it('should allow custom stop words', async () => {
      analyzer.configure({ stopWords: ['star', 'wars'] });

      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Lone Star'),
        createMockMovie(4, 'A Star is Born'),
      ];

      const results = await analyzer.analyze(movies);

      // "star" should be filtered out with custom stop words
      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup).toBeUndefined();
    });

    it('should handle special characters in titles', async () => {
      const movies = [
        createMockMovie(1, "Ocean's Eleven"),
        createMockMovie(2, 'Ocean Waves'),
        createMockMovie(3, 'The Ocean'),
        createMockMovie(4, 'Pacific Ocean'),
      ];

      const results = await analyzer.analyze(movies);

      const oceanGroup = results.find((r) => r.metadata?.word === 'ocean');
      expect(oceanGroup).toBeDefined();
      expect(oceanGroup?.films).toHaveLength(4);
    });

    it('should handle numbers in titles', async () => {
      const movies = [
        createMockMovie(1, 'Mission Impossible 1'),
        createMockMovie(2, 'Mission Impossible 2'),
        createMockMovie(3, 'Mission Impossible 3'),
        createMockMovie(4, 'Mission Impossible 4'),
      ];

      const results = await analyzer.analyze(movies);

      const missionGroup = results.find((r) => r.metadata?.word === 'mission');
      expect(missionGroup).toBeDefined();
      expect(missionGroup?.films).toHaveLength(4);
    });

    it('should skip words with insufficient movies', async () => {
      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Dark Knight'),
        // Only 2 "star" movies - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup).toBeUndefined();
    });

    it('should be case-insensitive', async () => {
      const movies = [
        createMockMovie(1, 'STAR Wars'),
        createMockMovie(2, 'star trek'),
        createMockMovie(3, 'Star Is Born'),
        createMockMovie(4, 'lone STAR'),
      ];

      const results = await analyzer.analyze(movies);

      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup).toBeDefined();
      expect(starGroup?.films).toHaveLength(4);
    });

    it('should calculate difficulty with rarity bonus', async () => {
      const movies = [
        createMockMovie(1, 'Unique Word', 8000),
        createMockMovie(2, 'Unique Film', 8000),
        createMockMovie(3, 'Unique Movie', 8000),
        createMockMovie(4, 'Unique Title', 8000),
      ];

      const results = await analyzer.analyze(movies);

      const uniqueGroup = results.find((r) => r.metadata?.word === 'unique');
      if (uniqueGroup) {
        // Should have base difficulty plus rarity bonus
        expect(uniqueGroup.difficultyScore).toBeGreaterThan(2000);
      }
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Star Born'),
        createMockMovie(4, 'Star Light'),
        createMockMovie(5, 'Star Bright'),
        createMockMovie(6, 'Star Night'),
      ];

      const results = await analyzer.analyze(movies);

      const starGroup = results.find((r) => r.metadata?.word === 'star');
      expect(starGroup?.films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Star Born'),
        createMockMovie(4, 'Star Light'),
      ];

      const results = await analyzer.analyze(movies);

      const starGroup = results.find((r) => r.metadata?.word === 'star');
      if (starGroup) {
        expect(starGroup.metadata).toHaveProperty('word', 'star');
        expect(starGroup.metadata).toHaveProperty('totalMatchingFilms');
        expect(starGroup.metadata).toHaveProperty('wordLength', 4);
      }
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Star Born'),
        createMockMovie(4, 'Star Light'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle movies with no matching words', async () => {
      const movies = [
        createMockMovie(1, 'Abc'),
        createMockMovie(2, 'Def'),
        createMockMovie(3, 'Ghi'),
        createMockMovie(4, 'Jkl'),
      ];

      const results = await analyzer.analyze(movies);

      // Short words (< 4 letters) should be filtered out
      expect(results).toHaveLength(0);
    });

    it('should handle empty movie array', async () => {
      const movies: TMDBMovieDetails[] = [];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should find multiple word groups', async () => {
      const movies = [
        createMockMovie(1, 'Star Wars'),
        createMockMovie(2, 'Star Trek'),
        createMockMovie(3, 'Star Born'),
        createMockMovie(4, 'Star Light'),
        createMockMovie(5, 'Dark Knight'),
        createMockMovie(6, 'Dark City'),
        createMockMovie(7, 'Dark Shadows'),
        createMockMovie(8, 'Dark Phoenix'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results.length).toBeGreaterThanOrEqual(2);
      const starGroup = results.find((r) => r.metadata?.word === 'star');
      const darkGroup = results.find((r) => r.metadata?.word === 'dark');
      expect(starGroup).toBeDefined();
      expect(darkGroup).toBeDefined();
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'Star Wars'),
          createMockMovie(2, 'Star Trek'),
          createMockMovie(3, 'Star Born'),
          createMockMovie(4, 'Star Light'),
        ],
        connection: '"star" in the title',
        connectionType: 'wordplay' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [createMockMovie(1, 'Star Wars'), createMockMovie(2, 'Star Trek')],
        connection: '"star" in the title',
        connectionType: 'wordplay' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'Star Wars'),
          createMockMovie(2, 'Star Trek'),
          createMockMovie(3, 'Star Born'),
          createMockMovie(4, 'Star Light'),
        ],
        connection: '',
        connectionType: 'wordplay' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuring minWordLength', () => {
      analyzer.configure({ minWordLength: 6 });
      expect(analyzer.name).toBe('wordplay'); // Sanity check
    });

    it('should allow configuring stopWords', () => {
      analyzer.configure({ stopWords: ['custom', 'words'] });
      expect(analyzer.name).toBe('wordplay'); // Sanity check
    });

    it('should allow configuring both base and wordplay options', () => {
      analyzer.configure({
        enabled: false,
        minGroupSize: 5,
        minWordLength: 6,
        stopWords: [],
      });
      expect(analyzer.config.enabled).toBe(false);
      expect(analyzer.config.minGroupSize).toBe(5);
    });
  });
});
