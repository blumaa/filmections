/**
 * Connection Type Registry
 *
 * Defines all categories of connections the system can generate.
 * Each type has:
 * - Category for grouping
 * - Verification type for validation
 * - Examples to guide AI
 * - Whether it can be discovered deterministically
 */

import type { VerificationType } from './VerificationEngine';

export type ConnectionCategory =
  | 'thematic' // Plot, themes, character arcs
  | 'title' // Wordplay, patterns in titles
  | 'setting' // Location, time period, environment
  | 'plot' // Specific plot elements
  | 'crew' // Director, writer, composer
  | 'cast'; // Actor connections

export interface ConnectionType {
  id: string;
  name: string;
  category: ConnectionCategory;
  description: string;
  examples: string[];
  verificationType: VerificationType;
  /** Can be found with code instead of AI */
  deterministic: boolean;
  /** Difficulty level this type typically produces */
  typicalDifficulty: 'easy' | 'medium' | 'hard' | 'hardest';
}

/**
 * All supported connection types
 */
export const CONNECTION_TYPES: ConnectionType[] = [
  // === THEMATIC ===
  {
    id: 'theme-revenge',
    name: 'Revenge theme',
    category: 'thematic',
    description: 'Films about revenge or vengeance',
    examples: ['Films about seeking revenge', 'Vengeance-driven protagonists'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'theme-redemption',
    name: 'Redemption arc',
    category: 'thematic',
    description: 'Films about redemption or second chances',
    examples: ['Characters seeking redemption', 'Second chance stories'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'hard',
  },
  {
    id: 'theme-survival',
    name: 'Survival theme',
    category: 'thematic',
    description: 'Films about survival against odds',
    examples: ['Survival stories', 'Characters fighting to survive'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'theme-identity',
    name: 'Identity theme',
    category: 'thematic',
    description: 'Films exploring identity or self-discovery',
    examples: ['Identity crisis', 'Characters discovering who they are'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'hard',
  },

  // === TITLE WORDPLAY ===
  {
    id: 'title-color',
    name: 'Color in title',
    category: 'title',
    description: 'Films with a color word in the title',
    examples: ['Red', 'Blue', 'Black', 'White', 'Green', 'Gold'],
    verificationType: 'title-contains',
    deterministic: false,
    typicalDifficulty: 'easy',
  },
  {
    id: 'title-number',
    name: 'Number in title',
    category: 'title',
    description: 'Films with a number in the title (not sequels)',
    examples: ['Seven', 'Twelve', '21', '300', 'The Sixth Sense'],
    verificationType: 'title-pattern',
    deterministic: false,
    typicalDifficulty: 'easy',
  },
  {
    id: 'title-body-part',
    name: 'Body part in title',
    category: 'title',
    description: 'Films with body parts in the title',
    examples: ['Face/Off', 'The Hand', 'Eyes Wide Shut', 'Footloose'],
    verificationType: 'title-contains',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'title-one-word',
    name: 'One-word title',
    category: 'title',
    description: 'Films with single-word titles',
    examples: ['Alien', 'Heat', 'Jaws', 'Psycho'],
    verificationType: 'title-pattern',
    deterministic: false,
    typicalDifficulty: 'easy',
  },
  {
    id: 'title-animal',
    name: 'Animal in title',
    category: 'title',
    description: 'Films with an animal in the title',
    examples: ['The Birds', 'Snakes on a Plane', 'The Wolf of Wall Street'],
    verificationType: 'title-contains',
    deterministic: false,
    typicalDifficulty: 'easy',
  },

  // === SETTING ===
  {
    id: 'setting-nyc',
    name: 'Set in New York',
    category: 'setting',
    description: 'Films set in New York City',
    examples: ['Takes place in Manhattan', 'NYC setting'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'setting-single-day',
    name: 'Single day',
    category: 'setting',
    description: 'Films that take place over a single day',
    examples: ['24 hours', 'One day', 'Real-time'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'hard',
  },
  {
    id: 'setting-christmas',
    name: 'Christmas setting',
    category: 'setting',
    description: 'Films set during Christmas (not necessarily Christmas movies)',
    examples: ['Die Hard', 'Eyes Wide Shut', 'Batman Returns'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'hard',
  },

  // === PLOT ELEMENTS ===
  {
    id: 'plot-heist',
    name: 'Heist plot',
    category: 'plot',
    description: 'Films featuring a heist or robbery',
    examples: ['Bank heist', 'Robbery', 'Stealing'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'plot-twist',
    name: 'Twist ending',
    category: 'plot',
    description: 'Films known for twist endings',
    examples: ['Unexpected reveal', 'Shocking twist'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'hardest',
  },
  {
    id: 'plot-wedding',
    name: 'Wedding plot',
    category: 'plot',
    description: 'Films featuring a wedding',
    examples: ['Wedding ceremony', 'Getting married'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },
  {
    id: 'plot-prison',
    name: 'Prison setting',
    category: 'plot',
    description: 'Films set in or involving prison',
    examples: ['Prison escape', 'Incarceration', 'Jail'],
    verificationType: 'overview-keywords',
    deterministic: false,
    typicalDifficulty: 'medium',
  },

  // === CREW (Deterministic) ===
  {
    id: 'crew-director',
    name: 'Same director',
    category: 'crew',
    description: 'Films by the same director',
    examples: ['Directed by Christopher Nolan', 'Quentin Tarantino films'],
    verificationType: 'director',
    deterministic: true,
    typicalDifficulty: 'easy',
  },

  // === CAST (Deterministic) ===
  {
    id: 'cast-actor',
    name: 'Same actor',
    category: 'cast',
    description: 'Films starring the same actor',
    examples: ['Starring Tom Hanks', 'Leonardo DiCaprio films'],
    verificationType: 'actor',
    deterministic: true,
    typicalDifficulty: 'easy',
  },
];

/**
 * Get connection types by category
 */
export function getTypesByCategory(category: ConnectionCategory): ConnectionType[] {
  return CONNECTION_TYPES.filter((t) => t.category === category);
}

/**
 * Get all deterministic connection types (can be found with code)
 */
export function getDeterministicTypes(): ConnectionType[] {
  return CONNECTION_TYPES.filter((t) => t.deterministic);
}

/**
 * Get all AI-based connection types
 */
export function getAITypes(): ConnectionType[] {
  return CONNECTION_TYPES.filter((t) => !t.deterministic);
}

/**
 * Get a diverse selection of connection types for a puzzle
 * Returns one type from each category to ensure variety
 */
export function getDiverseTypeSelection(count: number = 4): ConnectionType[] {
  const categories: ConnectionCategory[] = ['thematic', 'title', 'plot', 'setting'];
  const selected: ConnectionType[] = [];

  // Get one from each category
  for (const category of categories) {
    const typesInCategory = getTypesByCategory(category);
    if (typesInCategory.length > 0) {
      const randomType = typesInCategory[Math.floor(Math.random() * typesInCategory.length)];
      selected.push(randomType);
      if (selected.length >= count) break;
    }
  }

  return selected;
}

/**
 * Format connection types for AI prompt
 */
export function formatTypesForPrompt(types: ConnectionType[]): string {
  return types
    .map(
      (t, i) =>
        `${i + 1}. ${t.name} (${t.category})
   Description: ${t.description}
   Examples: ${t.examples.join(', ')}
   Verify with: ${t.verificationType}`
    )
    .join('\n\n');
}
