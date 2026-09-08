import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { formatRoomName } from '@/src/display';
import { colors } from '@/src/theme';
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
  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Room</Text>
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
                style={[styles.roomChip, selected && styles.roomChipSelected]}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.roomChipText,
                    selected && styles.roomChipTextSelected,
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
