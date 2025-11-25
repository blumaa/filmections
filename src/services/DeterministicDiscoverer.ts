/**
 * DeterministicDiscoverer
 *
 * Finds guaranteed-valid connection groups from a pool of films
 * without relying on AI. These are 100% verifiable connections.
 *
 * Part of the Hybrid approach:
 * 1. Deterministic finds guaranteed connections
 * 2. AI names/ranks them and adds thematic connections
 */

import type { TMDBMovieDetails } from '../types';
import type { VerificationType, VerificationParams } from './VerificationEngine';
import type { ConnectionCategory } from './ConnectionTypeRegistry';

/**
 * A discovered group with verification metadata
 */
export interface DiscoveredGroup {
  films: TMDBMovieDetails[];
  connectionType: string; // e.g., 'director', 'actor', 'title-color'
  connectionValue: string; // e.g., 'Christopher Nolan', 'Red'
  category: ConnectionCategory;
  verificationType: VerificationType;
  verificationParams: VerificationParams;
}

export interface DiscoveryOptions {
  maxGroups?: number;
  minFilmsPerGroup?: number;
}

// Title patterns to search for
const TITLE_PATTERNS = {
  colors: ['red', 'blue', 'black', 'white', 'green', 'gold', 'silver', 'yellow', 'pink', 'purple', 'orange', 'grey', 'gray'],
  numbers: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'hundred', 'thousand', 'million', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  animals: ['dog', 'cat', 'bird', 'wolf', 'lion', 'tiger', 'bear', 'snake', 'horse', 'dragon', 'shark', 'fish', 'crow', 'swan', 'eagle', 'hawk', 'fox', 'rabbit', 'deer', 'monkey', 'ape', 'spider', 'bat'],
  bodyParts: ['head', 'hand', 'heart', 'eye', 'eyes', 'blood', 'bone', 'face', 'finger', 'arm', 'leg', 'brain'],
  timeWords: ['night', 'day', 'midnight', 'dawn', 'dusk', 'morning', 'evening', 'yesterday', 'tomorrow', 'forever', 'eternal'],
  deathWords: ['dead', 'death', 'die', 'kill', 'murder', 'ghost', 'zombie'],
};

export class DeterministicDiscoverer {
  /**
   * Find all groups of 4+ films by the same director
   */
  findDirectorGroups(films: TMDBMovieDetails[]): DiscoveredGroup[] {
    const directorMap = new Map<number, { name: string; films: TMDBMovieDetails[] }>();

    for (const film of films) {
      const director = film.credits?.crew?.find((c) => c.job === 'Director');
      if (director) {
        const existing = directorMap.get(director.id);
        if (existing) {
          existing.films.push(film);
        } else {
          directorMap.set(director.id, { name: director.name, films: [film] });
        }
      }
    }

    const groups: DiscoveredGroup[] = [];

    for (const [directorId, { name, films: directorFilms }] of directorMap) {
      // Create groups of 4 from this director's films
      const groupsFromDirector = this.chunkIntoGroups(directorFilms, 4);

      for (const groupFilms of groupsFromDirector) {
        groups.push({
          films: groupFilms,
          connectionType: 'director',
          connectionValue: name,
          category: 'crew',
          verificationType: 'director',
          verificationParams: { personId: directorId },
        });
      }
    }

    return groups;
  }

  /**
   * Find all groups of 4+ films with the same top-billed actor
   */
  findActorGroups(films: TMDBMovieDetails[]): DiscoveredGroup[] {
    const actorMap = new Map<number, { name: string; films: TMDBMovieDetails[] }>();
    const TOP_BILLING_THRESHOLD = 5; // Only consider actors in top 5 billing

    for (const film of films) {
      const topActors = film.credits?.cast?.filter((a) => a.order < TOP_BILLING_THRESHOLD) || [];

      for (const actor of topActors) {
        const existing = actorMap.get(actor.id);
        if (existing) {
          // Avoid duplicate films for same actor
          if (!existing.films.some((f) => f.id === film.id)) {
            existing.films.push(film);
          }
        } else {
          actorMap.set(actor.id, { name: actor.name, films: [film] });
        }
      }
    }

    const groups: DiscoveredGroup[] = [];

    for (const [actorId, { name, films: actorFilms }] of actorMap) {
      const groupsFromActor = this.chunkIntoGroups(actorFilms, 4);

      for (const groupFilms of groupsFromActor) {
        groups.push({
          films: groupFilms,
          connectionType: 'actor',
          connectionValue: name,
          category: 'cast',
          verificationType: 'actor',
          verificationParams: { personId: actorId },
        });
      }
    }

    return groups;
  }

  /**
   * Find groups of films with patterns in their titles
   */
  findTitlePatternGroups(films: TMDBMovieDetails[]): DiscoveredGroup[] {
    const groups: DiscoveredGroup[] = [];

    // Search for each pattern type
    for (const [patternType, words] of Object.entries(TITLE_PATTERNS)) {
      for (const word of words) {
        const matchingFilms = films.filter((f) =>
          f.title.toLowerCase().includes(word.toLowerCase())
        );

        if (matchingFilms.length >= 4) {
          const groupsFromPattern = this.chunkIntoGroups(matchingFilms, 4);

          for (const groupFilms of groupsFromPattern) {
            groups.push({
              films: groupFilms,
              connectionType: `title-${patternType}`,
              connectionValue: this.formatPatternName(patternType, word),
              category: 'title',
              verificationType: 'title-contains',
              verificationParams: { substring: word },
            });
          }
        }
      }
    }

    return groups;
  }

  /**
   * Find groups of films sharing the same primary genre
   */
  findGenreGroups(films: TMDBMovieDetails[]): DiscoveredGroup[] {
    const genreMap = new Map<number, { name: string; films: TMDBMovieDetails[] }>();

    for (const film of films) {
      // Use primary genre (first in list)
      const primaryGenre = film.genres?.[0];
      if (primaryGenre) {
        const existing = genreMap.get(primaryGenre.id);
        if (existing) {
          existing.films.push(film);
        } else {
          genreMap.set(primaryGenre.id, { name: primaryGenre.name, films: [film] });
        }
      }
    }

    const groups: DiscoveredGroup[] = [];

    for (const [genreId, { name, films: genreFilms }] of genreMap) {
      // Only create groups if we have enough films
      if (genreFilms.length >= 4) {
        const groupsFromGenre = this.chunkIntoGroups(genreFilms, 4);

        for (const groupFilms of groupsFromGenre) {
          groups.push({
            films: groupFilms,
            connectionType: 'genre',
            connectionValue: name,
            category: 'plot', // Genre fits under plot category
            verificationType: 'genre-includes',
            verificationParams: { genreId },
          });
        }
      }
    }

    return groups;
  }

  /**
   * Run all discoverers and return combined results
   */
  discoverAll(films: TMDBMovieDetails[], options: DiscoveryOptions = {}): DiscoveredGroup[] {
    const { maxGroups = 50, minFilmsPerGroup = 4 } = options;

    const allGroups: DiscoveredGroup[] = [
      ...this.findDirectorGroups(films),
      ...this.findActorGroups(films),
      ...this.findTitlePatternGroups(films),
      ...this.findGenreGroups(films),
    ];

    // Filter by minimum films
    const validGroups = allGroups.filter((g) => g.films.length >= minFilmsPerGroup);

    // Sort by interest (prefer director/actor over title/genre)
    const sortedGroups = validGroups.sort((a, b) => {
      const priority: Record<string, number> = {
        director: 1,
        actor: 2,
        'title-colors': 3,
        'title-animals': 4,
        'title-timeWords': 5,
        'title-deathWords': 6,
        'title-bodyParts': 7,
        'title-numbers': 8,
        genre: 9,
      };
      const aPriority = priority[a.connectionType] || 10;
      const bPriority = priority[b.connectionType] || 10;
      return aPriority - bPriority;
    });

    // Limit total groups
    return sortedGroups.slice(0, maxGroups);
  }

  /**
   * Chunk films into groups of specified size
   */
  private chunkIntoGroups(films: TMDBMovieDetails[], groupSize: number): TMDBMovieDetails[][] {
    const groups: TMDBMovieDetails[][] = [];

    for (let i = 0; i + groupSize <= films.length; i += groupSize) {
      groups.push(films.slice(i, i + groupSize));
    }

    return groups;
  }

  /**
   * Format pattern name for display
   */
  private formatPatternName(patternType: string, word: string): string {
    const typeLabels: Record<string, string> = {
      colors: 'Color',
      numbers: 'Number',
      animals: 'Animal',
      bodyParts: 'Body part',
      timeWords: 'Time word',
      deathWords: 'Death word',
    };

    const label = typeLabels[patternType] || 'Word';
    return `${label} "${word}" in title`;
  }
}
