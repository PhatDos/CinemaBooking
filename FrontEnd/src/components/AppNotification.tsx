import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Modal, Text, View } from 'react-native';

import { styles } from '@/src/styles/components/app-notification.styles';

type NotificationTone = 'success' | 'error' | 'info';

type NotificationOptions = {
  durationMs?: number;
  tone?: NotificationTone;
};

type NotificationState = {
  id: number;
  message: string;
  tone: NotificationTone;
  durationMs: number;
};

type AppNotificationContextValue = {
  showNotification: (message: string, options?: NotificationOptions) => void;
};

const AppNotificationContext =
  createContext<AppNotificationContextValue | undefined>(undefined);

export function AppNotificationProvider({ children }: PropsWithChildren) {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const showNotification = useCallback(
    (message: string, options: NotificationOptions = {}) => {
      setNotification({
        id: Date.now(),
        durationMs: options.durationMs ?? 2400,
        message,
        tone: options.tone ?? 'info',
      });
    },
    [],
  );

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setNotification((current) =>
        current?.id === notification.id ? null : current,
      );
    }, notification.durationMs);

    return () => clearTimeout(timeoutId);
  }, [notification]);

  const value = useMemo(
    () => ({ showNotification }),
    [showNotification],
  );

  return (
    <AppNotificationContext.Provider value={value}>
      {children}
      <Modal
        animationType="fade"
        onRequestClose={() => setNotification(null)}
        transparent
        visible={notification !== null}>
        <View style={styles.scrim}>
          {notification ? (
            <View style={[styles.card, styles[notification.tone]]}>
              <Text style={styles.title}>{getTitle(notification.tone)}</Text>
              <Text style={styles.message}>{notification.message}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </AppNotificationContext.Provider>
  );
}

export function useAppNotification() {
  const context = useContext(AppNotificationContext);

  if (!context) {
    throw new Error('useAppNotification must be used within AppNotificationProvider');
  }

  return context;
}

function getTitle(tone: NotificationTone) {
  switch (tone) {
    case 'success':
      return 'Done';
    case 'error':
      return 'Something went wrong';
    default:
      return 'Notice';
  }
}
