/**
 * Shuffling Utilities
 *
 * Functions for randomizing array order using Fisher-Yates algorithm.
 */

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 *
 * Creates a new array without mutating the original.
 * Provides uniform randomness with O(n) time complexity.
 *
 * Algorithm:
 * 1. Start from the last element
 * 2. Pick a random index from 0 to current position
 * 3. Swap elements
 * 4. Move to previous element and repeat
 *
 * @param array - Array to shuffle
 * @returns Shuffled copy of the array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Shuffle multiple arrays in sync.
 *
 * Maintains correspondence between arrays by applying
 * the same shuffling pattern to all of them.
 *
 * Useful for shuffling parallel arrays (e.g., data and labels).
 *
 * @param arrays - Arrays to shuffle in sync
 * @returns Tuple of shuffled arrays
 */
export function shuffleArraysInSync<T extends unknown[][]>(
  ...arrays: T
): T {
  if (arrays.length === 0) {
    return [] as unknown as T;
  }

  const length = arrays[0].length;

  // Verify all arrays have same length
  if (!arrays.every((arr) => arr.length === length)) {
    throw new Error('All arrays must have the same length');
  }

  // Generate shuffle indices
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Apply same shuffle to all arrays
  return arrays.map((arr) => indices.map((i) => arr[i])) as T;
}
