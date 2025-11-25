/**
 * UniquenessValidator
 *
 * Validates that connections are novel and interesting.
 * Penalizes common or overused connection types.
 *
 * Scoring criteria:
 * - 10: All novel and interesting connections
 * - 7-9: Mostly interesting with one common connection
 * - 4-6: Mix of interesting and common connections
 * - 0-3: Too many common or boring connections
 */

import type { AnalyzerResult } from '../types';
import type { IQualityValidator, ValidationResult } from './types';

/**
 * Connection type rarity scores (higher = more interesting/rare)
 */
const CONNECTION_RARITY: Record<string, number> = {
  // Most common (easier to find)
  director: 5,
  actor: 5,

  // Moderately common
  decade: 6,
  theme: 7,

  // Less common (more interesting)
  wordplay: 8,
  year: 8,

  // Default for unknown types
  default: 7,
};

/**
 * UniquenessValidator Implementation
 */
export class UniquenessValidator implements IQualityValidator {
  readonly name = 'uniqueness';
  readonly weight = 0.15; // 15% of overall score

  validate(groups: AnalyzerResult[]): ValidationResult {
    if (groups.length === 0) {
      return {
        score: 0,
        passed: false,
        reason: 'No groups to validate',
      };
    }

    // Calculate connection type distribution
    const typeCount = this.getTypeDistribution(groups);

    // Score based on rarity and variety
    const rarityScore = this.scoreRarity(groups);
    const varietyScore = this.scoreVariety(typeCount, groups.length);

    // Average the scores
    const avgScore = (rarityScore + varietyScore) / 2;
    const passed = avgScore >= 5;

    const reason = this.buildReason(typeCount, avgScore);

    return {
      score: Math.round(avgScore * 10) / 10,
      passed,
      reason,
      metadata: {
        typeCount,
        rarityScore,
        varietyScore,
      },
    };
  }

  /**
   * Get distribution of connection types
   *
   * @param groups - Groups to analyze
   * @returns Count per type
   */
  private getTypeDistribution(groups: AnalyzerResult[]): Record<string, number> {
    return groups.reduce(
      (acc, group) => {
        const type = group.connectionType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Score based on connection rarity
   *
   * @param groups - Groups to score
   * @returns Score from 0-10
   */
  private scoreRarity(groups: AnalyzerResult[]): number {
    let totalRarity = 0;

    for (const group of groups) {
      const type = group.connectionType;
      const rarity = CONNECTION_RARITY[type] || CONNECTION_RARITY.default;
      totalRarity += rarity;
    }

    // Average rarity (scale to 0-10)
    const avgRarity = totalRarity / groups.length;
    return avgRarity; // Already on 0-10 scale
  }

  /**
   * Score based on connection type variety
   *
   * @param typeCount - Distribution of types
   * @param totalGroups - Total number of groups
   * @returns Score from 0-10
   */
  private scoreVariety(typeCount: Record<string, number>, totalGroups: number): number {
    const uniqueTypes = Object.keys(typeCount).length;

    // Ideal: all different types (score 10)
    // Poor: all same type (score 0)
    const varietyRatio = uniqueTypes / totalGroups;
    return varietyRatio * 10;
  }

  /**
   * Build human-readable reason
   *
   * @param typeCount - Type distribution
   * @param score - Calculated score
   * @returns Reason string
   */
  private buildReason(typeCount: Record<string, number>, score: number): string {
    const types = Object.keys(typeCount);
    const typeStr = types.join(', ');

    if (score >= 8) {
      return `Excellent variety: ${typeStr}`;
    } else if (score >= 6) {
      return `Good variety: ${typeStr}`;
    } else if (score >= 4) {
      return `Limited variety: ${typeStr}`;
    } else {
      return `Poor variety: ${typeStr}`;
    }
  }
}
