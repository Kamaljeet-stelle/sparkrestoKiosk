import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type Palette } from './colors';

type ThemeChoice = 'light' | 'dark';

type Theme = {
  colors: Palette;
  isDark: boolean;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'sparkresto.theme';

const ThemeContext = createContext<Theme>({
  colors: lightColors,
  isDark: false,
  toggleTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [choice, setChoice] = useState<ThemeChoice | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (cancelled) {
          return;
        }
        if (value === 'light' || value === 'dark') {
          setChoice(value);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setChoice(current => {
      const active = current ?? (system === 'dark' ? 'dark' : 'light');
      const next: ThemeChoice = active === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, [system]);

  const isDark = (choice ?? (system === 'dark' ? 'dark' : 'light')) === 'dark';
  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      toggleTheme,
    }),
    [isDark, toggleTheme],
  );

  if (!hydrated) {
    const splash = system === 'dark' ? darkColors.canvas : lightColors.canvas;
    return <View style={[styles.splash, { backgroundColor: splash }]} />;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
  },
});
