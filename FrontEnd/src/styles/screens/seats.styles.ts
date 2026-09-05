import { StyleSheet } from 'react-native';
import { bottomNavHeight } from '@/src/styles/layout';
import { colors, radius, shadow } from '@/src/theme';

export const seatGap = 4;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 64,
    paddingBottom: bottomNavHeight + 24,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
  },
  text: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  contextPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.soft,
  },
  contextTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  contextText: {
    marginTop: 5,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  contextPrice: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  screen: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    paddingVertical: 10,
    ...shadow.soft,
  },
  screenText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  map: {
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: 9,
    padding: 8,
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    width: 18,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  seats: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: seatGap,
  },
  seat: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  seatHeld: {
    borderColor: '#facc15',
    backgroundColor: '#fde68a',
  },
  seatVip: {
    borderColor: '#a78bfa',
    backgroundColor: '#ede9fe',
  },
  seatCouple: {
    borderColor: '#ffd5dc',
    backgroundColor: '#ffe4e6',
  },
  seatReserved: {
    borderColor: '#344054',
    backgroundColor: '#344054',
  },
  seatBooked: {
    borderColor: '#344054',
    backgroundColor: '#344054',
  },
  seatSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  seatText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  seatTextCompact: {
    fontSize: 11,
  },
  seatTextSelected: {
    color: colors.surface,
  },
  seatTextHeld: {
    color: '#854d0e',
  },
  seatTextVip: {
    color: '#5b21b6',
  },
  seatTextCouple: {
    color: '#9f1239',
  },
  seatTextReserved: {
    color: colors.surface,
  },
  seatTextBooked: {
    color: colors.surface,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 26,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  legendText: {
    color: colors.muted,
    fontSize: 13,
  },
  note: {
    marginTop: 20,
    color: colors.muted,
    fontSize: 14,
  },
  selectedTotal: {
    marginTop: 8,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  priceWarning: {
    marginTop: 8,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    marginTop: 24,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '900',
  },
  holdPanel: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#99f6e4',
    borderRadius: radius.md,
    backgroundColor: '#ecfdf5',
    padding: 14,
    ...shadow.soft,
  },
  holdTitle: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  holdText: {
    marginTop: 6,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  holdDetail: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
  },
  holdError: {
    marginTop: 18,
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 14,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
});
