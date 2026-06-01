/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'moonplayer-theme';

export function ThemeProvider({ children }) {
  const [accentOverride, setAccentOverride] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  // Keep CSS custom property in sync with state
  useEffect(() => {
    if (accentOverride) {
      document.documentElement.style.setProperty('--accent-dynamic', accentOverride);
    } else {
      document.documentElement.style.removeProperty('--accent-dynamic');
    }
  }, [accentOverride]);

  const setAccent = useCallback((color) => {
    setAccentOverride(color);
    try {
      if (color) {
        localStorage.setItem(THEME_STORAGE_KEY, color);
      } else {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to save theme accent:', err);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ accentOverride, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
