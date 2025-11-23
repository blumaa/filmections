import { create } from 'zustand';
import type { GameState } from '../types';
import { generatePuzzle, generateTestPuzzle, shuffleArray } from '../services/puzzleGenerator';

interface GameActions {
  selectFilm: (filmId: number) => void;
  deselectAll: () => void;
  submitGuess: () => void;
  shuffleFilms: () => void;
  newGame: () => Promise<void>;
  resetGame: () => void;
  clearNotification: () => void;
  toggleTestMode: () => Promise<void>;
}

type GameStore = GameState & GameActions;

const MAX_MISTAKES = 4;
const MAX_SELECTIONS = 4;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  films: [],
  groups: [],
  selectedFilmIds: [],
  foundGroups: [],
  previousGuesses: [],
  mistakes: 0,
  gameStatus: 'playing',
  isLoading: false,
  notification: null,
  testMode: false,
  isShaking: false,

  // Actions
  selectFilm: (filmId: number) => {
    const { selectedFilmIds, gameStatus } = get();

    // Can't select if game is over
    if (gameStatus !== 'playing') return;

    // Toggle selection
    if (selectedFilmIds.includes(filmId)) {
      set({ selectedFilmIds: selectedFilmIds.filter((id) => id !== filmId) });
    } else {
      // Can't select more than 4
      if (selectedFilmIds.length >= MAX_SELECTIONS) return;
      set({ selectedFilmIds: [...selectedFilmIds, filmId] });
    }
  },

  deselectAll: () => {
    set({ selectedFilmIds: [] });
  },

  submitGuess: () => {
    const {
      selectedFilmIds,
      groups,
      foundGroups,
      previousGuesses,
      mistakes,
      films,
    } = get();

    // Need exactly 4 selections
    if (selectedFilmIds.length !== MAX_SELECTIONS) return;

    // Sort for comparison
    const sortedGuess = [...selectedFilmIds].sort((a, b) => a - b);

    // Check if this exact combination was tried before
    const isDuplicate = previousGuesses.some(
      (guess) =>
        guess.length === sortedGuess.length &&
        guess.every((id, index) => id === sortedGuess[index])
    );

    if (isDuplicate) {
      set({ notification: 'Already tried!' });
      setTimeout(() => set({ notification: null }), 2000);
      return;
    }

    // Check if guess matches any group
    const matchedGroup = groups.find((group) => {
      const groupFilmIds = group.films.map((f) => f.id).sort((a, b) => a - b);
      return (
        groupFilmIds.length === sortedGuess.length &&
        groupFilmIds.every((id, index) => id === sortedGuess[index])
      );
    });

    // Check if user is "one away" (3 out of 4 correct)
    if (!matchedGroup) {
      const oneAwayGroup = groups.find((group) => {
        const groupFilmIds = group.films.map((f) => f.id);
        const matches = sortedGuess.filter((id) => groupFilmIds.includes(id));
        return matches.length === 3;
      });

      if (oneAwayGroup) {
        set({ notification: 'One away!' });
        setTimeout(() => set({ notification: null }), 2000);
      }
    }

    if (matchedGroup) {
      // Correct guess!
      const newFoundGroups = [...foundGroups, matchedGroup];
      const remainingFilms = films.filter(
        (film) => !matchedGroup.films.some((f) => f.id === film.id)
      );

      set({
        foundGroups: newFoundGroups,
        films: remainingFilms,
        selectedFilmIds: [],
        previousGuesses: [...previousGuesses, sortedGuess],
        gameStatus: newFoundGroups.length === 4 ? 'won' : 'playing',
      });
    } else {
      // Wrong guess
      const newMistakes = mistakes + 1;
      const isGameLost = newMistakes >= MAX_MISTAKES;

      set({
        mistakes: newMistakes,
        previousGuesses: [...previousGuesses, sortedGuess],
        gameStatus: isGameLost ? 'lost' : 'playing',
        // Reveal all groups when game is lost
        foundGroups: isGameLost ? groups : foundGroups,
        films: isGameLost ? [] : films,
        isShaking: true,
      });

      // Reset shake animation after 500ms
      setTimeout(() => set({ isShaking: false }), 500);
    }
  },

  shuffleFilms: () => {
    const { films } = get();
    set({ films: shuffleArray(films) });
  },

  newGame: async () => {
    const { testMode } = get();
    set({ isLoading: true });

    try {
      const puzzle = testMode ? await generateTestPuzzle() : await generatePuzzle();

      set({
        films: puzzle.films,
        groups: puzzle.groups,
        selectedFilmIds: [],
        foundGroups: [],
        previousGuesses: [],
        mistakes: 0,
        gameStatus: 'playing',
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      set({ isLoading: false });
    }
  },

  resetGame: () => {
    set({
      films: [],
      groups: [],
      selectedFilmIds: [],
      foundGroups: [],
      previousGuesses: [],
      mistakes: 0,
      gameStatus: 'playing',
      isLoading: false,
      notification: null,
      testMode: true,
      isShaking: false,
    });
  },

  clearNotification: () => {
    set({ notification: null });
  },

  toggleTestMode: async () => {
    const { testMode, newGame } = get();
    set({ testMode: !testMode });
    // Start a new game with the new mode
    await newGame();
  },
}));
