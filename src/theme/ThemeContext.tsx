import React, { createContext, useCallback, useContext, useState } from 'react';
import { storage } from '../storage';
import { themes, Theme, ThemeName } from './themes';

const THEME_KEY = 'theme';

interface ThemeContextValue {
  theme: Theme;
  setThemeName: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredThemeName(): ThemeName {
  const stored = storage.getString(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] =
    useState<ThemeName>(getStoredThemeName);

  const setThemeName = useCallback((name: ThemeName) => {
    storage.set(THEME_KEY, name);
    setThemeNameState(name);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}
