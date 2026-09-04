import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, Text } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';

type LogoutButtonProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function LogoutButton({ style, textStyle }: LogoutButtonProps) {
  const { signOut } = useAuth();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleConfirm() {
    setSigningOut(true);

    try {
      await signOut();
      setConfirmVisible(false);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <Pressable onPress={() => setConfirmVisible(true)} style={style}>
        <Text style={textStyle}>Logout</Text>
      </Pressable>

      <ConfirmDialog
        confirmLabel="Logout"
        destructive
        loading={signingOut}
        message="You will need to sign in again to manage bookings."
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void handleConfirm()}
        title="Logout?"
        visible={confirmVisible}
      />
    </>
  );
}
