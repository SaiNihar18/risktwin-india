import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';

const TestToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button data-testid="theme-toggle" onClick={toggleTheme}>
      {theme}
    </button>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.removeItem('risktwin-theme');
    document.documentElement.classList.remove('dark', 'light');
  });

  it('initializes to dark by default and toggles to light', () => {
    render(
      <ThemeProvider>
        <TestToggle />
      </ThemeProvider>
    );

    // default from hook is 'dark'
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('risktwin-theme')).toBe('dark');

    // click to toggle
    fireEvent.click(screen.getByTestId('theme-toggle'));

    // We only toggle the `dark` class (Tailwind uses presence of `dark`).
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('risktwin-theme')).toBe('light');
  });
});
