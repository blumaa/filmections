/**
 * Quality Validator Types
 *
 * Type definitions for the quality scoring system.
 */

import type { AnalyzerResult } from '../types';

/**
 * Score returned by a validator (0-10 scale)
 * - 0: Poor quality
 * - 5: Acceptable quality
 * - 10: Excellent quality
 */
export type ValidatorScore = number;

/**
 * Result from a quality validator
 */
export interface ValidationResult {
  /** Score from 0-10 (or pass/fail for binary validators) */
  score: ValidatorScore;
  /** Whether the validation passed minimum thresholds */
  passed: boolean;
  /** Human-readable reason for the score */
  reason?: string;
  /** Additional metadata for debugging */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for quality validators
 * Each validator assesses a specific quality metric
 */
export interface IQualityValidator {
  /** Unique name for this validator */
  readonly name: string;

  /** Weight in overall score calculation (0-1) */
  readonly weight: number;

  /**
   * Validate a set of puzzle groups
   *
   * @param groups - Array of analyzer results to validate
   * @returns Validation result with score
   */
  validate(groups: AnalyzerResult[]): ValidationResult;
}

/**
 * Combined quality metrics for a puzzle
 */
export interface QualityMetrics {
  /** Connection clarity score (0-10) */
  clarityScore: number;

  /** Difficulty balance score (0-10) */
  difficultyScore: number;

  /** Film diversity score (0-10) */
  diversityScore: number;

  /** Connection uniqueness score (0-10) */
  uniquenessScore: number;

  /** Overlap validation (pass/fail) */
  overlapPassed: boolean;

  /** Overall weighted score (0-100) */
  overallScore: number;

  /** Whether puzzle meets minimum quality threshold */
  meetsThreshold: boolean;

  /** Detailed reasons for scores */
  details: {
    clarity?: string;
    difficulty?: string;
    diversity?: string;
    uniqueness?: string;
    overlap?: string;
  };
}

/**
 * Configuration for quality scoring
 */
export interface QualityConfig {
  /** Minimum overall score required (0-100) */
  minScore: number;

  /** Whether overlap validation must pass */
  requireNoOverlap: boolean;

  /** Custom validator weights */
  weights?: {
    clarity?: number;
    difficulty?: number;
    diversity?: number;
    uniqueness?: number;
  };
}
