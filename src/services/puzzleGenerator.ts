import type {
  Film,
  Group,
  TMDBMovieDetails,
} from '../types';
import { tmdbService } from './tmdb';

interface PotentialGroup {
  films: TMDBMovieDetails[];
  connection: string;
  type: 'director' | 'actor' | 'franchise' | 'theme' | 'wordplay' | 'production';
}

function tmdbMovieToFilm(movie: TMDBMovieDetails): Film {
  return {
    id: movie.id,
    title: movie.title,
    year: new Date(movie.release_date).getFullYear(),
    poster_path: movie.poster_path || undefined,
  };
}

// Specific thematic keywords that make interesting connections
const SPECIFIC_THEMES = [
  { keywords: ['heist', 'robbery', 'steal'], name: 'Heist films' },
  { keywords: ['time travel', 'time machine'], name: 'Time travel films' },
  { keywords: ['artificial intelligence', 'robot', 'ai'], name: 'AI/Robot films' },
  { keywords: ['zombie', 'undead'], name: 'Zombie films' },
  { keywords: ['vampire'], name: 'Vampire films' },
  { keywords: ['superhero', 'marvel', 'dc comics'], name: 'Superhero films' },
  { keywords: ['space', 'astronaut', 'alien'], name: 'Space films' },
  { keywords: ['world war', 'vietnam war'], name: 'War films' },
  { keywords: ['high school', 'college'], name: 'School/College films' },
  { keywords: ['hitman', 'assassin'], name: 'Assassin films' },
];

// Production companies that have distinctive styles
const PRODUCTION_COMPANIES = [
  { id: 3, name: 'Pixar', label: 'Pixar films' },
  { id: 2, name: 'Walt Disney', label: 'Disney films' },
  { id: 420, name: 'Marvel', label: 'Marvel films' },
  { id: 9993, name: 'DC', label: 'DC films' },
  { id: 33, name: 'Universal', label: 'Universal films' },
  { id: 1632, name: 'Lionsgate', label: 'Lionsgate films' },
];

function analyzeDirectors(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const directorMap = new Map<number, { name: string; movies: TMDBMovieDetails[] }>();

  for (const movie of movies) {
    const directors = movie.credits?.crew?.filter((c) => c.job === 'Director') || [];

    for (const director of directors) {
      if (!directorMap.has(director.id)) {
        directorMap.set(director.id, { name: director.name, movies: [] });
      }
      directorMap.get(director.id)!.movies.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [, data] of directorMap) {
    if (data.movies.length >= 4) {
      const shuffled = [...data.movies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: `Directed by ${data.name}`,
        type: 'director',
      });
    }
  }

  return groups;
}

function analyzeActors(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const actorMap = new Map<number, { name: string; movies: TMDBMovieDetails[] }>();

  for (const movie of movies) {
    const topActors = movie.credits?.cast?.slice(0, 5) || [];

    for (const actor of topActors) {
      if (!actorMap.has(actor.id)) {
        actorMap.set(actor.id, { name: actor.name, movies: [] });
      }
      actorMap.get(actor.id)!.movies.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [, data] of actorMap) {
    if (data.movies.length >= 4) {
      const shuffled = [...data.movies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: `Starring ${data.name}`,
        type: 'actor',
      });
    }
  }

  return groups;
}

function analyzeFranchises(movies: TMDBMovieDetails[]): PotentialGroup[] {
  // Look for movies in the same collection/franchise
  const franchiseMap = new Map<number, { name: string; movies: TMDBMovieDetails[] }>();

  for (const movie of movies) {
    if ((movie as any).belongs_to_collection) {
      const collection = (movie as any).belongs_to_collection;
      if (!franchiseMap.has(collection.id)) {
        franchiseMap.set(collection.id, { name: collection.name, movies: [] });
      }
      franchiseMap.get(collection.id)!.movies.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [, data] of franchiseMap) {
    if (data.movies.length >= 4) {
      const shuffled = [...data.movies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: data.name,
        type: 'franchise',
      });
    }
  }

  return groups;
}

function analyzeThemes(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const themeMap = new Map<string, TMDBMovieDetails[]>();

  for (const movie of movies) {
    const overview = movie.overview?.toLowerCase() || '';
    const title = movie.title.toLowerCase();
    const keywords = (movie as any).keywords?.keywords || [];

    for (const theme of SPECIFIC_THEMES) {
      const hasTheme = theme.keywords.some(keyword =>
        overview.includes(keyword) ||
        title.includes(keyword) ||
        keywords.some((k: any) => k.name.toLowerCase().includes(keyword))
      );

      if (hasTheme) {
        if (!themeMap.has(theme.name)) {
          themeMap.set(theme.name, []);
        }
        themeMap.get(theme.name)!.push(movie);
        break; // Only add to one theme
      }
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [themeName, themeMovies] of themeMap) {
    if (themeMovies.length >= 4) {
      const shuffled = [...themeMovies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: themeName,
        type: 'theme',
      });
    }
  }

  return groups;
}

function analyzeProduction(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const productionMap = new Map<number, { label: string; movies: TMDBMovieDetails[] }>();

  for (const movie of movies) {
    const companies = (movie as any).production_companies || [];

    for (const company of companies) {
      const knownCompany = PRODUCTION_COMPANIES.find(pc => pc.id === company.id);
      if (knownCompany) {
        if (!productionMap.has(knownCompany.id)) {
          productionMap.set(knownCompany.id, { label: knownCompany.label, movies: [] });
        }
        productionMap.get(knownCompany.id)!.movies.push(movie);
        break; // Only add to one production company
      }
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [, data] of productionMap) {
    if (data.movies.length >= 4) {
      const shuffled = [...data.movies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: data.label,
        type: 'production',
      });
    }
  }

  return groups;
}

function analyzeWordplay(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const wordMap = new Map<string, TMDBMovieDetails[]>();

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'as', 'is', 'was', 'are', 'been', 'be', 'part', 'movie',
  ]);

  for (const movie of movies) {
    const words = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4 && !stopWords.has(word)); // Increased min length to 5

    for (const word of words) {
      if (!wordMap.has(word)) {
        wordMap.set(word, []);
      }
      wordMap.get(word)!.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [word, wordMovies] of wordMap) {
    if (wordMovies.length >= 4 && wordMovies.length <= 8) { // Not too common
      const shuffled = [...wordMovies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: `"${word.charAt(0).toUpperCase() + word.slice(1)}" in the title`,
        type: 'wordplay',
      });
    }
  }

  return groups;
}

function selectNonOverlappingGroups(
  allGroups: PotentialGroup[],
  count = 4
): PotentialGroup[] {
  const selected: PotentialGroup[] = [];
  const usedMovieIds = new Set<number>();

  // Group potential groups by their color
  const groupsByColor = new Map<string, PotentialGroup[]>();

  for (const group of allGroups) {
    const color = DIFFICULTY_COLORS[group.type].color;
    if (!groupsByColor.has(color)) {
      groupsByColor.set(color, []);
    }
    groupsByColor.get(color)!.push(group);
  }

  // Shuffle groups within each color to add variety
  for (const [color, groups] of groupsByColor) {
    groupsByColor.set(color, groups.sort(() => Math.random() - 0.5));
  }

  // Try to select one group of each color (yellow, green, blue, purple)
  const requiredColors = ['yellow', 'green', 'blue', 'purple'];

  for (const color of requiredColors) {
    if (selected.length >= count) break;

    const groupsOfColor = groupsByColor.get(color) || [];

    // Find first group of this color that doesn't overlap with selected films
    for (const group of groupsOfColor) {
      const hasOverlap = group.films.some((film) => usedMovieIds.has(film.id));

      if (!hasOverlap) {
        selected.push(group);
        group.films.forEach((film) => usedMovieIds.add(film.id));
        break; // Move to next color
      }
    }
  }

  return selected;
}

const DIFFICULTY_COLORS: Record<string, { difficulty: string; color: string }> = {
  director: { difficulty: 'easy', color: 'yellow' },
  actor: { difficulty: 'easy', color: 'yellow' },
  franchise: { difficulty: 'medium', color: 'green' },
  theme: { difficulty: 'medium', color: 'green' },
  production: { difficulty: 'hard', color: 'blue' },
  wordplay: { difficulty: 'hardest', color: 'purple' },
};

export async function generateTestPuzzle(): Promise<{
  groups: Group[];
  films: Film[];
}> {
  // Simple test puzzle with one group of each color
  const groups: Group[] = [
    {
      id: 'test-yellow',
      films: [
        { id: 1, title: 'Yellow Film 1', year: 2020 },
        { id: 2, title: 'Yellow Film 2', year: 2021 },
        { id: 3, title: 'Yellow Film 3', year: 2022 },
        { id: 4, title: 'Yellow Film 4', year: 2023 },
      ],
      connection: 'Yellow Group (Easy)',
      difficulty: 'easy',
      color: 'yellow',
    },
    {
      id: 'test-green',
      films: [
        { id: 5, title: 'Green Film 1', year: 2020 },
        { id: 6, title: 'Green Film 2', year: 2021 },
        { id: 7, title: 'Green Film 3', year: 2022 },
        { id: 8, title: 'Green Film 4', year: 2023 },
      ],
      connection: 'Green Group (Medium)',
      difficulty: 'medium',
      color: 'green',
    },
    {
      id: 'test-blue',
      films: [
        { id: 9, title: 'Blue Film 1', year: 2020 },
        { id: 10, title: 'Blue Film 2', year: 2021 },
        { id: 11, title: 'Blue Film 3', year: 2022 },
        { id: 12, title: 'Blue Film 4', year: 2023 },
      ],
      connection: 'Blue Group (Hard)',
      difficulty: 'hard',
      color: 'blue',
    },
    {
      id: 'test-purple',
      films: [
        { id: 13, title: 'Purple Film 1', year: 2020 },
        { id: 14, title: 'Purple Film 2', year: 2021 },
        { id: 15, title: 'Purple Film 3', year: 2022 },
        { id: 16, title: 'Purple Film 4', year: 2023 },
      ],
      connection: 'Purple Group (Hardest)',
      difficulty: 'hardest',
      color: 'purple',
    },
  ];

  const films = groups.flatMap((group) => group.films);
  const shuffledFilms = shuffleArray(films);

  return {
    groups,
    films: shuffledFilms,
  };
}

export async function generatePuzzle(): Promise<{
  groups: Group[];
  films: Film[];
}> {
  // Fetch random pool of movies with extended details
  const moviePool = await tmdbService.getRandomMoviePool(200);

  // Analyze pool to find all potential groupings
  const directorGroups = analyzeDirectors(moviePool);
  const actorGroups = analyzeActors(moviePool);
  const franchiseGroups = analyzeFranchises(moviePool);
  const themeGroups = analyzeThemes(moviePool);
  const productionGroups = analyzeProduction(moviePool);
  const wordplayGroups = analyzeWordplay(moviePool);

  // Combine all potential groups
  const allPotentialGroups = [
    ...directorGroups,
    ...actorGroups,
    ...franchiseGroups,
    ...themeGroups,
    ...productionGroups,
    ...wordplayGroups,
  ];

  // Select 4 non-overlapping groups with priority for more interesting connections
  const selectedGroups = selectNonOverlappingGroups(allPotentialGroups, 4);

  // If we couldn't find 4 non-overlapping groups, retry
  if (selectedGroups.length < 4) {
    console.warn(
      `Only found ${selectedGroups.length} groups, retrying puzzle generation...`
    );
    return generatePuzzle();
  }

  // Convert to Group format with difficulty/color based on type
  const groups: Group[] = selectedGroups.map((pg, index) => ({
    id: `${pg.type}-${index}`,
    films: pg.films.map(tmdbMovieToFilm),
    connection: pg.connection,
    difficulty: DIFFICULTY_COLORS[pg.type].difficulty as any,
    color: DIFFICULTY_COLORS[pg.type].color as any,
  }));

  // Flatten and shuffle all films
  const films = groups.flatMap((group) => group.films);
  const shuffledFilms = shuffleArray(films);

  return {
    groups,
    films: shuffledFilms,
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export { shuffleArray };
