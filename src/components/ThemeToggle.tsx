import { Button } from '@mond-design-system/theme';
import { useThemeContext } from '../providers/useThemeContext';
import { trackEvent, EVENTS } from '../services/analytics';

/**
 * ThemeToggle Component
 *
 * A simple button for switching between light and dark themes.
 * Uses Mond Design System's Button component.
 *
 * Following SOLID principles:
 * - Single Responsibility: Only handles theme toggle UI
 * - Dependency Inversion: Depends on theme context abstraction
 *
 * Following KISS principle: Simple, straightforward component with no complex logic
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    trackEvent(EVENTS.THEME_TOGGLED, { newTheme });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
}
