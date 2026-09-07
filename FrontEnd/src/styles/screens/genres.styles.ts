import { StyleSheet } from 'react-native';
import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heading: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  manageButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  manageButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 18,
  },
  genreItem: {
    width: '48.5%',
  },
  genreCard: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    ...shadow.soft,
  },
  genreCardSelected: {
    borderColor: colors.primary,
  },
  genreShade: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.46)',
    padding: 11,
  },
  genreName: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  list: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: bottomNavHeight + 24,
    gap: 14,
  },
  movieCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  poster: {
    width: 102,
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  posterText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
  },
  movieInfo: {
    flex: 1,
    padding: 15,
  },
  movieTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  movieMeta: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  movieDescription: {
    marginTop: 10,
    color: '#475467',
    fontSize: 13,
    lineHeight: 19,
  },
  movieAction: {
    marginTop: 14,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
