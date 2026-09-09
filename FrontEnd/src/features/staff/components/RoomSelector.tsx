import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatRoomName } from '@/src/display';
import { colors, useThemeMode } from '@/src/theme';
import type { Cinema, Room } from '@/src/types';

import { styles } from '../styles';
import { EmptyPanel } from './EmptyPanel';

type RoomSelectorProps = {
  loadingCinema: boolean;
  rooms: Room[];
  saving: boolean;
  selectedCinema: Cinema | null;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
};

export function RoomSelector({
  loadingCinema,
  rooms,
  saving,
  selectedCinema,
  selectedRoomId,
  onSelectRoom,
}: RoomSelectorProps) {
  const dark = useThemeMode() === 'dark';

  return (
    <View style={[styles.group, dark && styles.groupDark]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dark && styles.textDark]}>Room</Text>
        {loadingCinema ? <ActivityIndicator color={colors.primary} /> : null}
      </View>
      {rooms.length === 0 ? (
        <EmptyPanel
          body={
            selectedCinema
              ? 'This cinema has no active rooms.'
              : 'Select a cinema first.'
          }
          title="No rooms"
        />
      ) : (
        <View style={styles.chipGrid}>
          {rooms.map((room) => {
            const selected = room.id === selectedRoomId;

            return (
              <Pressable
                disabled={saving}
                key={room.id}
                onPress={() => onSelectRoom(room.id)}
                style={[
                  styles.roomChip,
                  dark && styles.roomChipDark,
                  selected && styles.roomChipSelected,
                  selected && dark && styles.roomChipSelectedDark,
                ]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.roomChipText,
                    dark && styles.mutedTextDark,
                    selected && !dark && styles.roomChipTextSelected,
                    selected && dark && styles.roomChipTextSelectedDark,
                  ]}>
                  {formatRoomName(room.name)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
