import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

import { getCurrentUser, login, logout, refreshAuth } from '@/src/api/auth';
import { setAccessToken } from '@/src/api/client';
import type { AuthResponse, CurrentUser } from '@/src/types';

const ACCESS_TOKEN_KEY = 'cinema.accessToken';
const REFRESH_TOKEN_KEY = 'cinema.refreshToken';
const USER_KEY = 'cinema.user';

type AuthContextValue = {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const clearSession = useCallback(async () => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);

    await Promise.all([
      deleteStoredValue(ACCESS_TOKEN_KEY),
      deleteStoredValue(REFRESH_TOKEN_KEY),
      deleteStoredValue(USER_KEY),
    ]);
  }, []);

  const saveSession = useCallback(async (auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    setAccessTokenState(auth.accessToken);

    let nextUser: CurrentUser = {
      userId: auth.userId,
      email: auth.email,
      roles: [],
    };

    try {
      nextUser = await getCurrentUser();
    } catch (error) {
      console.error(error);
    }

    setUser(nextUser);

    await Promise.all([
      setStoredValue(ACCESS_TOKEN_KEY, auth.accessToken),
      setStoredValue(REFRESH_TOKEN_KEY, auth.refreshToken),
      setStoredValue(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedAccessToken, storedRefreshToken, storedUser] = await Promise.all([
          getStoredValue(ACCESS_TOKEN_KEY),
          getStoredValue(REFRESH_TOKEN_KEY),
          getStoredValue(USER_KEY),
        ]);

        if (storedUser) {
          setUser(JSON.parse(storedUser) as CurrentUser);
        }

        if (storedAccessToken) {
          setAccessToken(storedAccessToken);
          setAccessTokenState(storedAccessToken);

          try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            await setStoredValue(USER_KEY, JSON.stringify(currentUser));
            return;
          } catch (error) {
            console.error(error);
          }
        }

        if (storedRefreshToken) {
          const refreshed = await refreshAuth({ refreshToken: storedRefreshToken });
          await saveSession(refreshed);
          return;
        }

        await clearSession();
      } catch (error) {
        console.error(error);
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [clearSession, saveSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const auth = await login({
        email: email.trim(),
        password,
      });

      await saveSession(auth);
    },
    [saveSession],
  );

  const signOut = useCallback(async () => {
    const refreshToken = await getStoredValue(REFRESH_TOKEN_KEY);

    try {
      if (refreshToken) {
        await logout(refreshToken);
      }
    } catch (error) {
      console.error(error);
    } finally {
      await clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken: accessTokenState,
      isAuthenticated: Boolean(accessTokenState),
      isLoading,
      signIn,
      signOut,
      user,
    }),
    [accessTokenState, isLoading, signIn, signOut, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

async function getStoredValue(key: string) {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string) {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
