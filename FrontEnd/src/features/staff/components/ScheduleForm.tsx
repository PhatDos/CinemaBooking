import { ActivityIndicator, Switch, Text, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { formatRoomName } from '@/src/display';
import { colors } from '@/src/theme';
import type { Movie, Room } from '@/src/types';

import { styles } from '../styles';
import {
  defaultBulkTimes,
  defaultCouplePrice,
  defaultStandardPrice,
  defaultVipPrice,
} from '../utils';

type ScheduleFormProps = {
  bulkMode: boolean;
  bulkTimes: string;
  couplePrice: string;
  date: string;
  saving: boolean;
  selectedMovie: Movie | null;
  selectedRoom: Room | null;
  standardPrice: string;
  time: string;
  vipPrice: string;
  onChangeBulkMode: (enabled: boolean) => void;
  onChangeBulkTimes: (value: string) => void;
  onChangeCouplePrice: (value: string) => void;
  onChangeDate: (value: string) => void;
  onChangeStandardPrice: (value: string) => void;
  onChangeTime: (value: string) => void;
  onChangeVipPrice: (value: string) => void;
  onCreateShowtime: () => void;
};

export function ScheduleForm({
  bulkMode,
  bulkTimes,
  couplePrice,
  date,
  saving,
  selectedMovie,
  selectedRoom,
  standardPrice,
  time,
  vipPrice,
  onChangeBulkMode,
  onChangeBulkTimes,
  onChangeCouplePrice,
  onChangeDate,
  onChangeStandardPrice,
  onChangeTime,
  onChangeVipPrice,
  onCreateShowtime,
}: ScheduleFormProps) {
  return (
    <View style={styles.group}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {selectedMovie && selectedRoom ? (
            <Text numberOfLines={1} style={styles.selectedSummary}>
              {selectedMovie.title} | {formatRoomName(selectedRoom.name)}
            </Text>
          ) : null}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Bulk</Text>
          <Switch
            disabled={saving}
            onValueChange={onChangeBulkMode}
            thumbColor={bulkMode ? colors.primary : colors.surface}
            trackColor={{ false: colors.border, true: '#fecaca' }}
            value={bulkMode}
          />
        </View>
      </View>

      <View style={styles.formGrid}>
        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            editable={!saving}
            keyboardType="numbers-and-punctuation"
            onChangeText={onChangeDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={date}
          />
        </View>
      </View>

      <View style={styles.formGrid}>
        <View style={styles.priceField}>
          <Text style={styles.label}>Standard</Text>
          <TextInput
            editable={!saving}
            keyboardType="numeric"
            onChangeText={onChangeStandardPrice}
            placeholder={defaultStandardPrice}
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={standardPrice}
          />
        </View>
        <View style={styles.priceField}>
          <Text style={styles.label}>VIP</Text>
          <TextInput
            editable={!saving}
            keyboardType="numeric"
            onChangeText={onChangeVipPrice}
            placeholder={defaultVipPrice}
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={vipPrice}
          />
        </View>
        <View style={styles.priceField}>
          <Text style={styles.label}>Couple</Text>
          <TextInput
            editable={!saving}
            keyboardType="numeric"
            onChangeText={onChangeCouplePrice}
            placeholder={defaultCouplePrice}
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={couplePrice}
          />
        </View>
      </View>

      {bulkMode ? (
        <View style={styles.field}>
          <Text style={styles.label}>Times</Text>
          <TextInput
            editable={!saving}
            multiline
            onChangeText={onChangeBulkTimes}
            placeholder={defaultBulkTimes}
            placeholderTextColor="#98a2b3"
            style={[styles.input, styles.multilineInput]}
            value={bulkTimes}
          />
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Time</Text>
          <TextInput
            editable={!saving}
            keyboardType="numbers-and-punctuation"
            onChangeText={onChangeTime}
            placeholder="HH:mm"
            placeholderTextColor="#98a2b3"
            style={styles.input}
            value={time}
          />
        </View>
      )}

      <AnimatedPressable
        contentStyle={[styles.primaryButton, saving && styles.buttonDisabled]}
        disabled={saving}
        onPress={onCreateShowtime}>
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {bulkMode ? 'Create Showtimes' : 'Create Showtime'}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
}
