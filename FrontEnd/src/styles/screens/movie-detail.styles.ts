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
    paddingTop: 0,
    paddingBottom: bottomNavHeight + 24,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  hero: {
    height: 224,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  heroFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(16, 24, 40, 0.48)',
  },
  heroOverlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },
  heroBackButton: {
    position: 'absolute',
    top: 54,
    left: 20,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  heroBackText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  heroCopy: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '900',
  },
  heroMeta: {
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 13,
    fontWeight: '800',
  },
  posterText: {
    color: colors.surface,
    fontSize: 48,
    fontWeight: '900',
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
    marginTop: 30,
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
    gap: 18,
    paddingTop: 24,
    paddingBottom: 20,
    paddingLeft: 4,
    paddingRight: 40,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  cinemaList: {
    gap: 22,
  },
  cinemaMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: 21,
    backgroundColor: '#eef1f5',
    overflow: 'hidden',
  },
  cinemaMarkDark: {
    borderColor: '#2a2a2a',
    backgroundColor: '#171717',
  },
  cinemaMarkImage: {
    height: '100%',
    width: '100%',
  },
  cinemaMarkText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  cinemaMarkTextDark: {
    color: '#a7b0c0',
  },
  cinemaInfo: {
    flex: 1,
    minWidth: 0,
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
    marginLeft: 0,
    borderRadius: radius.md,
    backgroundColor: '#f2f4f7',
    padding: 16,
  },
  timePanelDark: {
    backgroundColor: '#101010',
  },
  roomFormat: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  timeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    marginBottom: 14,
    width: '100%',
    overflow: 'hidden',
  },
  timeDividerDash: {
    width: 14,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#c7ceda',
  },
  timeDividerDashDark: {
    backgroundColor: '#4f5663',
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
