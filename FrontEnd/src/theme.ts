import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform, useColorScheme } from 'react-native';

export const colors = {
  background: '#f7f8fb',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  ink: '#101828',
  muted: '#667085',
  border: '#d9dee8',
  primary: '#b42318',
  primaryDark: '#7a271a',
  accent: '#0f766e',
  warning: '#f59e0b',
  success: '#067647',
  danger: '#b42318',
  blue: '#175cd3',
  disabled: '#98a2b3',
};

export const darkColors = {
  background: '#050505',
  surface: '#111111',
  surfaceAlt: '#171717',
  ink: '#ffffff',
  muted: '#a7b0c0',
  border: '#242424',
  primary: '#f4f4f5',
  primaryDark: '#d4d4d8',
  accent: '#8edbd2',
  warning: '#fbbf24',
  success: '#86efac',
  danger: '#fca5a5',
  blue: '#7dd3fc',
  disabled: '#525866',
};

export type ThemeMode = 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const THEME_KEY = 'cinema.themeMode';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [mode, setModeState] = useState<ThemeMode>(systemMode);

  useEffect(() => {
    let active = true;

    async function restoreTheme() {
      const storedMode = await getStoredThemeMode();

      if (active && storedMode) {
        setModeState(storedMode);
      }
    }

    void restoreTheme();

    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setStoredThemeMode(nextMode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode,
    }),
    [mode, setMode],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useThemePreference() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemePreference must be used within ThemeProvider');
  }

  return context;
}

export function useThemeMode(): ThemeMode {
  return useThemePreference().mode;
}

export function useAppTheme() {
  return useThemeMode() === 'dark' ? darkColors : colors;
}

async function getStoredThemeMode() {
  const value = Platform.OS === 'web'
    ? globalThis.localStorage?.getItem(THEME_KEY) ?? null
    : await SecureStore.getItemAsync(THEME_KEY);

  return value === 'light' || value === 'dark' ? value : null;
}

async function setStoredThemeMode(mode: ThemeMode) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(THEME_KEY, mode);
    return;
  }

  await SecureStore.setItemAsync(THEME_KEY, mode);
}

export const radius = {
  sm: 6,
  md: 8,
};

export const shadow = {
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  soft: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
};
