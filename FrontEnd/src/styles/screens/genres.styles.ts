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
  kickerDark: {
    color: '#c8ced8',
  },
  heading: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  headingDark: {
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitleDark: {
    color: '#a7b0c0',
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
  manageButtonDark: {
    borderColor: '#242424',
    backgroundColor: '#151515',
  },
  manageButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  manageButtonTextDark: {
    color: '#ffffff',
  },
  backButton: {
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
  backButtonText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  resultHeader: {
    paddingHorizontal: 20,
    paddingTop: 58,
    paddingBottom: 10,
  },
  resultTopRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  resultBackButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  resultBackButtonDark: {
    borderColor: '#242424',
    backgroundColor: '#151515',
  },
  resultTopTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultTopTitleDark: {
    color: '#ffffff',
  },
  resultTopSpacer: {
    width: 42,
    height: 42,
  },
  resultHero: {
    minHeight: 172,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    ...shadow.card,
  },
  resultHeroShade: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.58)',
    padding: 18,
  },
  resultKicker: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  resultHeading: {
    marginTop: 4,
    color: colors.surface,
    fontSize: 34,
    fontWeight: '900',
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  resultSubtitle: {
    flex: 1,
    color: '#e4e7ec',
    fontSize: 14,
    fontWeight: '800',
  },
  resultCountPill: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  resultCountText: {
    color: colors.ink,
    fontSize: 12,
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
  movieCardDark: {
    borderColor: '#242424',
    backgroundColor: '#101010',
    shadowColor: '#000000',
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
  movieTitleDark: {
    color: '#ffffff',
  },
  movieMeta: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  movieMetaDark: {
    color: '#a7b0c0',
  },
  movieDescription: {
    marginTop: 10,
    color: '#475467',
    fontSize: 13,
    lineHeight: 19,
  },
  movieDescriptionDark: {
    color: '#c4cad4',
  },
  movieAction: {
    marginTop: 14,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  movieActionDark: {
    color: '#ffffff',
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
  emptyTitleDark: {
    color: '#ffffff',
  },
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#a7b0c0',
  },
});
