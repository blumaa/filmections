import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'filmections-theme';

/**
 * Gets the user's system color scheme preference
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return isDark ? 'dark' : 'light';
}

/**
 * Gets the initial theme from localStorage or system preference
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';

  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Fall back to system preference
  return getSystemTheme();
}

export interface UseThemeReturn {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Hook for managing theme (light/dark mode)
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Respects system preference (prefers-color-scheme)
 * - Provides toggle and setter functions
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles theme state
 * - Open/Closed: Can be extended without modification
 * - Dependency Inversion: Depends on abstractions (localStorage, window APIs)
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Set data-theme on document root and persist to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Set theme to a specific value
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return {
    theme,
    isDarkMode: theme === 'dark',
    setTheme,
    toggleTheme,
  };
}
