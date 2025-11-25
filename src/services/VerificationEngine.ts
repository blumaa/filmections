/**
 * Verification Engine
 *
 * Validates AI-suggested connections against actual film data.
 * Key principle: AI suggests, code verifies.
 *
 * This ensures 100% factual accuracy by checking claims against
 * the actual TMDB data we have for each film.
 */

import type { TMDBMovieDetails } from '../types';

/**
 * Types of verification the engine can perform
 */
export type VerificationType =
  | 'overview-keywords' // Check if keywords appear in film overview
  | 'title-contains' // Check if substring appears in title
  | 'title-pattern' // Check if title matches regex pattern
  | 'genre-includes' // Check if film has specific genre
  | 'director' // Check if film has specific director (by ID)
  | 'actor' // Check if film has specific actor (by ID)
  | 'decade' // Check if film is from specific decade
  | 'year-range'; // Check if film is within year range

/**
 * Parameters for each verification type
 */
export interface VerificationParams {
  // overview-keywords: keywords that must appear in overview
  // By default ANY keyword must match, set requireAll=true for ALL to match
  keywords?: string[];
  requireAll?: boolean; // If true, ALL keywords must appear (stricter)

  // title-contains: substring must appear in title
  substring?: string;

  // title-pattern: regex pattern to match against title
  pattern?: string;

  // genre-includes: genre ID must be in film's genres
  genreId?: number;

  // director/actor: person ID must match
  personId?: number;

  // decade: film must be from this decade (e.g., 1980)
  decade?: number;

  // year-range: film must be within range
  minYear?: number;
  maxYear?: number;
}

/**
 * Result of verifying a single film
 */
export interface FilmVerificationResult {
  filmId: number;
  filmTitle: string;
  passed: boolean;
  reason?: string; // Why it failed, if applicable
}

/**
 * Result of verifying a group
 */
export interface VerificationResult {
  valid: boolean;
  filmResults: FilmVerificationResult[];
  issues: string[]; // Human-readable list of failures
  verifiedAt: number;
}

export class VerificationEngine {
  /**
   * Verify a group's connection claim against actual film data
   */
  verify(
    connection: string,
    verificationType: VerificationType,
    params: VerificationParams,
    films: TMDBMovieDetails[]
  ): VerificationResult {
    const filmResults: FilmVerificationResult[] = [];
    const issues: string[] = [];

    for (const film of films) {
      const result = this.verifyFilm(film, verificationType, params);
      filmResults.push(result);

      if (!result.passed) {
        issues.push(`"${film.title}" does not match: ${result.reason || connection}`);
      }
    }

    return {
      valid: issues.length === 0,
      filmResults,
      issues,
      verifiedAt: Date.now(),
    };
  }

  /**
   * Verify a single film against a verification type
   */
  private verifyFilm(
    film: TMDBMovieDetails,
    type: VerificationType,
    params: VerificationParams
  ): FilmVerificationResult {
    const baseResult = {
      filmId: film.id,
      filmTitle: film.title,
    };

    switch (type) {
      case 'overview-keywords':
        return this.verifyOverviewKeywords(film, params, baseResult);

      case 'title-contains':
        return this.verifyTitleContains(film, params, baseResult);

      case 'title-pattern':
        return this.verifyTitlePattern(film, params, baseResult);

      case 'genre-includes':
        return this.verifyGenre(film, params, baseResult);

      case 'director':
        return this.verifyDirector(film, params, baseResult);

      case 'actor':
        return this.verifyActor(film, params, baseResult);

      case 'decade':
        return this.verifyDecade(film, params, baseResult);

      case 'year-range':
        return this.verifyYearRange(film, params, baseResult);

      default:
        return {
          ...baseResult,
          passed: false,
          reason: `Unknown verification type: ${type}`,
        };
    }
  }

  /**
   * Check if keywords appear in the film's overview
   * Default: ANY keyword must match
   * With requireAll: ALL keywords must match (stricter)
   */
  private verifyOverviewKeywords(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const keywords = params.keywords || [];
    const requireAll = params.requireAll ?? false;

    if (keywords.length === 0) {
      return { ...baseResult, passed: false, reason: 'No keywords provided' };
    }

    const overview = (film.overview || '').toLowerCase();

    if (requireAll) {
      // ALL keywords must match (AND logic) - stricter
      const missingKeywords = keywords.filter((kw) => !overview.includes(kw.toLowerCase()));
      if (missingKeywords.length === 0) {
        return { ...baseResult, passed: true };
      }
      return {
        ...baseResult,
        passed: false,
        reason: `Overview missing keywords: ${missingKeywords.join(', ')}`,
      };
    } else {
      // ANY keyword must match (OR logic) - default
      const matchedKeyword = keywords.find((kw) => overview.includes(kw.toLowerCase()));
      if (matchedKeyword) {
        return { ...baseResult, passed: true };
      }
      return {
        ...baseResult,
        passed: false,
        reason: `Overview doesn't contain any of: ${keywords.join(', ')}`,
      };
    }
  }

  /**
   * Check if substring appears in title (case-insensitive)
   */
  private verifyTitleContains(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const substring = params.substring;

    if (!substring) {
      return { ...baseResult, passed: false, reason: 'No substring provided' };
    }

    const title = film.title.toLowerCase();
    const passed = title.includes(substring.toLowerCase());

    return {
      ...baseResult,
      passed,
      reason: passed ? undefined : `Title doesn't contain "${substring}"`,
    };
  }

  /**
   * Check if title matches regex pattern
   */
  private verifyTitlePattern(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const pattern = params.pattern;

    if (!pattern) {
      return { ...baseResult, passed: false, reason: 'No pattern provided' };
    }

    try {
      const regex = new RegExp(pattern, 'i');
      const passed = regex.test(film.title);

      return {
        ...baseResult,
        passed,
        reason: passed ? undefined : `Title doesn't match pattern "${pattern}"`,
      };
    } catch {
      return {
        ...baseResult,
        passed: false,
        reason: `Invalid regex pattern: ${pattern}`,
      };
    }
  }

  /**
   * Check if film has the specified genre
   */
  private verifyGenre(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const genreId = params.genreId;

    if (genreId === undefined) {
      return { ...baseResult, passed: false, reason: 'No genre ID provided' };
    }

    const passed = film.genres?.some((g) => g.id === genreId) ?? false;

    return {
      ...baseResult,
      passed,
      reason: passed ? undefined : `Film doesn't have genre ID ${genreId}`,
    };
  }

  /**
   * Check if film has the specified director
   */
  private verifyDirector(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const personId = params.personId;

    if (personId === undefined) {
      return { ...baseResult, passed: false, reason: 'No person ID provided' };
    }

    const passed =
      film.credits?.crew?.some((c) => c.job === 'Director' && c.id === personId) ?? false;

    return {
      ...baseResult,
      passed,
      reason: passed ? undefined : `Film doesn't have director with ID ${personId}`,
    };
  }

  /**
   * Check if film has the specified actor
   */
  private verifyActor(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const personId = params.personId;

    if (personId === undefined) {
      return { ...baseResult, passed: false, reason: 'No person ID provided' };
    }

    const passed = film.credits?.cast?.some((a) => a.id === personId) ?? false;

    return {
      ...baseResult,
      passed,
      reason: passed ? undefined : `Film doesn't have actor with ID ${personId}`,
    };
  }

  /**
   * Check if film is from the specified decade
   */
  private verifyDecade(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const decade = params.decade;

    if (decade === undefined) {
      return { ...baseResult, passed: false, reason: 'No decade provided' };
    }

    const filmYear = new Date(film.release_date).getFullYear();
    const filmDecade = Math.floor(filmYear / 10) * 10;
    const passed = filmDecade === decade;

    return {
      ...baseResult,
      passed,
      reason: passed ? undefined : `Film is from ${filmDecade}s, not ${decade}s`,
    };
  }

  /**
   * Check if film is within year range
   */
  private verifyYearRange(
    film: TMDBMovieDetails,
    params: VerificationParams,
    baseResult: { filmId: number; filmTitle: string }
  ): FilmVerificationResult {
    const { minYear, maxYear } = params;

    if (minYear === undefined && maxYear === undefined) {
      return { ...baseResult, passed: false, reason: 'No year range provided' };
    }

    const filmYear = new Date(film.release_date).getFullYear();
    const passesMin = minYear === undefined || filmYear >= minYear;
    const passesMax = maxYear === undefined || filmYear <= maxYear;
    const passed = passesMin && passesMax;

    return {
      ...baseResult,
      passed,
      reason: passed
        ? undefined
        : `Film year ${filmYear} is outside range ${minYear || '?'}-${maxYear || '?'}`,
    };
  }
}
