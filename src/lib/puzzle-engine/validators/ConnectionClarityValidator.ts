/**
 * ConnectionClarityValidator
 *
 * Validates that connections are clear and obvious once revealed.
 * Checks for overly vague or ambiguous connection descriptions.
 *
 * Scoring criteria:
 * - 10: All connections are specific and clear
 * - 7-9: Mostly clear with minor vagueness
 * - 4-6: Some unclear connections
 * - 0-3: Multiple vague or confusing connections
 */

import type { AnalyzerResult } from '../types';
import type { IQualityValidator, ValidationResult } from './types';

/**
 * Patterns that indicate vague connections
 */
const VAGUE_PATTERNS = [
  /^similar/i,
  /^related to/i,
  /^connected by/i,
  /^have something in common/i,
  /^share/i,
  /^various/i,
  /^different/i,
  /^multiple/i,
];

/**
 * Minimum connection description length
 */
const MIN_CONNECTION_LENGTH = 10;

/**
 * ConnectionClarityValidator Implementation
 */
export class ConnectionClarityValidator implements IQualityValidator {
  readonly name = 'clarity';
  readonly weight = 0.25; // 25% of overall score

  validate(groups: AnalyzerResult[]): ValidationResult {
    let totalScore = 0;
    const issues: string[] = [];

    for (const group of groups) {
      const groupScore = this.scoreConnection(group.connection);
      totalScore += groupScore;

      if (groupScore < 7) {
        issues.push(`"${group.connection}" (${groupScore}/10)`);
      }
    }

    const avgScore = groups.length > 0 ? totalScore / groups.length : 0;
    const passed = avgScore >= 6; // Minimum average of 6/10

    let reason = `Average clarity: ${avgScore.toFixed(1)}/10`;
    if (issues.length > 0) {
      reason += `. Issues: ${issues.join(', ')}`;
    }

    return {
      score: Math.round(avgScore * 10) / 10, // Round to 1 decimal
      passed,
      reason,
      metadata: {
        avgScore,
        issueCount: issues.length,
        totalGroups: groups.length,
      },
    };
  }

  /**
   * Score an individual connection string
   *
   * @param connection - Connection description to score
   * @returns Score from 0-10
   */
  private scoreConnection(connection: string): number {
    let score = 10;

    // Penalize very short connections
    if (connection.length < MIN_CONNECTION_LENGTH) {
      score -= 3;
    }

    // Penalize vague patterns
    for (const pattern of VAGUE_PATTERNS) {
      if (pattern.test(connection)) {
        score -= 2;
        break; // Only penalize once
      }
    }

    // Penalize empty or whitespace-only
    if (!connection.trim()) {
      score = 0;
    }

    // Bonus for specificity indicators
    if (this.hasSpecificityIndicators(connection)) {
      score = Math.min(10, score + 1);
    }

    return Math.max(0, score);
  }

  /**
   * Check if connection has specificity indicators
   *
   * @param connection - Connection to check
   * @returns true if specific indicators found
   */
  private hasSpecificityIndicators(connection: string): boolean {
    const specificIndicators = [
      /\d{4}/,          // Year (e.g., "Films from 1999")
      /directed by/i,   // Director name
      /starring/i,      // Actor name
      /\d{2,4}s/,      // Decade (e.g., "1980s")
      /"[^"]+"/,        // Quoted word/phrase
    ];

    return specificIndicators.some((pattern) => pattern.test(connection));
  }
}
