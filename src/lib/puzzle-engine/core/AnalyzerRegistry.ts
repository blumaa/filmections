/**
 * Analyzer Registry
 *
 * Central registry for managing analyzer instances using the Singleton pattern.
 * Provides analyzer discovery, registration, and lifecycle management.
 *
 * Following SOLID principles:
 * - Single Responsibility: Manages analyzer registration/discovery
 * - Open/Closed: New analyzers can be added without modifying this class
 * - Dependency Inversion: Depends on IAnalyzer interface, not concrete implementations
 */

import type { IAnalyzer, ConnectionType } from '../types';

/**
 * Singleton registry for managing puzzle analyzers.
 *
 * Provides centralized access to all registered analyzers and supports:
 * - Dynamic registration/unregistration
 * - Filtering by enabled state or connection type
 * - Thread-safe singleton instance
 *
 * Usage:
 * ```typescript
 * import { analyzerRegistry } from './core/AnalyzerRegistry';
 *
 * // Register an analyzer
 * analyzerRegistry.register(new DirectorAnalyzer());
 *
 * // Get all enabled analyzers
 * const enabled = analyzerRegistry.getEnabled();
 * ```
 */
export class AnalyzerRegistry {
  /**
   * Singleton instance
   */
  private static instance: AnalyzerRegistry;

  /**
   * Map of analyzer name to analyzer instance
   */
  private analyzers: Map<string, IAnalyzer> = new Map();

  /**
   * Private constructor to enforce singleton pattern.
   * Use getInstance() to access the registry.
   */
  private constructor() {}

  /**
   * Get the singleton instance of the analyzer registry.
   *
   * Creates the instance on first call (lazy initialization).
   *
   * @returns The analyzer registry instance
   */
  static getInstance(): AnalyzerRegistry {
    if (!AnalyzerRegistry.instance) {
      AnalyzerRegistry.instance = new AnalyzerRegistry();
    }
    return AnalyzerRegistry.instance;
  }

  /**
   * Register an analyzer with the registry.
   *
   * If an analyzer with the same name is already registered,
   * logs a warning and does not overwrite.
   *
   * @param analyzer - Analyzer to register
   */
  register(analyzer: IAnalyzer): void {
    if (this.analyzers.has(analyzer.name)) {
      console.warn(
        `Analyzer "${analyzer.name}" is already registered. Ignoring duplicate registration.`
      );
      return;
    }

    this.analyzers.set(analyzer.name, analyzer);
  }

  /**
   * Unregister an analyzer from the registry.
   *
   * @param name - Name of the analyzer to unregister
   * @returns true if analyzer was found and removed, false otherwise
   */
  unregister(name: string): boolean {
    return this.analyzers.delete(name);
  }

  /**
   * Get a specific analyzer by name.
   *
   * @param name - Name of the analyzer to retrieve
   * @returns The analyzer if found, undefined otherwise
   */
  get(name: string): IAnalyzer | undefined {
    return this.analyzers.get(name);
  }

  /**
   * Get all registered analyzers.
   *
   * @returns Array of all registered analyzers
   */
  getAll(): IAnalyzer[] {
    return Array.from(this.analyzers.values());
  }

  /**
   * Get all enabled analyzers.
   *
   * Filters out analyzers where config.enabled is false.
   *
   * @returns Array of enabled analyzers
   */
  getEnabled(): IAnalyzer[] {
    return this.getAll().filter((analyzer) => analyzer.config.enabled);
  }

  /**
   * Get all analyzers of a specific connection type.
   *
   * Useful for running only certain types of analyzers.
   *
   * @param type - Connection type to filter by
   * @returns Array of analyzers matching the type
   */
  getByType(type: ConnectionType): IAnalyzer[] {
    return this.getAll().filter(
      (analyzer) => analyzer.connectionType === type
    );
  }

  /**
   * Get count of registered analyzers.
   *
   * @returns Number of analyzers in the registry
   */
  count(): number {
    return this.analyzers.size;
  }

  /**
   * Check if an analyzer is registered.
   *
   * @param name - Name of the analyzer to check
   * @returns true if analyzer is registered
   */
  has(name: string): boolean {
    return this.analyzers.has(name);
  }

  /**
   * Clear all registered analyzers.
   *
   * Primarily used for testing. Use with caution in production.
   */
  clear(): void {
    this.analyzers.clear();
  }

  /**
   * Get names of all registered analyzers.
   *
   * @returns Array of analyzer names
   */
  getNames(): string[] {
    return Array.from(this.analyzers.keys());
  }
}

/**
 * Exported singleton instance for convenient access.
 *
 * Usage:
 * ```typescript
 * import { analyzerRegistry } from './AnalyzerRegistry';
 *
 * analyzerRegistry.register(myAnalyzer);
 * const analyzers = analyzerRegistry.getEnabled();
 * ```
 */
export const analyzerRegistry = AnalyzerRegistry.getInstance();
