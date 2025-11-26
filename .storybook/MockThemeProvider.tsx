import { ReactNode } from 'react';
import { ThemeContext } from '../src/providers/useThemeContext';

export function MockThemeProvider({ children }: { children: ReactNode }) {
  const theme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';

  return (
    <ThemeContext.Provider value={{
      theme,
      isDarkMode: theme === 'dark',
      setTheme: () => {},
      toggleTheme: () => {},
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
