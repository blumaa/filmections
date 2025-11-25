import { createContext, useContext } from 'react';
import { UseThemeReturn } from '../hooks/useTheme';

export const ThemeContext = createContext<UseThemeReturn | undefined>(undefined);

export function useThemeContext(): UseThemeReturn {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider');
  }
  return context;
}
