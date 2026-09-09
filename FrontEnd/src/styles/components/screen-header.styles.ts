import { StyleSheet } from 'react-native';

import { colors, radius } from '@/src/theme';

export const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#d7dde8',
    backgroundColor: '#edf1f7',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 0,
  },
  headerDark: {
    borderBottomColor: '#202020',
    backgroundColor: '#080808',
  },
  topRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  divider: {
    height: 1,
    marginTop: 10,
    backgroundColor: '#cfd6e2',
  },
  dividerDark: {
    backgroundColor: '#242424',
  },
  backButton: {
    minWidth: 62,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  backButtonDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#151515',
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  backButtonTextDark: {
    color: '#ffffff',
  },
  topSpacer: {
    minWidth: 62,
    minHeight: 40,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
});
