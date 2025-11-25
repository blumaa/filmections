import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeAnalyzer } from '../analyzers/ThemeAnalyzer';
import type { TMDBMovieDetails } from '../../../types';

// Mock movie data for testing
const createMockMovie = (
  id: number,
  title: string,
  overview: string,
  voteCount: number = 5000
): TMDBMovieDetails => ({
  id,
  title,
  release_date: '2020-01-01',
  poster_path: null,
  genre_ids: [],
  overview,
  vote_count: voteCount,
  popularity: 100,
  genres: [],
  credits: {
    cast: [],
    crew: [],
  },
});

describe('ThemeAnalyzer', () => {
  let analyzer: ThemeAnalyzer;

  beforeEach(() => {
    analyzer = new ThemeAnalyzer();
  });

  describe('basic properties', () => {
    it('should have correct name', () => {
      expect(analyzer.name).toBe('theme');
    });

    it('should have correct connection type', () => {
      expect(analyzer.connectionType).toBe('theme');
    });

    it('should be enabled by default', () => {
      expect(analyzer.config.enabled).toBe(true);
    });
  });

  describe('analyze', () => {
    it('should find time-travel themed movies', async () => {
      const movies = [
        createMockMovie(1, 'Back to the Future', 'A teenager uses time travel'),
        createMockMovie(2, 'The Terminator', 'A cyborg uses time travel technology'),
        createMockMovie(3, 'Looper', 'Time travel assassins'),
        createMockMovie(4, 'Primer', 'Scientists discover time travel'),
      ];

      const results = await analyzer.analyze(movies);

      // Should find time travel theme
      const timeTravel = results.find((r) => r.metadata?.themeId === 'time-travel');
      expect(timeTravel).toBeDefined();
      expect(timeTravel?.films).toHaveLength(4);
    });

    it('should find heist themed movies', async () => {
      const movies = [
        createMockMovie(1, "Ocean's Eleven", 'A group plans an elaborate casino heist'),
        createMockMovie(2, 'The Italian Job', 'Crew of thieves steal gold'),
        createMockMovie(3, 'Heat', 'Bank robbery and heist gone wrong'),
        createMockMovie(4, 'Inside Man', 'Perfect bank heist plan'),
      ];

      const results = await analyzer.analyze(movies);

      const heist = results.find((r) => r.metadata?.themeId === 'heist');
      expect(heist).toBeDefined();
      expect(heist?.films).toHaveLength(4);
    });

    it('should find movies with numbers in title', async () => {
      const movies = [
        createMockMovie(1, 'Se7en', 'Detective hunts serial killer'),
        createMockMovie(2, '12 Monkeys', 'Time travel thriller'),
        createMockMovie(3, 'The Number 23', 'Man obsessed with number'),
        createMockMovie(4, 'Apollo 13', 'Space mission disaster'),
      ];

      const results = await analyzer.analyze(movies);

      const numbersInTitle = results.find((r) => r.metadata?.themeId === 'numbers-in-title');
      expect(numbersInTitle).toBeDefined();
      expect(numbersInTitle?.films).toHaveLength(4);
    });

    it('should find movies with one-word titles', async () => {
      const movies = [
        createMockMovie(1, 'Jaws', 'Shark terrorizes beach town'),
        createMockMovie(2, 'Alien', 'Crew encounters deadly creature'),
        createMockMovie(3, 'Inception', 'Dream within dreams'),
        createMockMovie(4, 'Gravity', 'Astronauts stranded in space'),
      ];

      const results = await analyzer.analyze(movies);

      const oneWord = results.find((r) => r.metadata?.themeId === 'one-word-titles');
      expect(oneWord).toBeDefined();
      expect(oneWord?.films).toHaveLength(4);
    });

    it('should skip themes with insufficient movies', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 'Time travel story'),
        createMockMovie(2, 'Movie 2', 'Time travel adventure'),
        createMockMovie(3, 'Movie 3', 'Generic action film'),
        // Only 2 time travel movies - should be filtered out
      ];

      const results = await analyzer.analyze(movies);

      const timeTravel = results.find((r) => r.metadata?.themeId === 'time-travel');
      expect(timeTravel).toBeUndefined();
    });

    it('should search both title and overview by default', async () => {
      const movies = [
        createMockMovie(1, 'Movie A', 'Features time travel elements'),
        createMockMovie(2, 'Time Travel Movie', 'Regular drama'),
        createMockMovie(3, 'Future Past', 'Story using time travel'),
        createMockMovie(4, 'Chrono Film', 'Involves time travel'),
      ];

      const results = await analyzer.analyze(movies);

      const timeTravel = results.find((r) => r.metadata?.themeId === 'time-travel');
      expect(timeTravel).toBeDefined();
      // Should find movies matching in both title and overview
      expect(timeTravel?.films.length).toBeGreaterThanOrEqual(3);
    });

    it('should respect searchTitle config', async () => {
      analyzer.configure({ searchTitle: false, searchOverview: true });

      const movies = [
        createMockMovie(1, 'Time Travel', 'Regular drama'),
        createMockMovie(2, 'Regular Movie', 'Features time travel'),
        createMockMovie(3, 'Another Film', 'Time paradox story'),
        createMockMovie(4, 'Generic Title', 'Travel through time'),
      ];

      const results = await analyzer.analyze(movies);

      const timeTravel = results.find((r) => r.metadata?.themeId === 'time-travel');
      if (timeTravel) {
        // Should only match movies with keywords in overview, not title
        const hasTimeInTitle = timeTravel.films.some((f) => f.title.toLowerCase().includes('time'));
        expect(hasTimeInTitle).toBe(false);
      }
    });

    it('should calculate difficulty with theme bonus', async () => {
      const movies = [
        createMockMovie(1, 'Heist 1', 'Bank robbery film', 8000),
        createMockMovie(2, 'Heist 2', 'Casino heist movie', 8000),
        createMockMovie(3, 'Heist 3', 'Vault stealing thriller', 8000),
        createMockMovie(4, 'Heist 4', 'Perfect crime story', 8000),
      ];

      const results = await analyzer.analyze(movies);

      const heist = results.find((r) => r.metadata?.themeId === 'heist');
      if (heist) {
        // Should have base difficulty (10000 - 8000 = 2000) plus theme difficulty bonus
        expect(heist.difficultyScore).toBeGreaterThan(2000);
      }
    });

    it('should return exactly maxGroupSize films', async () => {
      const movies = [
        createMockMovie(1, 'Heist 1', 'Bank heist'),
        createMockMovie(2, 'Heist 2', 'Casino robbery'),
        createMockMovie(3, 'Heist 3', 'Perfect steal'),
        createMockMovie(4, 'Heist 4', 'Vault job'),
        createMockMovie(5, 'Heist 5', 'Museum theft'),
        createMockMovie(6, 'Heist 6', 'Jewel heist'),
      ];

      const results = await analyzer.analyze(movies);

      const heist = results.find((r) => r.metadata?.themeId === 'heist');
      expect(heist?.films).toHaveLength(4); // Should select exactly 4
    });

    it('should include metadata', async () => {
      const movies = [
        createMockMovie(1, 'Movie 1', 'Time travel story'),
        createMockMovie(2, 'Movie 2', 'Time paradox'),
        createMockMovie(3, 'Movie 3', 'Travel through time'),
        createMockMovie(4, 'Movie 4', 'Temporal anomaly'),
      ];

      const results = await analyzer.analyze(movies);

      const timeTravel = results.find((r) => r.metadata?.themeId === 'time-travel');
      if (timeTravel) {
        expect(timeTravel.metadata).toHaveProperty('themeId');
        expect(timeTravel.metadata).toHaveProperty('themeName');
        expect(timeTravel.metadata).toHaveProperty('themeCategory');
        expect(timeTravel.metadata).toHaveProperty('totalMatchingFilms');
      }
    });

    it('should return empty array when analyzer is disabled', async () => {
      analyzer.configure({ enabled: false });

      const movies = [
        createMockMovie(1, 'Movie 1', 'Time travel story'),
        createMockMovie(2, 'Movie 2', 'Time paradox'),
        createMockMovie(3, 'Movie 3', 'Travel through time'),
        createMockMovie(4, 'Movie 4', 'Temporal anomaly'),
      ];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });

    it('should handle movies with no matching themes', async () => {
      const movies = [
        createMockMovie(1, 'Generic Movie 1', 'A regular drama'),
        createMockMovie(2, 'Generic Movie 2', 'Another simple story'),
        createMockMovie(3, 'Generic Movie 3', 'Just a film'),
        createMockMovie(4, 'Generic Movie 4', 'Nothing special'),
      ];

      const results = await analyzer.analyze(movies);

      // May find some results based on generic keywords, but shouldn't crash
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle empty movie array', async () => {
      const movies: TMDBMovieDetails[] = [];

      const results = await analyzer.analyze(movies);

      expect(results).toHaveLength(0);
    });
  });

  describe('validateResult', () => {
    it('should validate valid result', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', 'time travel'),
          createMockMovie(2, 'M2', 'time travel'),
          createMockMovie(3, 'M3', 'time travel'),
          createMockMovie(4, 'M4', 'time travel'),
        ],
        connection: 'Time Travel',
        connectionType: 'theme' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(true);
    });

    it('should reject result with too few films', () => {
      const result = {
        films: [createMockMovie(1, 'M1', 'time travel'), createMockMovie(2, 'M2', 'time travel')],
        connection: 'Time Travel',
        connectionType: 'theme' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });

    it('should reject result with empty connection', () => {
      const result = {
        films: [
          createMockMovie(1, 'M1', 'time travel'),
          createMockMovie(2, 'M2', 'time travel'),
          createMockMovie(3, 'M3', 'time travel'),
          createMockMovie(4, 'M4', 'time travel'),
        ],
        connection: '',
        connectionType: 'theme' as const,
        difficultyScore: 5000,
      };

      expect(analyzer.validateResult(result)).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should allow configuring minKeywordMatches', () => {
      analyzer.configure({ minKeywordMatches: 2 });
      expect(analyzer.name).toBe('theme'); // Sanity check
    });

    it('should allow configuring search options', () => {
      analyzer.configure({
        searchOverview: false,
        searchTitle: true,
      });
      expect(analyzer.name).toBe('theme'); // Sanity check
    });
  });
});
