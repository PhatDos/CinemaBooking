import { StyleSheet } from 'react-native';

import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#050505',
  },
  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: bottomNavHeight + 24,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#a7b0c0',
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
  groupDark: {
    borderColor: '#242424',
    backgroundColor: '#111111',
    shadowColor: '#000000',
  },
  appearanceRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  appearanceText: {
    flex: 1,
    minWidth: 0,
  },
  appearanceTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  appearanceMeta: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  themeSwitch: {
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: 4,
  },
  themeSwitchDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#080808',
  },
  themeOption: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  themeOptionActive: {
    backgroundColor: colors.ink,
  },
  themeOptionActiveDark: {
    backgroundColor: '#ffffff',
  },
  themeOptionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  themeOptionTextDark: {
    color: '#a7b0c0',
  },
  themeOptionTextActive: {
    color: colors.surface,
  },
  themeOptionTextActiveDark: {
    color: '#050505',
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
  rowBorderDark: {
    borderBottomColor: '#2a2a2a',
  },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
  },
  iconWrapDark: {
    backgroundColor: '#ffffff',
  },
  rowLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  rowLabelDark: {
    color: '#ffffff',
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
