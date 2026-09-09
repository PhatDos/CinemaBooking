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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 18,
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
  },
  subtitleDark: {
    color: '#a7b0c0',
  },
  list: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: bottomNavHeight + 24,
    gap: 14,
  },
  emptyList: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: bottomNavHeight + 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.card,
  },
  cardDark: {
    borderColor: '#242424',
    backgroundColor: '#101010',
    shadowColor: '#000000',
  },
  filters: {
    paddingBottom: 6,
  },
  filterLabel: {
    marginHorizontal: 20,
    marginBottom: 8,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  filterRail: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    maxWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterChipDark: {
    borderColor: '#242424',
    backgroundColor: '#050505',
  },
  filterChipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  filterChipSelectedDark: {
    borderColor: '#8a8a8a',
    backgroundColor: '#ffffff',
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipTextDark: {
    color: '#c8ced8',
  },
  filterChipTextSelected: {
    color: colors.surface,
  },
  filterChipTextSelectedDark: {
    color: '#050505',
  },
  inlineLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  inlineLoaderText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  avatar: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  cardBody: {
    marginTop: 12,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  titleDark: {
    color: '#ffffff',
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  badgeTextActive: {
    color: colors.success,
  },
  badgeTextInactive: {
    color: colors.muted,
  },
  meta: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  metaDark: {
    color: '#d7dde8',
  },
  address: {
    marginTop: 5,
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  addressDark: {
    color: '#c4cad4',
  },
  ward: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  wardDark: {
    color: '#a7b0c0',
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  descriptionDark: {
    color: '#8f98a8',
  },
  detail: {
    marginTop: 10,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  detailDark: {
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
  emptyText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
});
