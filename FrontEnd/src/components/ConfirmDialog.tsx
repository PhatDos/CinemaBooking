import {
  ActivityIndicator,
  Modal,
  Text,
  View,
} from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { FadeInView } from '@/src/components/FadeInView';
import { styles } from '@/src/styles/components/confirm-dialog.styles';

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
