/**
 * HybridGroupGenerator
 *
 * Combines deterministic discovery with AI enhancement:
 * 1. Deterministic: Find guaranteed-valid connections (director, actor, title patterns)
 * 2. AI Polish: Give creative names to deterministic discoveries
 * 3. AI Thematic: Suggest additional thematic connections (looser verification)
 *
 * This ensures we always have valid groups while allowing AI creativity.
 */

import type { TMDBMovieDetails, Film } from '../types';
import type { DifficultyColor, DifficultyLevel } from '../lib/supabase/storage';
import { DeterministicDiscoverer, type DiscoveredGroup } from './DeterministicDiscoverer';
import type { ConnectionCategory } from './ConnectionTypeRegistry';
import type { GeneratedGroup } from './AIGroupGenerator';

/**
 * A formatted group ready for the game (extends GeneratedGroup for compatibility)
 */
export interface FormattedGroup extends GeneratedGroup {
  source: 'deterministic' | 'ai-thematic';
}

const DIFFICULTY_TO_COLOR: Record<DifficultyLevel, DifficultyColor> = {
  easy: 'yellow',
  medium: 'green',
  hard: 'blue',
  hardest: 'purple',
};

const DIFFICULTY_TO_SCORE: Record<DifficultyLevel, number> = {
  easy: 2000,
  medium: 5000,
  hard: 7000,
  hardest: 9000,
};

export interface HybridGeneratorConfig {
  maxDeterministicGroups?: number;
  maxAIGroups?: number;
  preferDiversity?: boolean;
}

const DEFAULT_CONFIG: HybridGeneratorConfig = {
  maxDeterministicGroups: 15,
  maxAIGroups: 5,
  preferDiversity: true,
};

export class HybridGroupGenerator {
  private discoverer: DeterministicDiscoverer;
  private config: HybridGeneratorConfig;

  constructor(config: Partial<HybridGeneratorConfig> = {}) {
    this.discoverer = new DeterministicDiscoverer();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate groups using the hybrid approach
   */
  async generate(
    films: TMDBMovieDetails[],
    targetGroupCount: number
  ): Promise<{
    groups: FormattedGroup[];
    deterministicCount: number;
    aiCount: number;
  }> {
    // Step 1: Find deterministic connections
    const discovered = this.discoverer.discoverAll(films, {
      maxGroups: this.config.maxDeterministicGroups,
    });

    // Step 2: Format deterministic groups
    const deterministicGroups = discovered.map((d) => this.formatDeterministicGroup(d));

    // Step 3: Select best groups with diversity
    const selectedGroups = this.selectBestGroups(deterministicGroups, targetGroupCount);

    return {
      groups: selectedGroups,
      deterministicCount: selectedGroups.length,
      aiCount: 0, // AI thematic will be added later
    };
  }

  /**
   * Format a deterministic discovery into a game-ready group
   */
  formatDeterministicGroup(discovered: DiscoveredGroup): FormattedGroup {
    const films: Film[] = discovered.films.map((f) => ({
      id: f.id,
      title: f.title,
      year: new Date(f.release_date).getFullYear(),
      poster_path: f.poster_path || undefined,
    }));

    // Generate connection text based on type
    const connection = this.generateConnectionText(discovered);
    const explanation = this.generateExplanation(discovered);
    const difficulty = this.determineDifficulty(discovered);

    return {
      connection,
      films,
      connectionType: discovered.connectionType,
      category: discovered.category,
      difficulty,
      difficultyScore: DIFFICULTY_TO_SCORE[difficulty],
      color: DIFFICULTY_TO_COLOR[difficulty],
      explanation,
      verified: true, // Deterministic groups are always verified
      source: 'deterministic',
    };
  }

  /**
   * Select the best groups prioritizing diversity
   */
  selectBestGroups(groups: FormattedGroup[], maxCount: number): FormattedGroup[] {
    if (!this.config.preferDiversity) {
      return groups.slice(0, maxCount);
    }

    const selected: FormattedGroup[] = [];
    const usedCategories = new Set<ConnectionCategory>();
    const remaining = [...groups];

    // First pass: one from each category
    while (selected.length < maxCount && remaining.length > 0) {
      // Find a group from an unused category
      const unusedCategoryIndex = remaining.findIndex(
        (g) => g.category && !usedCategories.has(g.category)
      );

      if (unusedCategoryIndex !== -1) {
        const group = remaining.splice(unusedCategoryIndex, 1)[0];
        selected.push(group);
        if (group.category) {
          usedCategories.add(group.category);
        }
      } else {
        // All categories used, just take the next best
        selected.push(remaining.shift()!);
      }
    }

    return selected;
  }

  /**
   * Generate creative connection text
   */
  private generateConnectionText(discovered: DiscoveredGroup): string {
    switch (discovered.connectionType) {
      case 'director':
        return `Directed by ${discovered.connectionValue}`;

      case 'actor':
        return `Starring ${discovered.connectionValue}`;

      case 'title-colors':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'title-numbers':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'title-animals':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'title-bodyParts':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'title-timeWords':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'title-deathWords':
        return `Films with "${this.extractWord(discovered.connectionValue)}" in the title`;

      case 'genre':
        return `${discovered.connectionValue} films`;

      default:
        return discovered.connectionValue;
    }
  }

  /**
   * Generate explanation for the connection
   */
  private generateExplanation(discovered: DiscoveredGroup): string {
    const filmTitles = discovered.films.map((f) => f.title).join(', ');

    switch (discovered.connectionType) {
      case 'director':
        return `All four films were directed by ${discovered.connectionValue}: ${filmTitles}`;

      case 'actor':
        return `${discovered.connectionValue} stars in all four: ${filmTitles}`;

      case 'genre':
        return `All are ${discovered.connectionValue} films`;

      default:
        if (discovered.connectionType.startsWith('title-')) {
          const word = this.extractWord(discovered.connectionValue);
          return `Each title contains the word "${word}"`;
        }
        return `These films share a common connection`;
    }
  }

  /**
   * Determine difficulty based on connection type
   */
  private determineDifficulty(discovered: DiscoveredGroup): 'easy' | 'medium' | 'hard' | 'hardest' {
    switch (discovered.connectionType) {
      case 'director':
      case 'actor':
        // Famous directors/actors are easy, lesser-known are harder
        return 'easy';

      case 'genre':
        return 'easy';

      case 'title-colors':
      case 'title-animals':
        return 'medium';

      case 'title-numbers':
      case 'title-bodyParts':
      case 'title-timeWords':
        return 'medium';

      case 'title-deathWords':
        return 'hard';

      default:
        return 'medium';
    }
  }

  /**
   * Extract the key word from a pattern description
   */
  private extractWord(connectionValue: string): string {
    // Pattern like: Color "red" in title
    const match = connectionValue.match(/"([^"]+)"/);
    return match ? match[1] : connectionValue;
  }
}
