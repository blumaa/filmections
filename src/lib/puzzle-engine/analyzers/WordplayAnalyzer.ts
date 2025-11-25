/**
 * WordplayAnalyzer
 *
 * Finds movie connections based on shared words in titles.
 * Filters out common stop words to find meaningful connections.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes word-based title connections
 * - Open/Closed: Extends BaseAnalyzer, adding wordplay-specific logic
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 * - Interface Segregation: Implements focused IAnalyzer interface
 * - Dependency Inversion: Depends on TMDBMovieDetails abstraction
 *
 * Following KISS: Simple word extraction and matching
 * Following DRY: Reuses BaseAnalyzer utilities
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';

/**
 * Configuration specific to WordplayAnalyzer
 */
export interface WordplayAnalyzerConfig {
  /** Minimum word length to consider (default: 4) */
  minWordLength: number;
  /** Common words to ignore (default: common articles/prepositions) */
  stopWords: string[];
}

/**
 * Combined configuration type for WordplayAnalyzer
 */
export type WordplayAnalyzerFullConfig = Partial<
  import('../types').AnalyzerConfig & WordplayAnalyzerConfig
>;

/**
 * Default stop words to filter out
 */
const DEFAULT_STOP_WORDS = [
  // Articles
  'the',
  'a',
  'an',
  // Prepositions
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'with',
  'from',
  'by',
  // Conjunctions
  'and',
  'or',
  'but',
  // Common words
  'is',
  'it',
  'as',
  'was',
  'are',
  // Part indicators (to avoid "Part 1", "Part 2" matches)
  'part',
  'chapter',
  'vol',
  'volume',
];

/**
 * WordplayAnalyzer Implementation
 *
 * Analyzes movies to find groups connected by shared words in titles.
 * Uses word extraction and stop word filtering.
 *
 * Algorithm:
 * 1. Extract meaningful words from all movie titles
 * 2. Group movies by shared words (excluding stop words)
 * 3. Filter word groups with sufficient films (minGroupSize)
 * 4. Select and shuffle films for valid groups
 * 5. Calculate difficulty based on word commonality
 * 6. Return valid connections
 *
 * Examples:
 * - "Star Wars", "Star Trek", "A Star is Born", "Lone Star" → "Star"
 * - "The Dark Knight", "Dark City", "Dark Shadows" → "Dark"
 * - "Lost in Translation", "Lost Highway", "Lost World" → "Lost"
 *
 * @example
 * ```typescript
 * const analyzer = new WordplayAnalyzer();
 * analyzer.configure({ minWordLength: 5 }); // Only match longer words
 * const results = await analyzer.analyze(movies);
 * ```
 */
export class WordplayAnalyzer extends BaseAnalyzer {
  readonly name = 'wordplay';
  readonly connectionType: ConnectionType = 'wordplay';

  private wordplayConfig: WordplayAnalyzerConfig = {
    minWordLength: 4,
    stopWords: DEFAULT_STOP_WORDS,
  };

  /**
   * Configure wordplay-specific and base analyzer options
   */
  configure(config: WordplayAnalyzerFullConfig): void {
    // Handle base config properties (enabled, minGroupSize, maxGroupSize)
    super.configure(config);

    // Handle wordplay-specific config properties
    const { minWordLength, stopWords } = config;
    if (minWordLength !== undefined || stopWords !== undefined) {
      this.wordplayConfig = {
        ...this.wordplayConfig,
        ...(minWordLength !== undefined && { minWordLength }),
        ...(stopWords !== undefined && { stopWords }),
      };
    }
  }

  /**
   * Find wordplay-based connections in the movie pool
   *
   * @param movies - Array of movies to analyze
   * @returns Array of potential wordplay-based groups
   */
  protected async findConnections(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    // Build word-to-movies map
    const wordMap = this.buildWordMap(movies);

    const results: AnalyzerResult[] = [];

    // Process each word that appears in multiple titles
    for (const [word, matchingMovies] of wordMap) {
      // Skip if not enough movies share this word
      if (matchingMovies.length < this._config.minGroupSize) {
        continue;
      }

      // Shuffle and select films
      const shuffledFilms = this.shuffleFilms(matchingMovies);
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score
      // More common words (more movies) = easier
      // Less common words (fewer movies) = harder
      const baseDifficulty = this.calculateDifficultyScore(selectedFilms);
      const rarityBonus = Math.max(0, 1000 - matchingMovies.length * 100);
      const difficultyScore = baseDifficulty + rarityBonus;

      results.push({
        films: selectedFilms,
        connection: `"${word}" in the title`,
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          word,
          totalMatchingFilms: matchingMovies.length,
          wordLength: word.length,
        },
      });
    }

    return results;
  }

  /**
   * Build a map of words to movies that contain them
   *
   * @param movies - Movies to process
   * @returns Map of word -> movies
   */
  private buildWordMap(movies: TMDBMovieDetails[]): Map<string, TMDBMovieDetails[]> {
    const wordMap = new Map<string, TMDBMovieDetails[]>();

    for (const movie of movies) {
      const words = this.extractMeaningfulWords(movie.title);

      for (const word of words) {
        if (!wordMap.has(word)) {
          wordMap.set(word, []);
        }
        wordMap.get(word)!.push(movie);
      }
    }

    return wordMap;
  }

  /**
   * Extract meaningful words from a title
   *
   * @param title - Movie title
   * @returns Array of meaningful words
   */
  private extractMeaningfulWords(title: string): string[] {
    // Remove special characters and convert to lowercase
    const cleaned = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();

    // Split into words
    const words = cleaned.split(/\s+/);

    // Filter by length and stop words
    return words.filter(
      (word) =>
        word.length >= this.wordplayConfig.minWordLength &&
        !this.wordplayConfig.stopWords.includes(word)
    );
  }

  /**
   * Shuffle films array using Fisher-Yates algorithm
   *
   * @param films - Films to shuffle
   * @returns Shuffled copy of films array
   */
  protected shuffleFilms(films: TMDBMovieDetails[]): TMDBMovieDetails[] {
    const shuffled = [...films];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
