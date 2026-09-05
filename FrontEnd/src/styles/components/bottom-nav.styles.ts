import { StyleSheet } from 'react-native';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e7eaf0',
    borderBottomWidth: 0,
    borderRadius: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 22,
    ...shadow.card,
  },
  item: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: 3,
  },
  itemPressable: {
    flex: 1,
  },
  itemActive: {
    backgroundColor: colors.ink,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  labelActive: {
    color: colors.surface,
  },
});
