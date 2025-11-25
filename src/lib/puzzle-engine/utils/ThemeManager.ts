/**
 * ThemeManager
 *
 * Utility for loading and managing theme configurations.
 * Provides centralized access to theme data with enable/disable functionality.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only manages theme configuration
 * - Open/Closed: Easy to extend with new theme sources
 * - Dependency Inversion: Returns theme data as plain objects
 *
 * Following KISS: Simple JSON loading and filtering
 * Following DRY: Single source of truth for theme data
 */

import themesData from '../data/themes.json';

/**
 * Theme configuration structure
 */
export interface Theme {
  /** Unique identifier for the theme */
  id: string;
  /** Human-readable theme name */
  name: string;
  /** Theme category (visual, plot, tone, setting, meta) */
  category: 'visual' | 'plot' | 'tone' | 'setting' | 'meta';
  /** Whether this theme is enabled for puzzle generation */
  enabled: boolean;
  /** Keywords to search for in movie data */
  keywords: string[];
  /** Difficulty rating (1-4, where 4 is hardest) */
  difficulty: number;
  /** Description of what this theme represents */
  description: string;
  /** If true, only search in titles (not overviews) */
  titleOnly?: boolean;
}

/**
 * ThemeManager class
 *
 * Manages loading and filtering of theme configurations.
 *
 * @example
 * ```typescript
 * const manager = ThemeManager.getInstance();
 * const themes = manager.getAllThemes();
 * const enabled = manager.getEnabledThemes();
 * ```
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, Theme>;

  private constructor() {
    this.themes = new Map();
    this.loadThemes();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Load themes from JSON configuration
   */
  private loadThemes(): void {
    const data = themesData as { themes: Theme[] };

    for (const theme of data.themes) {
      this.themes.set(theme.id, theme);
    }
  }

  /**
   * Get all themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get only enabled themes
   */
  getEnabledThemes(): Theme[] {
    return this.getAllThemes().filter((theme) => theme.enabled);
  }

  /**
   * Get themes by category
   */
  getThemesByCategory(category: Theme['category']): Theme[] {
    return this.getAllThemes().filter((theme) => theme.category === category);
  }

  /**
   * Get a specific theme by ID
   */
  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  /**
   * Enable a theme
   */
  enableTheme(id: string): boolean {
    const theme = this.themes.get(id);
    if (theme) {
      theme.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a theme
   */
  disableTheme(id: string): boolean {
    const theme = this.themes.get(id);
    if (theme) {
      theme.enabled = false;
      return true;
    }
    return false;
  }

  /**
   * Get count of all themes
   */
  getThemeCount(): number {
    return this.themes.size;
  }

  /**
   * Get count of enabled themes
   */
  getEnabledThemeCount(): number {
    return this.getEnabledThemes().length;
  }

  /**
   * Check if a theme exists
   */
  hasTheme(id: string): boolean {
    return this.themes.has(id);
  }

  /**
   * Reset all themes to their default enabled state
   * (based on the JSON configuration)
   */
  resetToDefaults(): void {
    this.themes.clear();
    this.loadThemes();
  }
}

/**
 * Export singleton instance for convenient access
 */
export const themeManager = ThemeManager.getInstance();
