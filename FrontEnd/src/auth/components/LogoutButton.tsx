import { useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text } from 'react-native';

import { useAuth } from '@/src/auth/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
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
      <AnimatedPressable contentStyle={style} onPress={() => setConfirmVisible(true)}>
        <Text style={textStyle}>Logout</Text>
      </AnimatedPressable>

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
