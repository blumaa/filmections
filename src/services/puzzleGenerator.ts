import type {
  Film,
  Group,
  TMDBMovieDetails,
} from '../types';
import { tmdbService } from './tmdb';

interface PotentialGroup {
  films: TMDBMovieDetails[];
  connection: string;
  type: 'director' | 'actor' | 'genre' | 'decade' | 'wordplay';
}

function tmdbMovieToFilm(movie: TMDBMovieDetails): Film {
  return {
    id: movie.id,
    title: movie.title,
    year: new Date(movie.release_date).getFullYear(),
    poster_path: movie.poster_path || undefined,
  };
}

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
      // Shuffle and take 4 random movies
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
    const topActors = movie.credits?.cast?.slice(0, 10) || [];

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

function analyzeGenres(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const genreMap = new Map<number, { name: string; movies: TMDBMovieDetails[] }>();

  for (const movie of movies) {
    for (const genre of movie.genres || []) {
      if (!genreMap.has(genre.id)) {
        genreMap.set(genre.id, { name: genre.name, movies: [] });
      }
      genreMap.get(genre.id)!.movies.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [, data] of genreMap) {
    if (data.movies.length >= 4) {
      const shuffled = [...data.movies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: `${data.name} films`,
        type: 'genre',
      });
    }
  }

  return groups;
}

function analyzeDecades(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const decadeMap = new Map<number, TMDBMovieDetails[]>();

  for (const movie of movies) {
    const year = new Date(movie.release_date).getFullYear();
    const decade = Math.floor(year / 10) * 10;

    if (!decadeMap.has(decade)) {
      decadeMap.set(decade, []);
    }
    decadeMap.get(decade)!.push(movie);
  }

  const groups: PotentialGroup[] = [];

  for (const [decade, decadeMovies] of decadeMap) {
    if (decadeMovies.length >= 4) {
      const shuffled = [...decadeMovies].sort(() => Math.random() - 0.5);
      groups.push({
        films: shuffled.slice(0, 4),
        connection: `Films from the ${decade}s`,
        type: 'decade',
      });
    }
  }

  return groups;
}

function analyzeWordplay(movies: TMDBMovieDetails[]): PotentialGroup[] {
  const wordMap = new Map<string, TMDBMovieDetails[]>();

  // Common English words to filter out
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'been',
    'be',
  ]);

  for (const movie of movies) {
    const words = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));

    for (const word of words) {
      if (!wordMap.has(word)) {
        wordMap.set(word, []);
      }
      wordMap.get(word)!.push(movie);
    }
  }

  const groups: PotentialGroup[] = [];

  for (const [word, wordMovies] of wordMap) {
    if (wordMovies.length >= 4) {
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

  // Shuffle all groups to randomize selection
  const shuffled = [...allGroups].sort(() => Math.random() - 0.5);

  for (const group of shuffled) {
    if (selected.length >= count) break;

    // Check if any film in this group is already used
    const hasOverlap = group.films.some((film) => usedMovieIds.has(film.id));

    if (!hasOverlap) {
      selected.push(group);
      group.films.forEach((film) => usedMovieIds.add(film.id));
    }
  }

  return selected;
}

const DIFFICULTY_COLORS: Record<string, { difficulty: string; color: string }> = {
  director: { difficulty: 'easy', color: 'yellow' },
  actor: { difficulty: 'easy', color: 'yellow' },
  genre: { difficulty: 'medium', color: 'green' },
  decade: { difficulty: 'hard', color: 'blue' },
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
  // Fetch random pool of movies
  const moviePool = await tmdbService.getRandomMoviePool(200);

  // Analyze pool to find all potential groupings
  const directorGroups = analyzeDirectors(moviePool);
  const actorGroups = analyzeActors(moviePool);
  const genreGroups = analyzeGenres(moviePool);
  const decadeGroups = analyzeDecades(moviePool);
  const wordplayGroups = analyzeWordplay(moviePool);

  // Combine all potential groups
  const allPotentialGroups = [
    ...directorGroups,
    ...actorGroups,
    ...genreGroups,
    ...decadeGroups,
    ...wordplayGroups,
  ];

  // Select 4 non-overlapping groups
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
