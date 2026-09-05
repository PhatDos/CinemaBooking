import { StyleSheet } from 'react-native';
import { colors, radius, shadow } from '@/src/theme';

export const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 24, 40, 0.52)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 20,
    ...shadow.card,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  message: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  button: {
    minHeight: 44,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  confirmButton: {
    backgroundColor: colors.ink,
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.65,
  },
  cancelText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
