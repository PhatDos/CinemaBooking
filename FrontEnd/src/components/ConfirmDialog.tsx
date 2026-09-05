import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { colors, radius, shadow } from '@/src/theme';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <View style={styles.scrim}>
        <FadeInView distance={8} duration={180} style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <AnimatedPressable
              disabled={loading}
              onPress={onCancel}
              contentStyle={[styles.button, styles.cancelButton, loading && styles.disabledButton]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </AnimatedPressable>

            <AnimatedPressable
              disabled={loading}
              onPress={onConfirm}
              contentStyle={[
                styles.button,
                destructive ? styles.destructiveButton : styles.confirmButton,
                loading && styles.disabledButton,
              ]}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </AnimatedPressable>
          </View>
        </FadeInView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
