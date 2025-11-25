import { describe, it, expect, beforeEach } from 'vitest';
import { QualityScorer } from '../validators/QualityScorer';
import type { AnalyzerResult } from '../types';
import type { TMDBMovieDetails } from '../../../types';

// Helper to create mock movies
const createMockMovie = (
  id: number,
  title: string,
  releaseDate: string = '2020-01-01',
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
  credits: { cast: [], crew: [] },
});

// Helper to create mock analyzer result
const createMockResult = (
  films: TMDBMovieDetails[],
  connection: string,
  connectionType: string,
  difficultyScore: number = 5000
): AnalyzerResult => ({
  films,
  connection,
  connectionType,
  difficultyScore,
});

describe('QualityScorer', () => {
  let scorer: QualityScorer;

  beforeEach(() => {
    scorer = new QualityScorer();
  });

  describe('basic functionality', () => {
    it('should create scorer with default config', () => {
      const config = scorer.getConfig();
      expect(config.minScore).toBe(35);
      expect(config.requireNoOverlap).toBe(true);
    });

    it('should allow custom configuration', () => {
      const customScorer = new QualityScorer({ minScore: 50 });
      const config = customScorer.getConfig();
      expect(config.minScore).toBe(50);
    });

    it('should allow updating configuration', () => {
      scorer.configure({ minScore: 40 });
      const config = scorer.getConfig();
      expect(config.minScore).toBe(40);
    });
  });

  describe('scoring', () => {
    it('should score a high-quality puzzle', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [
            createMockMovie(1, 'Movie 1', '1980-01-01', 8000),
            createMockMovie(2, 'Movie 2', '1981-01-01', 7000),
            createMockMovie(3, 'Movie 3', '1982-01-01', 6000),
            createMockMovie(4, 'Movie 4', '1983-01-01', 5000),
          ],
          'Directed by Christopher Nolan',
          'director',
          2000
        ),
        createMockResult(
          [
            createMockMovie(5, 'Movie 5', '1990-01-01', 8000),
            createMockMovie(6, 'Movie 6', '1991-01-01', 7000),
            createMockMovie(7, 'Movie 7', '1992-01-01', 6000),
            createMockMovie(8, 'Movie 8', '1993-01-01', 5000),
          ],
          'Films from 1999',
          'year',
          5000
        ),
        createMockResult(
          [
            createMockMovie(9, 'Movie 9', '2000-01-01', 4000),
            createMockMovie(10, 'Movie 10', '2001-01-01', 3000),
            createMockMovie(11, 'Movie 11', '2002-01-01', 2000),
            createMockMovie(12, 'Movie 12', '2003-01-01', 1000),
          ],
          '"dark" in the title',
          'wordplay',
          7000
        ),
        createMockResult(
          [
            createMockMovie(13, 'Movie 13', '2010-01-01', 9000),
            createMockMovie(14, 'Movie 14', '2011-01-01', 8000),
            createMockMovie(15, 'Movie 15', '2012-01-01', 7000),
            createMockMovie(16, 'Movie 16', '2013-01-01', 6000),
          ],
          'Heist films',
          'theme',
          9000
        ),
      ];

      const metrics = scorer.score(groups);

      expect(metrics.overlapPassed).toBe(true);
      expect(metrics.overallScore).toBeGreaterThan(35);
      expect(metrics.meetsThreshold).toBe(true);
    });

    it('should fail puzzle with film overlap', () => {
      const sharedMovie = createMockMovie(1, 'Shared Movie');

      const groups: AnalyzerResult[] = [
        createMockResult(
          [sharedMovie, createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Group 1',
          'director',
          5000
        ),
        createMockResult(
          [sharedMovie, createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7')],
          'Group 2',
          'actor',
          5000
        ),
        createMockResult(
          [createMockMovie(8, 'M8'), createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11')],
          'Group 3',
          'theme',
          5000
        ),
        createMockResult(
          [createMockMovie(12, 'M12'), createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15')],
          'Group 4',
          'wordplay',
          5000
        ),
      ];

      const metrics = scorer.score(groups);

      expect(metrics.overlapPassed).toBe(false);
      expect(metrics.overallScore).toBe(0); // Should be zero due to overlap
      expect(metrics.meetsThreshold).toBe(false);
    });

    it('should penalize vague connections', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Similar movies',
          'director',
          5000
        ),
        createMockResult(
          [createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7'), createMockMovie(8, 'M8')],
          'Related',
          'actor',
          5000
        ),
        createMockResult(
          [createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11'), createMockMovie(12, 'M12')],
          'Connected by theme',
          'theme',
          5000
        ),
        createMockResult(
          [createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15'), createMockMovie(16, 'M16')],
          'Share something',
          'wordplay',
          5000
        ),
      ];

      const metrics = scorer.score(groups);

      // Should have lower clarity score due to vague connections
      // Score should not be perfect due to short/vague connections
      expect(metrics.clarityScore).toBeLessThan(9);
    });

    it('should reward good difficulty balance', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Easy Group',
          'director',
          2000 // Q1
        ),
        createMockResult(
          [createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7'), createMockMovie(8, 'M8')],
          'Medium Group',
          'actor',
          5000 // Q2
        ),
        createMockResult(
          [createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11'), createMockMovie(12, 'M12')],
          'Hard Group',
          'theme',
          7000 // Q3
        ),
        createMockResult(
          [createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15'), createMockMovie(16, 'M16')],
          'Hardest Group',
          'wordplay',
          9000 // Q4
        ),
      ];

      const metrics = scorer.score(groups);

      // Should have high difficulty balance score
      expect(metrics.difficultyScore).toBeGreaterThan(7);
    });

    it('should reward connection variety', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Group 1',
          'director',
          5000
        ),
        createMockResult(
          [createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7'), createMockMovie(8, 'M8')],
          'Group 2',
          'actor',
          5000
        ),
        createMockResult(
          [createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11'), createMockMovie(12, 'M12')],
          'Group 3',
          'theme',
          5000
        ),
        createMockResult(
          [createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15'), createMockMovie(16, 'M16')],
          'Group 4',
          'wordplay',
          5000
        ),
      ];

      const metrics = scorer.score(groups);

      // Should have high uniqueness score (all different types)
      expect(metrics.uniquenessScore).toBeGreaterThan(7);
    });

    it('should handle empty groups array', () => {
      const metrics = scorer.score([]);

      expect(metrics.overallScore).toBe(0);
      expect(metrics.meetsThreshold).toBe(false);
    });
  });

  describe('individual validators', () => {
    it('should include all validator scores', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Directed by Nolan',
          'director',
          2000
        ),
        createMockResult(
          [createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7'), createMockMovie(8, 'M8')],
          'Films from 1999',
          'year',
          5000
        ),
        createMockResult(
          [createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11'), createMockMovie(12, 'M12')],
          'Heist theme',
          'theme',
          7000
        ),
        createMockResult(
          [createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15'), createMockMovie(16, 'M16')],
          '"dark" in title',
          'wordplay',
          9000
        ),
      ];

      const metrics = scorer.score(groups);

      expect(metrics).toHaveProperty('clarityScore');
      expect(metrics).toHaveProperty('difficultyScore');
      expect(metrics).toHaveProperty('diversityScore');
      expect(metrics).toHaveProperty('uniquenessScore');
      expect(metrics).toHaveProperty('overlapPassed');
      expect(metrics).toHaveProperty('overallScore');
    });

    it('should include detailed reasons', () => {
      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Group 1',
          'director',
          5000
        ),
      ];

      const metrics = scorer.score(groups);

      expect(metrics.details).toHaveProperty('clarity');
      expect(metrics.details).toHaveProperty('difficulty');
      expect(metrics.details).toHaveProperty('diversity');
      expect(metrics.details).toHaveProperty('uniqueness');
      expect(metrics.details).toHaveProperty('overlap');
    });
  });

  describe('configuration', () => {
    it('should respect custom weights', () => {
      scorer.configure({
        weights: {
          clarity: 0.5,
          difficulty: 0.2,
          diversity: 0.2,
          uniqueness: 0.1,
        },
      });

      const config = scorer.getConfig();
      expect(config.weights?.clarity).toBe(0.5);
    });

    it('should respect custom minimum score', () => {
      scorer.configure({ minScore: 50 });

      const groups: AnalyzerResult[] = [
        createMockResult(
          [createMockMovie(1, 'M1'), createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')],
          'Group 1',
          'director',
          5000
        ),
      ];

      scorer.score(groups);

      // With higher threshold, might not meet it
      const config = scorer.getConfig();
      expect(config.minScore).toBe(50);
    });

    it('should allow disabling overlap requirement', () => {
      scorer.configure({ requireNoOverlap: false });

      const sharedMovie = createMockMovie(1, 'Shared');
      const groups: AnalyzerResult[] = [
        createMockResult([sharedMovie, createMockMovie(2, 'M2'), createMockMovie(3, 'M3'), createMockMovie(4, 'M4')], 'G1', 'director', 5000),
        createMockResult([sharedMovie, createMockMovie(5, 'M5'), createMockMovie(6, 'M6'), createMockMovie(7, 'M7')], 'G2', 'actor', 5000),
        createMockResult([createMockMovie(8, 'M8'), createMockMovie(9, 'M9'), createMockMovie(10, 'M10'), createMockMovie(11, 'M11')], 'G3', 'theme', 5000),
        createMockResult([createMockMovie(12, 'M12'), createMockMovie(13, 'M13'), createMockMovie(14, 'M14'), createMockMovie(15, 'M15')], 'G4', 'wordplay', 5000),
      ];

      const metrics = scorer.score(groups);

      // Should not zero out score even with overlap
      expect(metrics.overlapPassed).toBe(false);
      expect(metrics.overallScore).toBeGreaterThan(0);
    });
  });
});
