import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

const STORAGE_KEY = '@lnreader/color-scheme';

export type ColorSchemePreference = 'light' | 'dark' | 'system';

type ColorSchemeContextValue = {
  colorScheme: 'light' | 'dark';
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
};

export const ColorSchemeContext = createContext<ColorSchemeContextValue | null>(null);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ColorSchemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
  }, []);

  const setPreference = useCallback((value: ColorSchemePreference) => {
    setPreferenceState(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  }, []);

  const colorScheme: 'light' | 'dark' =
    preference === 'system'
      ? (systemScheme ?? 'light')
      : preference;

  const value: ColorSchemeContextValue = {
    colorScheme,
    preference,
    setPreference,
  };

  return (
    <ColorSchemeContext.Provider value={value}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorSchemeContext() {
  const ctx = useContext(ColorSchemeContext);
  if (!ctx) {
    throw new Error('useColorSchemeContext must be used within ColorSchemeProvider');
  }
  return ctx;
}
