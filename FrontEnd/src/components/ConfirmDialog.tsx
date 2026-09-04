import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              disabled={loading}
              onPress={onCancel}
              style={[styles.button, styles.cancelButton, loading && styles.disabledButton]}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={onConfirm}
              style={[
                styles.button,
                destructive ? styles.destructiveButton : styles.confirmButton,
                loading && styles.disabledButton,
              ]}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  title: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  message: {
    marginTop: 10,
    color: '#4b5563',
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
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  confirmButton: {
    backgroundColor: '#111827',
  },
  destructiveButton: {
    backgroundColor: '#b91c1c',
  },
  disabledButton: {
    opacity: 0.65,
  },
  cancelText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
