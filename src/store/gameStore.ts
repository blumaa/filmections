import { create } from 'zustand';
import type { GameState, Group, Film } from '../types';
import { shuffleArray } from '../utils';
import { trackEvent, EVENTS } from '../services/analytics';

interface GameActions {
  selectFilm: (filmId: number) => void;
  deselectAll: () => void;
  submitGuess: () => void;
  shuffleFilms: () => void;
  initializeGame: (films: Film[], groups: Group[], puzzleDate: string) => void;
  restoreCompletedGame: (groups: Group[], won: boolean, mistakes: number) => void;
  resetGame: () => void;
  clearNotification: () => void;
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
  isShaking: false,
  puzzleDate: null,

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

    const { puzzleDate } = get();
    const wasOneAway = !matchedGroup && groups.some((group) => {
      const groupFilmIds = group.films.map((f) => f.id);
      const matchCount = sortedGuess.filter((id) => groupFilmIds.includes(id)).length;
      return matchCount === 3;
    });

    if (matchedGroup) {
      // Correct guess!
      const newFoundGroups = [...foundGroups, matchedGroup];
      const remainingFilms = films.filter(
        (film) => !matchedGroup.films.some((f) => f.id === film.id)
      );

      const isGameWon = newFoundGroups.length === 4;

      set({
        foundGroups: newFoundGroups,
        films: remainingFilms,
        selectedFilmIds: [],
        previousGuesses: [...previousGuesses, sortedGuess],
        gameStatus: isGameWon ? 'won' : 'playing',
      });

      // Track events
      trackEvent(EVENTS.GUESS_SUBMITTED, {
        puzzleDate,
        isCorrect: true,
        mistakeCount: mistakes,
        wasOneAway: false,
      });

      trackEvent(EVENTS.GROUP_FOUND, {
        puzzleDate,
        groupIndex: newFoundGroups.length,
        difficulty: matchedGroup.difficulty,
        mistakesSoFar: mistakes,
      });

      if (isGameWon) {
        trackEvent(EVENTS.GAME_WON, {
          puzzleDate,
          mistakes,
          groupsFound: 4,
        });
      }
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

      // Track events
      trackEvent(EVENTS.GUESS_SUBMITTED, {
        puzzleDate,
        isCorrect: false,
        mistakeCount: newMistakes,
        wasOneAway,
      });

      if (isGameLost) {
        trackEvent(EVENTS.GAME_LOST, {
          puzzleDate,
          mistakes: newMistakes,
          groupsFound: foundGroups.length,
        });
      }

      // Reset shake animation after 500ms
      setTimeout(() => set({ isShaking: false }), 500);
    }
  },

  shuffleFilms: () => {
    const { films, puzzleDate } = get();
    set({ films: shuffleArray(films) });
    trackEvent(EVENTS.FILMS_SHUFFLED, { puzzleDate });
  },

  /**
   * Initialize game with puzzle data from storage.
   * Replaces the old newGame() method which generated puzzles.
   *
   * @param films - Shuffled array of films
   * @param groups - Array of groups
   * @param puzzleDate - Date of puzzle in YYYY-MM-DD format
   */
  initializeGame: (films: Film[], groups: Group[], puzzleDate: string) => {
    set({
      films: shuffleArray(films),
      groups,
      selectedFilmIds: [],
      foundGroups: [],
      previousGuesses: [],
      mistakes: 0,
      gameStatus: 'playing',
      isLoading: false,
      puzzleDate,
    });
  },

  /**
   * Restore a completed game state (for users who already played today).
   * Shows the final state without allowing replay.
   *
   * @param groups - Array of groups from the puzzle
   * @param won - Whether user won
   * @param mistakes - Number of mistakes made
   */
  restoreCompletedGame: (groups: Group[], won: boolean, mistakes: number) => {
    set({
      films: [],
      groups,
      selectedFilmIds: [],
      foundGroups: groups,
      previousGuesses: [],
      mistakes,
      gameStatus: won ? 'won' : 'lost',
      isLoading: false,
      notification: null,
      isShaking: false,
    });
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
      isShaking: false,
      puzzleDate: null,
    });
  },

  clearNotification: () => {
    set({ notification: null });
  },
}));
