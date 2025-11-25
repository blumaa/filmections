/**
 * Quality Validator
 *
 * Evaluates puzzle group quality using multiple metrics.
 * Provides configurable thresholds for quality control.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles quality validation
 * - Open/Closed: New metrics can be added without breaking existing code
 * - Dependency Inversion: Implements IQualityValidator interface
 */

import type {
  IQualityValidator,
  AnalyzerResult,
  QualityMetrics,
} from '../types';

/**
 * Validates puzzle group quality using multiple metrics.
 *
 * Current metrics:
 * - Obscurity Score (0-100): Based on average vote counts
 * - Diversity Score (0-100): Placeholder for future implementation
 * - Consistency Score (0-100): Placeholder for future implementation
 * - Overall Score (0-100): Weighted combination of all metrics
 *
 * Future enhancements could include:
 * - Genre diversity within group
 * - Era diversity (release year spread)
 * - Consistency of connection strength
 * - Cultural recognition (language, country)
 */
export class QualityValidator implements IQualityValidator {
  /**
   * Quality thresholds for validation.
   * Groups must meet all thresholds to be considered high quality.
   */
  private thresholds = {
    obscurityMin: 0,
    diversityMin: 0,
    consistencyMin: 0,
    overallMin: 30, // Out of 100
  };

  /**
   * Weights for calculating overall score.
   */
  private weights = {
    obscurity: 0.4,
    diversity: 0.3,
    consistency: 0.3,
  };

  /**
   * Validate a group and calculate quality metrics.
   *
   * @param result - Analyzer result to validate
   * @returns Quality metrics for the group
   */
  validateGroup(result: AnalyzerResult): QualityMetrics {
    const obscurityScore = this.calculateObscurity(result);
    const diversityScore = 50; // TODO: Implement diversity calculation
    const consistencyScore = 50; // TODO: Implement consistency calculation

    const overallScore =
      obscurityScore * this.weights.obscurity +
      diversityScore * this.weights.diversity +
      consistencyScore * this.weights.consistency;

    return {
      obscurityScore,
      diversityScore,
      consistencyScore,
      overallScore,
    };
  }

  /**
   * Check if quality metrics meet configured thresholds.
   *
   * @param metrics - Quality metrics to check
   * @returns true if all thresholds are met
   */
  meetsThreshold(metrics: QualityMetrics): boolean {
    return (
      metrics.obscurityScore >= this.thresholds.obscurityMin &&
      metrics.diversityScore >= this.thresholds.diversityMin &&
      metrics.consistencyScore >= this.thresholds.consistencyMin &&
      metrics.overallScore >= this.thresholds.overallMin
    );
  }

  /**
   * Update quality thresholds.
   *
   * Allows runtime configuration for experimentation.
   *
   * @param thresholds - Partial threshold configuration to merge
   */
  setThresholds(thresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Update metric weights.
   *
   * Weights should sum to 1.0 for proper overall score calculation.
   *
   * @param weights - Partial weight configuration to merge
   */
  setWeights(weights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...weights };
  }

  /**
   * Calculate obscurity score based on vote counts.
   *
   * More obscure films (lower vote counts) yield higher scores.
   * Score is normalized to 0-100 scale.
   *
   * Scoring:
   * - < 500 votes: 100 (very obscure)
   * - 500-10000 votes: Linear scale
   * - > 10000 votes: 0 (very popular)
   *
   * @param result - Analyzer result with films
   * @returns Obscurity score (0-100)
   * @private
   */
  private calculateObscurity(result: AnalyzerResult): number {
    if (result.films.length === 0) {
      return 0;
    }

    // Calculate average vote count
    const totalVotes = result.films.reduce((sum, film) => {
      return sum + (film.vote_count || 0);
    }, 0);

    const avgVoteCount = totalVotes / result.films.length;

    // Normalize to 0-100 scale
    if (avgVoteCount < 500) {
      return 100; // Very obscure
    }

    if (avgVoteCount > 10000) {
      return 0; // Very popular
    }

    // Linear scale between 500 and 10000
    const normalized = (avgVoteCount - 500) / (10000 - 500);
    return 100 - normalized * 100;
  }

  /**
   * Get current thresholds (read-only).
   *
   * @returns Copy of current thresholds
   */
  getThresholds(): typeof this.thresholds {
    return { ...this.thresholds };
  }

  /**
   * Get current weights (read-only).
   *
   * @returns Copy of current weights
   */
  getWeights(): typeof this.weights {
    return { ...this.weights };
  }
}
