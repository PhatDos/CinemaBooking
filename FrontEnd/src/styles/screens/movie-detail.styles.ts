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
    paddingTop: 64,
    paddingBottom: bottomNavHeight + 24,
  },
  showtimeInfo: {
    flex: 1,
  },
  backLink: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backLinkText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  backLinkDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#151515',
  },
  poster: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    ...shadow.card,
  },
  posterText: {
    color: colors.surface,
    fontSize: 48,
    fontWeight: '900',
  },
  title: {
    marginTop: 24,
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: '#475467',
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionDark: {
    color: '#c4cad4',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  genre: {
    borderRadius: radius.sm,
    backgroundColor: '#fff3e0',
    color: '#9a3412',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 13,
    fontWeight: '800',
  },
  trailerPanel: {
    marginTop: 18,
  },
  trailerTitle: {
    marginBottom: 10,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  trailerPlayer: {
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    overflow: 'hidden',
    ...shadow.soft,
  },
  heading: {
    marginBottom: 5,
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  showtimeSection: {
    marginTop: 28,
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  showtimeLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  showtime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  showtimeTime: {
    marginBottom: 8,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  pricePill: {
    borderRadius: radius.sm,
    backgroundColor: '#e7f6f2',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  priceText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  empty: {
    color: colors.muted,
    fontSize: 15,
  },
  emptyPanel: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 18,
  },
  emptyPanelDark: {
    borderColor: '#242424',
    backgroundColor: '#101010',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  cinemaRail: {
    gap: 14,
    paddingTop: 18,
    paddingBottom: 18,
    paddingRight: 20,
  },
  cinemaChip: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#eef1f5',
    borderRadius: 39,
    backgroundColor: colors.surface,
    overflow: 'visible',
  },
  cinemaChipDark: {
    borderColor: '#242424',
    backgroundColor: '#151515',
  },
  cinemaChipSelected: {
    borderColor: '#0b6fa4',
  },
  cinemaChipSelectedDark: {
    borderColor: '#ffffff',
  },
  cinemaChipImage: {
    borderRadius: 39,
  },
  cinemaChipText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  cinemaPriceBadge: {
    position: 'absolute',
    top: -10,
    right: -18,
    zIndex: 2,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    elevation: 3,
  },
  cinemaPriceText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '900',
  },
  cinemaSummary: {
    marginBottom: 12,
  },
  cinemaName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  cinemaAddress: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  timePanel: {
    borderRadius: radius.md,
    backgroundColor: '#f2f4f7',
    padding: 16,
  },
  timePanelDark: {
    backgroundColor: '#101010',
  },
  roomFormat: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  roomBlock: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#d9dde5',
    paddingTop: 14,
  },
  roomBlockDark: {
    borderTopColor: '#242424',
  },
  roomName: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  timeChip: {
    minWidth: 82,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
  },
  timeChipDark: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#171717',
  },
  timeText: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  timeTextDark: {
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
  },
  backButton: {
    marginTop: 16,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonDark: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    backgroundColor: '#151515',
  },
  backButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  textDark: {
    color: '#ffffff',
  },
  mutedTextDark: {
    color: '#a7b0c0',
  },
});
