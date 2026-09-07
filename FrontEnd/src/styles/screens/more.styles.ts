import { StyleSheet } from 'react-native';

import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 72,
    paddingBottom: bottomNavHeight + 24,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  group: {
    marginTop: 26,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f4',
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
  },
  rowLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  logoutRow: {
    minHeight: 62,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
});
