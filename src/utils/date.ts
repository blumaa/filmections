/**
 * Date Utilities
 *
 * Helper functions for working with dates in daily puzzle context.
 */

/**
 * Get today's date in YYYY-MM-DD format (UTC).
 * Used for loading the daily puzzle.
 *
 * @returns Date string (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (UTC).
 * Used for prefetching tomorrow's puzzle.
 *
 * @returns Date string (YYYY-MM-DD)
 */
export function getTomorrowDate(): string {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getUTCFullYear();
  const month = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display.
 *
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "November 24, 2025")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Get yesterday's date in YYYY-MM-DD format (UTC).
 * Used for streak calculation.
 *
 * @returns Date string (YYYY-MM-DD)
 */
export function getYesterdayDate(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const year = yesterday.getUTCFullYear();
  const month = String(yesterday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate puzzle number from a date.
 * Puzzle #1 starts on January 1, 2025.
 *
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Puzzle number
 */
export function getPuzzleNumber(dateString: string): number {
  const startDate = new Date('2025-01-01T00:00:00Z');
  const targetDate = new Date(dateString + 'T00:00:00Z');
  const diffTime = targetDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Puzzle #1 is on Jan 1
}

/**
 * Format date for puzzle header display.
 *
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Formatted string (e.g., "Filmections #329 - November 24, 2025")
 */
export function formatPuzzleHeader(dateString: string): string {
  const puzzleNumber = getPuzzleNumber(dateString);
  const formattedDate = formatDate(dateString);
  return `Filmections #${puzzleNumber} - ${formattedDate}`;
}
