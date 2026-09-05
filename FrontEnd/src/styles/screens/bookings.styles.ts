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
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 14,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    padding: 20,
    paddingBottom: bottomNavHeight + 24,
    gap: 12,
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
    padding: 16,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  bookingId: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  bookingTitleBlock: {
    flex: 1,
  },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePending: {
    backgroundColor: '#e0f2fe',
  },
  badgeConfirmed: {
    backgroundColor: '#dcfce7',
  },
  badgeExpired: {
    backgroundColor: '#fee2e2',
  },
  badgeCancelled: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  badgeTextPending: {
    color: colors.blue,
  },
  badgeTextConfirmed: {
    color: colors.success,
  },
  badgeTextExpired: {
    color: colors.danger,
  },
  badgeTextCancelled: {
    color: colors.muted,
  },
  bookingMetaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metaBlock: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
  },
  metaLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 5,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  total: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  cancelBookingButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: radius.md,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelBookingText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  date: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 13,
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
    fontWeight: '700',
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
