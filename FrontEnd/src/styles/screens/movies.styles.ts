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
    gap: 16,
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
    fontWeight: '800',
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
  primaryActionButton: {
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  list: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: bottomNavHeight + 24,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  poster: {
    width: 110,
    minHeight: 164,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  posterText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  posterBadge: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(16, 24, 40, 0.78)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  posterBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  info: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '900',
  },
  description: {
    marginTop: 12,
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
  },
  detail: {
    marginTop: 18,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '600',
  },
});
