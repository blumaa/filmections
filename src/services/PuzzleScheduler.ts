/**
 * Puzzle Scheduler
 *
 * Handles daily puzzle loading and scheduling logic.
 * Encapsulates puzzle date management and completion tracking.
 */

import type { IPuzzleStorage } from '../lib/supabase/storage';
import type { IStatsStorage } from '../types/stats';
import type { SavedPuzzle } from '../lib/puzzle-engine/types';
import { getTodayDate } from '../utils/date';

/**
 * PuzzleScheduler
 *
 * Manages daily puzzle access and scheduling.
 */
export class PuzzleScheduler {
  constructor(
    private storage: IPuzzleStorage,
    private stats: IStatsStorage
  ) {}

  /**
   * Get today's puzzle
   */
  async getTodaysPuzzle(): Promise<SavedPuzzle | null> {
    const today = getTodayDate();
    return this.storage.getDailyPuzzle(today);
  }

  /**
   * Get puzzle for a specific date
   */
  async getPuzzleForDate(date: string): Promise<SavedPuzzle | null> {
    return this.storage.getDailyPuzzle(date);
  }

  /**
   * Check if user has completed today's puzzle
   */
  async hasUserCompletedToday(): Promise<boolean> {
    const today = getTodayDate();
    const userStats = await this.stats.getStats();

    // Check if user has any game history
    if (!userStats.gameHistory.length) {
      return false;
    }

    // Check if the most recent game was today
    const mostRecentGame = userStats.gameHistory[userStats.gameHistory.length - 1];
    return mostRecentGame.date === today;
  }

  /**
   * Get the next available date without an assigned puzzle
   * Useful for admin scheduling of new puzzles
   */
  async getNextAvailableDate(): Promise<string> {
    const today = getTodayDate();
    const currentDate = this.parseDate(today);
    let daysChecked = 0;

    // Start checking from today
    while (daysChecked <= 365) {
      const dateString = this.formatDate(currentDate);
      const puzzle = await this.storage.getDailyPuzzle(dateString);

      // If no puzzle exists for this date, return it
      if (!puzzle) {
        return dateString;
      }

      // Move to next day
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      daysChecked++;
    }

    throw new Error('No available dates found within next 365 days');
  }

  /**
   * Parse a date string (YYYY-MM-DD) into a Date object in UTC
   */
  private parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Format a Date object as YYYY-MM-DD in UTC
   */
  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
