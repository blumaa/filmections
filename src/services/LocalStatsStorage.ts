/**
 * Local Stats Storage
 *
 * Implements stats storage using browser localStorage.
 * Handles anonymous user stats and streak calculation.
 */

import type { IStatsStorage, UserStats, GameResult } from '../types/stats';
import { getTodayDate } from '../utils/date';

const STORAGE_KEY = 'filmections-stats';

/**
 * Get the date for yesterday in YYYY-MM-DD format
 */
function getYesterdayDate(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Default empty stats
 */
function getDefaultStats(): UserStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    gameHistory: [],
  };
}

/**
 * Calculate streak based on last played date, current streak, and whether user won
 * Streak only continues/increments on wins. Losses reset the streak to 0.
 */
function calculateStreak(lastPlayedDate: string | null, currentStreak: number, won: boolean): number {
  // If user lost, streak is broken
  if (!won) {
    return 0;
  }

  const today = getTodayDate();
  const yesterday = getYesterdayDate();

  // First game ever (and won)
  if (!lastPlayedDate) {
    return 1;
  }

  // Already played today (shouldn't happen in normal flow, but handle it)
  if (lastPlayedDate === today) {
    return currentStreak;
  }

  // Played yesterday and won today - continue streak
  if (lastPlayedDate === yesterday) {
    return currentStreak + 1;
  }

  // Missed a day but won today - start new streak
  return 1;
}

/**
 * LocalStatsStorage
 *
 * Stores user stats in browser localStorage.
 * Handles streak calculation and game result recording.
 */
export class LocalStatsStorage implements IStatsStorage {
  /**
   * Get current stats from localStorage
   */
  async getStats(): Promise<UserStats> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return getDefaultStats();
      }

      const stats = JSON.parse(stored) as UserStats;
      return stats;
    } catch (error) {
      console.error('Failed to get stats from localStorage:', error);
      return getDefaultStats();
    }
  }

  /**
   * Record a completed game and update stats
   */
  async recordCompletion(result: GameResult): Promise<UserStats> {
    try {
      const stats = await this.getStats();
      const today = getTodayDate();

      // Don't record duplicate games for the same day
      const alreadyPlayedToday = stats.gameHistory.some((game) => game.date === today);
      if (alreadyPlayedToday) {
        console.warn('Game already recorded for today');
        return stats;
      }

      // Update basic stats
      const newGamesPlayed = stats.gamesPlayed + 1;
      const newGamesWon = result.won ? stats.gamesWon + 1 : stats.gamesWon;
      const newWinRate = Math.round((newGamesWon / newGamesPlayed) * 100);

      // Calculate new streak (only continues on wins)
      const newCurrentStreak = calculateStreak(stats.lastPlayedDate, stats.currentStreak, result.won);
      const newMaxStreak = Math.max(stats.maxStreak, newCurrentStreak);

      // Add to history
      const newGameHistory = [...stats.gameHistory, result];

      // Create updated stats
      const updatedStats: UserStats = {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        winRate: newWinRate,
        currentStreak: newCurrentStreak,
        maxStreak: newMaxStreak,
        lastPlayedDate: today,
        gameHistory: newGameHistory,
      };

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStats));

      return updatedStats;
    } catch (error) {
      console.error('Failed to record game completion:', error);
      throw error;
    }
  }

  /**
   * Reset all stats (useful for testing)
   */
  async resetStats(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset stats:', error);
      throw error;
    }
  }
}
