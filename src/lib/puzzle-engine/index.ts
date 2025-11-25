/**
 * Puzzle Engine - Public API
 *
 * Modular, extensible puzzle generation engine following SOLID principles.
 *
 * Usage:
 * ```typescript
 * import { PuzzleEngine, DirectorAnalyzer, analyzerRegistry } from './lib/puzzle-engine';
 *
 * // Register analyzers
 * analyzerRegistry.register(new DirectorAnalyzer());
 *
 * // Create engine and generate puzzle
 * const engine = new PuzzleEngine();
 * const puzzle = await engine.generatePuzzle(moviePool);
 * ```
 */

// Core types
export * from './types';

// Main engine
export { PuzzleEngine } from './PuzzleEngine';
export {
  PuzzleGenerator,
  type PuzzleGeneratorConfig,
  type MoviePoolFilter,
  type GeneratedPuzzleWithMetrics,
  type BatchGenerationResult,
} from './PuzzleGenerator';

// Core classes
export { BaseAnalyzer } from './core/BaseAnalyzer';
export { AnalyzerRegistry, analyzerRegistry } from './core/AnalyzerRegistry';
export { GroupSelector } from './core/GroupSelector';
export { QualityValidator } from './core/QualityValidator';

// Analyzers
export * from './analyzers';

// Validators
export * from './validators';

// Utilities
export * from './utils/difficultyScorer';
export * from './utils/movieFilters';
export * from './utils/shuffle';
export * from './utils/ThemeManager';
