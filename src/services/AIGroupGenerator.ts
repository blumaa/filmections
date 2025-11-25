/**
 * AI Group Generator Service
 *
 * Uses Claude AI to generate movie connection groups from TMDB movie data.
 * Key principle: AI suggests connections, code verifies claims.
 *
 * Always calls /api/generate-groups - works in both dev and production.
 */

import type { TMDBMovieDetails, Film } from '../types';
import type { DifficultyColor, DifficultyLevel, GroupInput } from '../lib/supabase/storage';
import type { MovieForAI } from './aiGroupPrompt';
import { VerificationEngine, type VerificationType, type VerificationParams } from './VerificationEngine';

export type { MovieForAI } from './aiGroupPrompt';

import type { ConnectionCategory } from './ConnectionTypeRegistry';

/**
 * AI response format for a single group (includes verification params)
 */
export interface AIGroupResponse {
  connection: string;
  filmIndices: number[];
  difficulty: 'easy' | 'medium' | 'hard' | 'hardest';
  explanation: string;
  verificationType?: VerificationType;
  verificationParams?: VerificationParams;
  category?: ConnectionCategory;
}

/**
 * Full AI response
 */
export interface AIGenerationResponse {
  groups: AIGroupResponse[];
  filteredCount?: number; // Groups removed by validation
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Generated group ready for storage
 */
export interface GeneratedGroup {
  films: Film[];
  connection: string;
  connectionType: string;
  category?: ConnectionCategory;
  difficultyScore: number;
  difficulty: DifficultyLevel;
  color: DifficultyColor;
  explanation?: string;
  verified?: boolean;
  verificationIssues?: string[];
}

/**
 * Configuration for AI generation
 */
export interface AIGeneratorConfig {
  /** Number of groups to generate (default: 10) */
  groupCount?: number;
  /** Whether to prefer creative connections (default: true) */
  preferCreative?: boolean;
}

/**
 * Result of AI group generation
 */
export interface AIGenerationResult {
  groups: GeneratedGroup[];
  filteredCount?: number; // Groups removed by validation
  tokensUsed?: {
    input: number;
    output: number;
  };
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

/**
 * Call the API route (works in both dev and production)
 */
async function callAPI(
  movies: MovieForAI[],
  groupCount: number
): Promise<AIGenerationResponse> {
  const response = await fetch('/api/generate-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ movies, groupCount }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${error}`);
  }

  return response.json();
}

/**
 * AI Group Generator Class
 */
export class AIGroupGenerator {
  private config: Required<AIGeneratorConfig>;

  constructor(config: AIGeneratorConfig = {}) {
    this.config = {
      groupCount: config.groupCount ?? 10,
      preferCreative: config.preferCreative ?? true,
    };
  }

  /**
   * Prepare TMDB movie data for AI analysis
   */
  prepareMoviesForAI(movies: TMDBMovieDetails[]): MovieForAI[] {
    return movies.map((movie) => {
      const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name || null;
      const cast = movie.credits?.cast.slice(0, 5).map((c) => c.name) || [];

      return {
        id: movie.id,
        title: movie.title,
        year: new Date(movie.release_date).getFullYear(),
        overview: movie.overview || '',
        director,
        cast,
      };
    });
  }

  /**
   * Generate groups using Claude AI
   */
  async generateGroups(
    moviePool: TMDBMovieDetails[],
    groupCount?: number
  ): Promise<AIGenerationResult> {
    const count = groupCount ?? this.config.groupCount;

    // Prepare movie data for AI
    const moviesForAI = this.prepareMoviesForAI(moviePool);

    // Call API route
    const aiResponse = await callAPI(moviesForAI, count);

    // Convert AI response to GeneratedGroup format (includes verification)
    const { groups, verificationRejected } = this.processAIResponse(
      aiResponse.groups,
      moviesForAI,
      moviePool
    );

    // Total filtered = API validation + verification failures
    const totalFiltered = (aiResponse.filteredCount || 0) + verificationRejected;

    return {
      groups,
      filteredCount: totalFiltered,
      tokensUsed: aiResponse.tokensUsed,
    };
  }

  /**
   * Process AI response into GeneratedGroup format with verification
   */
  private processAIResponse(
    aiGroups: AIGroupResponse[],
    moviesForAI: MovieForAI[],
    originalMovies: TMDBMovieDetails[]
  ): { groups: GeneratedGroup[]; verificationRejected: number } {
    const usedFilmIds = new Set<number>();
    const validGroups: GeneratedGroup[] = [];
    const engine = new VerificationEngine();
    let verificationRejected = 0;

    for (const aiGroup of aiGroups) {
      // Validate film indices
      const validIndices = aiGroup.filmIndices.filter(
        (i) => i >= 0 && i < moviesForAI.length && !usedFilmIds.has(moviesForAI[i].id)
      );

      if (validIndices.length !== 4) {
        console.warn(`Skipping group "${aiGroup.connection}": invalid film count`);
        continue;
      }

      // Get full movie details for verification
      const movieDetailsForGroup = validIndices.map((i) => originalMovies[i]);

      // Verify the connection if verification params are provided
      if (aiGroup.verificationType && aiGroup.verificationParams) {
        const result = engine.verify(
          aiGroup.connection,
          aiGroup.verificationType,
          aiGroup.verificationParams,
          movieDetailsForGroup
        );

        if (!result.valid) {
          console.warn(`[Verification] REJECTED: "${aiGroup.connection}"`);
          console.warn(`  Issues: ${result.issues.join(', ')}`);
          verificationRejected++;
          continue; // Skip this group - verification failed
        }
      } else {
        // No verification params = can't verify = skip
        console.warn(`[Verification] REJECTED (no params): "${aiGroup.connection}"`);
        verificationRejected++;
        continue;
      }

      // Get films from indices
      const films: Film[] = validIndices.map((i) => {
        const movie = originalMovies[i];
        usedFilmIds.add(movie.id);

        return {
          id: movie.id,
          title: movie.title,
          year: new Date(movie.release_date).getFullYear(),
          poster_path: movie.poster_path || undefined,
        };
      });

      // Determine connection type from connection text
      const connectionType = this.inferConnectionType(aiGroup.connection);

      validGroups.push({
        films,
        connection: aiGroup.connection,
        connectionType,
        category: aiGroup.category,
        difficultyScore: DIFFICULTY_TO_SCORE[aiGroup.difficulty],
        difficulty: aiGroup.difficulty,
        color: DIFFICULTY_TO_COLOR[aiGroup.difficulty],
        explanation: aiGroup.explanation,
        verified: true, // Only verified groups make it here
      });
    }

    return { groups: validGroups, verificationRejected };
  }

  /**
   * Infer connection type from connection text
   */
  private inferConnectionType(connection: string): string {
    const lower = connection.toLowerCase();

    if (lower.includes('directed by') || lower.includes('director')) {
      return 'director';
    }
    if (lower.includes('starring') || lower.includes('featuring') || lower.includes('actor')) {
      return 'actor';
    }
    if (lower.includes('decade') || lower.includes("'s") || /\d{4}s/.test(connection)) {
      return 'decade';
    }
    if (lower.includes('genre') || lower.includes('horror') || lower.includes('comedy')) {
      return 'genre';
    }

    return 'thematic';
  }

  /**
   * Update configuration
   */
  configure(config: Partial<AIGeneratorConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Convert GeneratedGroup to GroupInput for storage
   */
  static toGroupInput(group: GeneratedGroup): GroupInput {
    return {
      films: group.films,
      connection: group.connection,
      connectionType: group.connectionType,
      difficultyScore: group.difficultyScore,
      difficulty: group.difficulty,
      color: group.color,
      status: 'pending',
      metadata: group.explanation ? { explanation: group.explanation } : undefined,
    };
  }
}
