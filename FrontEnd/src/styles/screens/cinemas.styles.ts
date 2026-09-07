import { StyleSheet } from 'react-native';
import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
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
    flexDirection: 'row',
    gap: 14,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.card,
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
  filterChipSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipTextSelected: {
    color: colors.surface,
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
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  thumbnail: {
    width: 86,
    minHeight: 86,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    overflow: 'hidden',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '900',
  },
  cardBody: {
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
  address: {
    marginTop: 5,
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  ward: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  detail: {
    marginTop: 10,
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
