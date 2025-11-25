/**
 * Difficulty Constants
 *
 * Single source of truth for difficulty colors, labels, and mappings.
 */

import type { DifficultyColor, DifficultyLevel } from '../types';

export const DIFFICULTY_COLORS: Record<DifficultyColor, string> = {
  yellow: '#f6c143',
  green: '#6aaa64',
  blue: '#85c0f9',
  purple: '#b19cd9',
};

export const DIFFICULTY_LABELS: Record<DifficultyColor, string> = {
  yellow: 'Easy',
  green: 'Medium',
  blue: 'Hard',
  purple: 'Hardest',
};

export const COLOR_TO_DIFFICULTY: Record<DifficultyColor, DifficultyLevel> = {
  yellow: 'easy',
  green: 'medium',
  blue: 'hard',
  purple: 'hardest',
};

export const DIFFICULTY_TO_COLOR: Record<DifficultyLevel, DifficultyColor> = {
  easy: 'yellow',
  medium: 'green',
  hard: 'blue',
  hardest: 'purple',
};
