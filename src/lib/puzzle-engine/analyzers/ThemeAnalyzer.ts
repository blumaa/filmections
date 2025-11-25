/**
 * ThemeAnalyzer
 *
 * Finds movie connections based on thematic elements.
 * Searches titles and overviews for theme-related keywords.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only analyzes theme-based connections
 * - Open/Closed: Extends BaseAnalyzer, adding theme-specific logic
 * - Liskov Substitution: Can be used anywhere IAnalyzer is expected
 * - Interface Segregation: Implements focused IAnalyzer interface
 * - Dependency Inversion: Depends on TMDBMovieDetails and Theme abstractions
 *
 * Following KISS: Simple keyword matching with clear logic
 * Following DRY: Reuses BaseAnalyzer utilities and ThemeManager
 */

import { BaseAnalyzer } from '../core/BaseAnalyzer';
import type { AnalyzerResult, ConnectionType } from '../types';
import type { TMDBMovieDetails } from '../../../types';
import { themeManager, type Theme } from '../utils/ThemeManager';

/**
 * Configuration specific to ThemeAnalyzer
 */
export interface ThemeAnalyzerConfig {
  /** Minimum number of keyword matches required (default: 1) */
  minKeywordMatches: number;
  /** Whether to search in overview text (default: true) */
  searchOverview: boolean;
  /** Whether to search in title (default: true) */
  searchTitle: boolean;
}

/**
 * Combined configuration type for ThemeAnalyzer
 */
export type ThemeAnalyzerFullConfig = Partial<
  import('../types').AnalyzerConfig & ThemeAnalyzerConfig
>;

/**
 * ThemeAnalyzer Implementation
 *
 * Analyzes movies to find groups connected by thematic elements.
 * Uses keyword matching against movie titles and overviews.
 *
 * Algorithm:
 * 1. Load enabled themes from ThemeManager
 * 2. For each theme, search movies for keyword matches
 * 3. Group movies by matching themes
 * 4. Filter themes with sufficient films (minGroupSize)
 * 5. Calculate difficulty based on theme difficulty + vote counts
 * 6. Return valid connections
 *
 * Special handling:
 * - Themes without keywords use special matching logic (e.g., one-word titles, B&W films)
 * - Some themes require metadata checking (e.g., release year for period pieces)
 *
 * @example
 * ```typescript
 * const analyzer = new ThemeAnalyzer();
 * analyzer.configure({ searchOverview: false }); // Only search titles
 * const results = await analyzer.analyze(movies);
 * ```
 */
export class ThemeAnalyzer extends BaseAnalyzer {
  readonly name = 'theme';
  readonly connectionType: ConnectionType = 'theme';

  private themeConfig: ThemeAnalyzerConfig = {
    minKeywordMatches: 1,
    searchOverview: true,
    searchTitle: true,
  };

  /**
   * Configure theme-specific and base analyzer options
   */
  configure(config: ThemeAnalyzerFullConfig): void {
    // Handle base config properties (enabled, minGroupSize, maxGroupSize)
    super.configure(config);

    // Handle theme-specific config properties
    const { minKeywordMatches, searchOverview, searchTitle } = config;
    if (
      minKeywordMatches !== undefined ||
      searchOverview !== undefined ||
      searchTitle !== undefined
    ) {
      this.themeConfig = {
        ...this.themeConfig,
        ...(minKeywordMatches !== undefined && { minKeywordMatches }),
        ...(searchOverview !== undefined && { searchOverview }),
        ...(searchTitle !== undefined && { searchTitle }),
      };
    }
  }

  /**
   * Find theme-based connections in the movie pool
   *
   * @param movies - Array of movies to analyze
   * @returns Array of potential theme-based groups
   */
  protected async findConnections(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]> {
    const enabledThemes = themeManager.getEnabledThemes();
    const results: AnalyzerResult[] = [];

    // Process each theme
    for (const theme of enabledThemes) {
      const matchingMovies = this.findMoviesMatchingTheme(movies, theme);

      // Skip if not enough movies match this theme
      if (matchingMovies.length < this._config.minGroupSize) {
        continue;
      }

      // Shuffle and select films
      const shuffledFilms = this.shuffleFilms(matchingMovies);
      const selectedFilms = shuffledFilms.slice(0, this._config.maxGroupSize);

      // Calculate difficulty score (combine theme difficulty with vote counts)
      const baseDifficulty = this.calculateDifficultyScore(selectedFilms);
      const themeDifficultyBonus = theme.difficulty * 500; // Scale theme difficulty
      const difficultyScore = baseDifficulty + themeDifficultyBonus;

      results.push({
        films: selectedFilms,
        connection: theme.name,
        connectionType: this.connectionType,
        difficultyScore,
        metadata: {
          themeId: theme.id,
          themeName: theme.name,
          themeCategory: theme.category,
          totalMatchingFilms: matchingMovies.length,
        },
      });
    }

    return results;
  }

  /**
   * Find movies that match a specific theme
   *
   * @param movies - Movies to search
   * @param theme - Theme to match against
   * @returns Movies that match the theme
   */
  private findMoviesMatchingTheme(movies: TMDBMovieDetails[], theme: Theme): TMDBMovieDetails[] {
    // Special handling for themes without keywords
    if (theme.keywords.length === 0) {
      return this.findMoviesWithSpecialTheme(movies, theme);
    }

    // Keyword-based matching
    return movies.filter((movie) => {
      const matchCount = this.countThemeMatches(movie, theme);
      return matchCount >= this.themeConfig.minKeywordMatches;
    });
  }

  /**
   * Count keyword matches for a movie and theme
   *
   * @param movie - Movie to check
   * @param theme - Theme with keywords
   * @returns Number of keyword matches
   */
  private countThemeMatches(movie: TMDBMovieDetails, theme: Theme): number {
    let matchCount = 0;
    const searchText = this.getSearchText(movie, theme).toLowerCase();

    for (const keyword of theme.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (searchText.includes(keywordLower)) {
        matchCount++;
      }
    }

    return matchCount;
  }

  /**
   * Get combined search text from movie
   *
   * @param movie - Movie to extract text from
   * @param theme - Theme being checked (to respect titleOnly flag)
   * @returns Combined searchable text
   */
  private getSearchText(movie: TMDBMovieDetails, theme?: Theme): string {
    const parts: string[] = [];

    // If theme has titleOnly flag, only search title
    if (theme?.titleOnly) {
      parts.push(movie.title);
      return parts.join(' ');
    }

    // Otherwise use global config
    if (this.themeConfig.searchTitle) {
      parts.push(movie.title);
    }

    if (this.themeConfig.searchOverview) {
      parts.push(movie.overview);
    }

    return parts.join(' ');
  }

  /**
   * Handle special themes that don't use keyword matching
   *
   * @param movies - Movies to filter
   * @param theme - Special theme
   * @returns Matching movies
   */
  private findMoviesWithSpecialTheme(
    movies: TMDBMovieDetails[],
    theme: Theme
  ): TMDBMovieDetails[] {
    switch (theme.id) {
      case 'one-word-titles':
        return movies.filter((movie) => this.hasOneWordTitle(movie));

      case 'numbers-in-title':
        return movies.filter((movie) => this.hasNumberInTitle(movie));

      case 'bw-films':
        // Would need additional metadata - skip for now
        return [];

      case 'foreign-language':
        // Would need language metadata - skip for now
        return [];

      default:
        return [];
    }
  }

  /**
   * Check if movie has a one-word title
   */
  private hasOneWordTitle(movie: TMDBMovieDetails): boolean {
    // Remove common articles and punctuation
    const title = movie.title
      .replace(/^(The|A|An)\s+/i, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .trim();

    return !title.includes(' ');
  }

  /**
   * Check if movie has a number in title
   */
  private hasNumberInTitle(movie: TMDBMovieDetails): boolean {
    return /\d/.test(movie.title);
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
