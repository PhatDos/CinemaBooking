import { StyleSheet } from 'react-native';
import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#050505',
  },
  chipSection: {
    paddingTop: 52,
  },
  chipRail: {
    gap: 12,
    paddingHorizontal: 23,
    paddingBottom: 8,
  },
  filterChip: {
    maxWidth: 180,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  filterChipDark: {
    borderColor: '#242424',
    backgroundColor: '#050505',
  },
  filterChipSelected: {
    borderColor: colors.border,
    backgroundColor: '#ffffff',
  },
  filterChipSelectedDark: {
    borderColor: '#8a8a8a',
    backgroundColor: '#ffffff',
  },
  filterChipText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  filterChipTextDark: {
    color: '#c8ced8',
  },
  filterChipTextSelected: {
    color: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 23,
    paddingTop: 26,
    paddingBottom: 14,
  },
  heading: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  headingDark: {
    color: '#ffffff',
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  countDark: {
    color: '#a7b0c0',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: bottomNavHeight + 28,
  },
  emptyList: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: bottomNavHeight + 28,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  cardWrap: {
    width: '50%',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '50%',
    paddingHorizontal: 7,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  poster: {
    width: '100%',
    aspectRatio: 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#e8edf5',
    overflow: 'hidden',
  },
  posterText: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  info: {
    paddingTop: 10,
    overflow: 'hidden',
  },
  title: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },
  titleDark: {
    color: '#ffffff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 8,
    overflow: 'hidden',
  },
  meta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  metaGenre: {
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
  },
  metaDivider: {
    flexShrink: 0,
  },
  metaDuration: {
    flexShrink: 0,
  },
  metaDark: {
    color: '#c4cad4',
  },
  dot: {
    color: colors.disabled,
    fontSize: 11,
    fontWeight: '900',
  },
  dotDark: {
    color: '#788190',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  centerDark: {
    backgroundColor: '#050505',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyTitleDark: {
    color: '#ffffff',
  },
  emptyText: {
    marginTop: 8,
    color: '#a7b0c0',
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#a7b0c0',
  },
  error: {
    color: '#fca5a5',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.surface,
    fontWeight: '900',
  },
});
