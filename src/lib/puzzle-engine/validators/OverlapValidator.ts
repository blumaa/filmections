/**
 * OverlapValidator
 *
 * Validates that there is zero film overlap between groups.
 * This is a binary pass/fail validator (not scored 0-10).
 *
 * Validation:
 * - Pass: No films appear in multiple groups
 * - Fail: One or more films appear in multiple groups
 */

import type { AnalyzerResult } from '../types';
import type { IQualityValidator, ValidationResult } from './types';

/**
 * OverlapValidator Implementation
 */
export class OverlapValidator implements IQualityValidator {
  readonly name = 'overlap';
  readonly weight = 0.2; // 20% of overall score (used as multiplier: 0 or 1)

  validate(groups: AnalyzerResult[]): ValidationResult {
    if (groups.length === 0) {
      return {
        score: 10,
        passed: true,
        reason: 'No groups to check for overlap',
      };
    }

    // Track all film IDs and detect duplicates
    const filmIds = new Set<number>();
    const duplicates = new Set<number>();

    for (const group of groups) {
      for (const film of group.films) {
        if (filmIds.has(film.id)) {
          duplicates.add(film.id);
        }
        filmIds.add(film.id);
      }
    }

    const passed = duplicates.size === 0;
    const score = passed ? 10 : 0; // Binary: full score or zero

    let reason: string;
    if (passed) {
      reason = 'No film overlap detected';
    } else {
      const filmList = Array.from(duplicates).slice(0, 3).join(', ');
      const more = duplicates.size > 3 ? ` (+${duplicates.size - 3} more)` : '';
      reason = `${duplicates.size} film(s) appear in multiple groups: ${filmList}${more}`;
    }

    return {
      score,
      passed,
      reason,
      metadata: {
        totalFilms: filmIds.size,
        duplicateCount: duplicates.size,
        duplicateFilmIds: Array.from(duplicates),
      },
    };
  }
}
