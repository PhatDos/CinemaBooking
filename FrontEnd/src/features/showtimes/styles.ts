import { StyleSheet } from 'react-native';

import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  dateSection: {
    gap: 14,
    marginTop: 26,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  dateHeading: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  sectionTitleDark: {
    color: '#ffffff',
  },
  selectedDateLabel: {
    marginTop: 7,
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  selectedDateLabelDark: {
    color: '#a7b0c0',
  },
  selectedDateValue: {
    color: colors.ink,
  },
  selectedDateValueDark: {
    color: '#ffffff',
  },
  includePast: {
    alignItems: 'center',
    gap: 5,
  },
  includePastText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  includePastTextDark: {
    color: '#a7b0c0',
  },
  dateRail: {
    gap: 12,
    paddingRight: 20,
  },
  dateChip: {
    width: 68,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderRadius: radius.md,
    backgroundColor: '#f2f4f7',
    ...shadow.soft,
  },
  dateChipDark: {
    borderColor: '#242424',
    backgroundColor: '#151515',
    shadowColor: '#000000',
  },
  dateChipPast: {
    opacity: 0.72,
  },
  dateChipSelected: {
    borderColor: '#0b6fa4',
    backgroundColor: '#0b6fa4',
  },
  dateChipSelectedDark: {
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
  },
  dateText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  dateTextDark: {
    color: '#a7b0c0',
  },
  dateTextSelected: {
    color: colors.surface,
  },
  dateTextSelectedDark: {
    color: '#050505',
  },
  dayText: {
    marginTop: 4,
    color: colors.ink,
    fontSize: 23,
    fontWeight: '900',
  },
  dayTextDark: {
    color: '#ffffff',
  },
  dayTextSelected: {
    color: colors.surface,
  },
  dayTextSelectedDark: {
    color: '#050505',
  },
});
