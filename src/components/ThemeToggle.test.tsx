import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

// Mock the useThemeContext hook
vi.mock('../providers/useThemeContext', () => ({
  useThemeContext: vi.fn(),
}));

import { useThemeContext } from '../providers/useThemeContext';

describe('ThemeToggle', () => {
  it('should render a button', () => {
    vi.mocked(useThemeContext).mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should show moon emoji when theme is light', () => {
    vi.mocked(useThemeContext).mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🌙');
  });

  it('should show sun emoji when theme is dark', () => {
    vi.mocked(useThemeContext).mockReturnValue({
      theme: 'dark',
      isDarkMode: true,
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('☀️');
  });

  it('should call toggleTheme when clicked', async () => {
    const toggleTheme = vi.fn();
    vi.mocked(useThemeContext).mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme: vi.fn(),
      toggleTheme,
    });

    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(toggleTheme).toHaveBeenCalledOnce();
  });

  it('should have accessible label', () => {
    vi.mocked(useThemeContext).mockReturnValue({
      theme: 'light',
      isDarkMode: false,
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggle />);

    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });
});
