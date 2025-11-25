/**
 * Stats Types
 *
 * Type definitions for user stats and game results.
 */

/**
 * Result of a completed game
 */
export interface GameResult {
  /** Date of the game (YYYY-MM-DD format) */
  date: string;
  /** Whether the game was won */
  won: boolean;
  /** Number of mistakes made */
  mistakes: number;
  /** Timestamp when game was completed */
  completedAt: number;
}

/**
 * User statistics
 */
export interface UserStats {
  /** Total games played */
  gamesPlayed: number;
  /** Total games won */
  gamesWon: number;
  /** Win rate as a percentage (0-100) */
  winRate: number;
  /** Current streak of consecutive days played */
  currentStreak: number;
  /** Maximum streak ever achieved */
  maxStreak: number;
  /** Last date played (YYYY-MM-DD format) */
  lastPlayedDate: string | null;
  /** History of game results */
  gameHistory: GameResult[];
}

/**
 * Interface for stats storage implementations
 */
export interface IStatsStorage {
  /**
   * Get stats for a user (or current anonymous user)
   */
  getStats(): Promise<UserStats>;

  /**
   * Record a completed game
   */
  recordCompletion(result: GameResult): Promise<UserStats>;

  /**
   * Reset all stats (useful for testing)
   */
  resetStats(): Promise<void>;
}
