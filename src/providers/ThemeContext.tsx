import { ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ThemeContext } from './useThemeContext';

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const themeValue = useTheme();

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
}
