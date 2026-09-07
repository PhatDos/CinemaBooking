import { StyleSheet } from 'react-native';

import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    zIndex: 50,
    paddingHorizontal: 18,
    paddingTop: 64,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...shadow.card,
  },
  info: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  success: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  error: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  message: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
