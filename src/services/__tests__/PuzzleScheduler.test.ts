/**
 * PuzzleScheduler Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PuzzleScheduler } from '../PuzzleScheduler';
import type { IPuzzleStorage } from '../../lib/supabase/storage';
import type { IStatsStorage, UserStats } from '../../types/stats';
import type { SavedPuzzle } from '../../lib/puzzle-engine/types';

// Mock getTodayDate
vi.mock('../../utils/date', () => ({
  getTodayDate: () => '2025-01-15',
}));

describe('PuzzleScheduler', () => {
  let mockStorage: IPuzzleStorage;
  let mockStats: IStatsStorage;
  let scheduler: PuzzleScheduler;

  const mockPuzzle: SavedPuzzle = {
    id: 'test-puzzle-1',
    films: [],
    groups: [],
    createdAt: Date.now(),
  };

  const emptyStats: UserStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    gameHistory: [],
  };

  beforeEach(() => {
    // Create mock storage
    mockStorage = {
      getDailyPuzzle: vi.fn(),
      savePuzzle: vi.fn(),
      getPuzzle: vi.fn(),
      listPuzzles: vi.fn(),
      updatePuzzle: vi.fn(),
      deletePuzzle: vi.fn(),
    };

    // Create mock stats
    mockStats = {
      getStats: vi.fn(),
      recordCompletion: vi.fn(),
      resetStats: vi.fn(),
    };

    scheduler = new PuzzleScheduler(mockStorage, mockStats);
  });

  describe('getTodaysPuzzle', () => {
    it('should return today\'s puzzle', async () => {
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(mockPuzzle);

      const result = await scheduler.getTodaysPuzzle();

      expect(result).toEqual(mockPuzzle);
      expect(mockStorage.getDailyPuzzle).toHaveBeenCalledWith('2025-01-15');
    });

    it('should return null if no puzzle exists', async () => {
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(null);

      const result = await scheduler.getTodaysPuzzle();

      expect(result).toBeNull();
    });
  });

  describe('getPuzzleForDate', () => {
    it('should return puzzle for specific date', async () => {
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(mockPuzzle);

      const result = await scheduler.getPuzzleForDate('2025-01-20');

      expect(result).toEqual(mockPuzzle);
      expect(mockStorage.getDailyPuzzle).toHaveBeenCalledWith('2025-01-20');
    });

    it('should return null if no puzzle exists for date', async () => {
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(null);

      const result = await scheduler.getPuzzleForDate('2025-01-20');

      expect(result).toBeNull();
    });
  });

  describe('hasUserCompletedToday', () => {
    it('should return false if user has no game history', async () => {
      vi.mocked(mockStats.getStats).mockResolvedValue(emptyStats);

      const result = await scheduler.hasUserCompletedToday();

      expect(result).toBe(false);
    });

    it('should return true if user played today', async () => {
      const statsWithTodayGame: UserStats = {
        ...emptyStats,
        gamesPlayed: 1,
        gamesWon: 1,
        gameHistory: [
          {
            date: '2025-01-15', // Today
            won: true,
            mistakes: 0,
            completedAt: Date.now(),
          },
        ],
      };

      vi.mocked(mockStats.getStats).mockResolvedValue(statsWithTodayGame);

      const result = await scheduler.hasUserCompletedToday();

      expect(result).toBe(true);
    });

    it('should return false if user last played yesterday', async () => {
      const statsWithYesterdayGame: UserStats = {
        ...emptyStats,
        gamesPlayed: 1,
        gamesWon: 1,
        gameHistory: [
          {
            date: '2025-01-14', // Yesterday
            won: true,
            mistakes: 0,
            completedAt: Date.now(),
          },
        ],
      };

      vi.mocked(mockStats.getStats).mockResolvedValue(statsWithYesterdayGame);

      const result = await scheduler.hasUserCompletedToday();

      expect(result).toBe(false);
    });

    it('should check only the most recent game', async () => {
      const statsWithMultipleGames: UserStats = {
        ...emptyStats,
        gamesPlayed: 3,
        gamesWon: 2,
        gameHistory: [
          {
            date: '2025-01-10',
            won: true,
            mistakes: 0,
            completedAt: Date.now(),
          },
          {
            date: '2025-01-12',
            won: false,
            mistakes: 4,
            completedAt: Date.now(),
          },
          {
            date: '2025-01-15', // Today
            won: true,
            mistakes: 1,
            completedAt: Date.now(),
          },
        ],
      };

      vi.mocked(mockStats.getStats).mockResolvedValue(statsWithMultipleGames);

      const result = await scheduler.hasUserCompletedToday();

      expect(result).toBe(true);
    });
  });

  describe('getNextAvailableDate', () => {
    it('should return today if no puzzle exists', async () => {
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(null);

      const result = await scheduler.getNextAvailableDate();

      expect(result).toBe('2025-01-15');
    });

    it('should return tomorrow if today has a puzzle', async () => {
      vi.mocked(mockStorage.getDailyPuzzle)
        .mockResolvedValueOnce(mockPuzzle) // Today has puzzle
        .mockResolvedValueOnce(null); // Tomorrow is free

      const result = await scheduler.getNextAvailableDate();

      expect(result).toBe('2025-01-16');
    });

    it('should skip multiple occupied dates', async () => {
      vi.mocked(mockStorage.getDailyPuzzle)
        .mockResolvedValueOnce(mockPuzzle) // 2025-01-15 (today)
        .mockResolvedValueOnce(mockPuzzle) // 2025-01-16
        .mockResolvedValueOnce(mockPuzzle) // 2025-01-17
        .mockResolvedValueOnce(null); // 2025-01-18 is free

      const result = await scheduler.getNextAvailableDate();

      expect(result).toBe('2025-01-18');
    });

    it('should throw error if no date available within 365 days', async () => {
      // Mock all dates as occupied
      vi.mocked(mockStorage.getDailyPuzzle).mockResolvedValue(mockPuzzle);

      await expect(scheduler.getNextAvailableDate()).rejects.toThrow(
        'No available dates found within next 365 days'
      );
    });
  });
});
