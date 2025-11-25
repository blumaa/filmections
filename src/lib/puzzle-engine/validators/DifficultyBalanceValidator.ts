/**
 * DifficultyBalanceValidator
 *
 * Validates that difficulty scores are well-distributed across quartiles.
 * Ensures puzzles have a good difficulty progression.
 *
 * Scoring criteria:
 * - 10: Perfect quartile distribution (25% each)
 * - 7-9: Minor imbalance (one quartile slightly over/under)
 * - 4-6: Moderate imbalance (multiple quartiles off)
 * - 0-3: Severe imbalance (all groups similar difficulty)
 */

import type { AnalyzerResult } from '../types';
import type { IQualityValidator, ValidationResult } from './types';

/**
 * DifficultyBalanceValidator Implementation
 */
export class DifficultyBalanceValidator implements IQualityValidator {
  readonly name = 'difficulty';
  readonly weight = 0.2; // 20% of overall score

  validate(groups: AnalyzerResult[]): ValidationResult {
    if (groups.length === 0) {
      return {
        score: 0,
        passed: false,
        reason: 'No groups to validate',
      };
    }

    // Sort groups by difficulty score
    const sortedGroups = [...groups].sort((a, b) => a.difficultyScore - b.difficultyScore);

    // Calculate quartiles
    const quartiles = this.assignQuartiles(sortedGroups);

    // Check distribution
    const distribution = this.getDistribution(quartiles);
    const score = this.scoreDistribution(distribution, groups.length);
    const passed = score >= 6;

    const reason = this.buildReason(distribution, score);

    return {
      score,
      passed,
      reason,
      metadata: {
        distribution,
        quartiles,
      },
    };
  }

  /**
   * Assign quartile labels to groups
   *
   * @param sortedGroups - Groups sorted by difficulty (ascending)
   * @returns Quartile assignments
   */
  private assignQuartiles(sortedGroups: AnalyzerResult[]): string[] {
    const quartileLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
    return sortedGroups.map((_, index) => {
      const quartile = Math.floor((index / sortedGroups.length) * 4);
      return quartileLabels[Math.min(quartile, 3)];
    });
  }

  /**
   * Get distribution of groups across quartiles
   *
   * @param quartiles - Array of quartile labels
   * @returns Count per quartile
   */
  private getDistribution(quartiles: string[]): Record<string, number> {
    return quartiles.reduce(
      (acc, q) => {
        acc[q] = (acc[q] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Score the quartile distribution
   *
   * @param distribution - Count per quartile
   * @param totalGroups - Total number of groups
   * @returns Score from 0-10
   */
  private scoreDistribution(distribution: Record<string, number>, totalGroups: number): number {
    const idealPerQuartile = totalGroups / 4;
    let totalDeviation = 0;

    // Calculate total deviation from ideal
    for (const count of Object.values(distribution)) {
      totalDeviation += Math.abs(count - idealPerQuartile);
    }

    // Normalize deviation (0 = perfect, 1 = maximum deviation)
    const maxDeviation = totalGroups; // Worst case: all in one quartile
    const normalizedDeviation = totalDeviation / maxDeviation;

    // Convert to 0-10 score (less deviation = higher score)
    const score = 10 * (1 - normalizedDeviation);

    return Math.round(score * 10) / 10;
  }

  /**
   * Build human-readable reason
   *
   * @param distribution - Quartile distribution
   * @param score - Calculated score
   * @returns Reason string
   */
  private buildReason(distribution: Record<string, number>, score: number): string {
    const counts = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => distribution[q] || 0);
    const distStr = counts.join('-');

    if (score >= 9) {
      return `Excellent balance (${distStr})`;
    } else if (score >= 7) {
      return `Good balance (${distStr})`;
    } else if (score >= 5) {
      return `Moderate imbalance (${distStr})`;
    } else {
      return `Poor balance (${distStr})`;
    }
  }
}
