/**
 * Puzzle Engine Types
 *
 * Core type definitions for the modular puzzle generation engine.
 * Follows SOLID principles for extensibility and maintainability.
 */

import type { TMDBMovieDetails, Film, Group, DifficultyLevel, DifficultyColor } from '../../types';

// Re-export types that validators and analyzers need
export type { TMDBMovieDetails };

/**
 * Connection types supported by the puzzle engine.
 * Extensible to allow custom analyzer types.
 */
export type ConnectionType =
  | 'director'
  | 'actor'
  | 'franchise'
  | 'theme'
  | 'production'
  | 'wordplay'
  | 'decade'
  | 'year'
  | string; // Allow custom types

/**
 * Result returned by an analyzer after finding potential connections.
 *
 * @property films - Array of movies that share the connection
 * @property connection - Human-readable description of the connection
 * @property connectionType - Type of connection found
 * @property difficultyScore - Numeric score for difficulty (higher = harder)
 * @property metadata - Optional analyzer-specific data for extensibility
 */
export interface AnalyzerResult {
  films: TMDBMovieDetails[];
  connection: string;
  connectionType: ConnectionType;
  difficultyScore: number;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for an individual analyzer.
 *
 * @property minGroupSize - Minimum number of films in a group (default: 4)
 * @property maxGroupSize - Maximum number of films in a group (default: 4)
 * @property minQualityScore - Minimum quality threshold for groups
 * @property enabled - Whether this analyzer is active
 */
export interface AnalyzerConfig {
  minGroupSize: number;
  maxGroupSize: number;
  minQualityScore?: number;
  enabled: boolean;
}

/**
 * Configuration for the puzzle generator.
 *
 * @property poolSize - Number of movies to fetch for analysis
 * @property groupsNeeded - Number of groups to generate (default: 4)
 * @property avoidRecentContent - Whether to filter out recently used content
 * @property maxRetries - Maximum number of generation retries on failure
 * @property analyzers - Optional per-analyzer configuration overrides
 */
export interface GeneratorConfig {
  poolSize: number;
  groupsNeeded: number;
  avoidRecentContent: boolean;
  maxRetries: number;
  analyzers?: Record<string, Partial<AnalyzerConfig>>;
}

/**
 * Quality metrics for evaluating puzzle groups.
 *
 * @property obscurityScore - Score based on movie vote counts (0-100)
 * @property diversityScore - How different this group is from others (0-100)
 * @property consistencyScore - How well films fit the connection (0-100)
 * @property overallScore - Weighted combination of all scores (0-100)
 */
export interface QualityMetrics {
  obscurityScore: number;
  diversityScore: number;
  consistencyScore: number;
  overallScore: number;
}

/**
 * Core analyzer interface. All analyzers must implement this interface.
 *
 * Following Interface Segregation Principle: focused, minimal interface.
 */
export interface IAnalyzer {
  /**
   * Unique name identifier for the analyzer
   */
  readonly name: string;

  /**
   * Type of connection this analyzer finds
   */
  readonly connectionType: ConnectionType;

  /**
   * Configuration for this analyzer
   */
  readonly config: AnalyzerConfig;

  /**
   * Analyze a pool of movies to find potential connections.
   *
   * @param movies - Array of movies to analyze
   * @returns Promise resolving to array of analyzer results
   */
  analyze(movies: TMDBMovieDetails[]): Promise<AnalyzerResult[]>;

  /**
   * Validate a single analyzer result.
   *
   * @param result - Result to validate
   * @returns true if result is valid
   */
  validateResult(result: AnalyzerResult): boolean;
}

/**
 * Quality validator interface for assessing group quality.
 *
 * Following Dependency Inversion Principle: depend on abstraction.
 */
export interface IQualityValidator {
  /**
   * Calculate quality metrics for a group.
   *
   * @param result - Analyzer result to evaluate
   * @returns Quality metrics
   */
  validateGroup(result: AnalyzerResult): QualityMetrics;

  /**
   * Check if metrics meet minimum quality thresholds.
   *
   * @param metrics - Quality metrics to check
   * @returns true if thresholds are met
   */
  meetsThreshold(metrics: QualityMetrics): boolean;
}

/**
 * Storage interface for persisting puzzles.
 *
 * Following Interface Segregation Principle: minimal, focused interface.
 * Following Dependency Inversion Principle: depend on abstraction, not concrete storage.
 */
export interface IPuzzleStorage {
  /**
   * Save a generated puzzle.
   *
   * @param puzzle - Puzzle to save
   * @returns Promise that resolves when save is complete
   */
  savePuzzle(puzzle: SavedPuzzle): Promise<void>;

  /**
   * Load a puzzle by ID.
   *
   * @param id - Puzzle identifier
   * @returns Promise resolving to puzzle or null if not found
   */
  loadPuzzle(id: string): Promise<SavedPuzzle | null>;

  /**
   * Get the puzzle for a specific date.
   *
   * @param date - Date string (YYYY-MM-DD format)
   * @returns Promise resolving to puzzle or null if not found
   */
  getDailyPuzzle(date: string): Promise<SavedPuzzle | null>;
}

/**
 * Saved puzzle format for persistence.
 *
 * @property id - Unique identifier
 * @property groups - Array of puzzle groups
 * @property films - Flat array of all films
 * @property createdAt - Timestamp when puzzle was created
 * @property metadata - Optional puzzle metadata
 */
export interface SavedPuzzle {
  id: string;
  groups: Group[];
  films: Film[];
  createdAt: number;
  metadata?: Record<string, unknown>;
}

/**
 * Selected group with difficulty color assignment.
 *
 * Extends AnalyzerResult with additional game-specific properties.
 */
export interface SelectedGroup extends AnalyzerResult {
  color: DifficultyColor;
  difficulty: DifficultyLevel;
}

/**
 * Result of puzzle generation.
 *
 * @property groups - Array of selected groups
 * @property films - Flat, shuffled array of all films
 */
export interface GeneratedPuzzle {
  groups: Group[];
  films: Film[];
}
