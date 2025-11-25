/**
 * QualityScorer
 *
 * Main quality scoring class that combines all validators.
 * Calculates weighted overall score and determines if puzzle meets threshold.
 *
 * Default weights:
 * - Clarity: 25%
 * - Difficulty Balance: 20%
 * - Diversity: 20%
 * - Uniqueness: 15%
 * - Overlap: 20% (binary multiplier)
 *
 * Overall score calculation:
 * 1. Calculate weighted sum of individual scores (excluding overlap)
 * 2. Normalize to 0-100 scale
 * 3. If overlap fails, multiply by 0 (zero score)
 */

import type { AnalyzerResult } from '../types';
import type { QualityMetrics, QualityConfig, IQualityValidator } from './types';
import { ConnectionClarityValidator } from './ConnectionClarityValidator';
import { DifficultyBalanceValidator } from './DifficultyBalanceValidator';
import { FilmDiversityValidator } from './FilmDiversityValidator';
import { UniquenessValidator } from './UniquenessValidator';
import { OverlapValidator } from './OverlapValidator';

/**
 * Default quality configuration
 */
const DEFAULT_CONFIG: QualityConfig = {
  minScore: 35, // Minimum 35/100 for production puzzles
  requireNoOverlap: true,
  weights: {
    clarity: 0.25,
    difficulty: 0.2,
    diversity: 0.2,
    uniqueness: 0.15,
  },
};

/**
 * QualityScorer Implementation
 */
export class QualityScorer {
  private config: QualityConfig;
  private validators: Map<string, IQualityValidator>;

  constructor(config: Partial<QualityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize validators
    this.validators = new Map();
    this.validators.set('clarity', new ConnectionClarityValidator());
    this.validators.set('difficulty', new DifficultyBalanceValidator());
    this.validators.set('diversity', new FilmDiversityValidator());
    this.validators.set('uniqueness', new UniquenessValidator());
    this.validators.set('overlap', new OverlapValidator());
  }

  /**
   * Calculate quality metrics for a puzzle
   *
   * @param groups - Array of puzzle groups
   * @returns Quality metrics
   */
  score(groups: AnalyzerResult[]): QualityMetrics {
    // Run all validators
    const clarityResult = this.validators.get('clarity')!.validate(groups);
    const difficultyResult = this.validators.get('difficulty')!.validate(groups);
    const diversityResult = this.validators.get('diversity')!.validate(groups);
    const uniquenessResult = this.validators.get('uniqueness')!.validate(groups);
    const overlapResult = this.validators.get('overlap')!.validate(groups);

    // Calculate weighted score (0-10 scale)
    const weights = this.config.weights!;
    const weightedSum =
      clarityResult.score * weights.clarity! +
      difficultyResult.score * weights.difficulty! +
      diversityResult.score * weights.diversity! +
      uniquenessResult.score * weights.uniqueness!;

    // Normalize weight sum (should be <= 1.0)
    const totalWeight =
      weights.clarity! + weights.difficulty! + weights.diversity! + weights.uniqueness!;

    // Convert to 0-100 scale
    let overallScore = (weightedSum / totalWeight) * 10;

    // Apply overlap penalty if required
    if (this.config.requireNoOverlap && !overlapResult.passed) {
      overallScore = 0;
    }

    const meetsThreshold = overallScore >= this.config.minScore;

    return {
      clarityScore: clarityResult.score,
      difficultyScore: difficultyResult.score,
      diversityScore: diversityResult.score,
      uniquenessScore: uniquenessResult.score,
      overlapPassed: overlapResult.passed,
      overallScore: Math.round(overallScore * 10) / 10,
      meetsThreshold,
      details: {
        clarity: clarityResult.reason,
        difficulty: difficultyResult.reason,
        diversity: diversityResult.reason,
        uniqueness: uniquenessResult.reason,
        overlap: overlapResult.reason,
      },
    };
  }

  /**
   * Update scorer configuration
   *
   * @param config - Partial configuration to merge
   */
  configure(config: Partial<QualityConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.weights) {
      this.config.weights = { ...this.config.weights, ...config.weights };
    }
  }

  /**
   * Get current configuration
   *
   * @returns Current configuration
   */
  getConfig(): QualityConfig {
    return { ...this.config };
  }
}
