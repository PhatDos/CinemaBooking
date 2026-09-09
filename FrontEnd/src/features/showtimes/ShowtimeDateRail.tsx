import { useEffect, useMemo } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { colors, useThemeMode } from '@/src/theme';

import {
  buildShowtimeDateOptions,
  formatFullDate,
} from './date-filter';
import { styles } from './styles';

type ShowtimeDateRailProps = {
  canIncludePast?: boolean;
  includePast?: boolean;
  onSelectDate: (value: string) => void;
  onToggleIncludePast?: (value: boolean) => void;
  selectedDate: string;
  title?: string;
};

export function ShowtimeDateRail({
  canIncludePast = false,
  includePast = false,
  onSelectDate,
  onToggleIncludePast,
  selectedDate,
  title = 'CHỌN NGÀY CHIẾU',
}: ShowtimeDateRailProps) {
  const dark = useThemeMode() === 'dark';
  const options = useMemo(
    () => buildShowtimeDateOptions({ includePast: canIncludePast && includePast }),
    [canIncludePast, includePast],
  );

  useEffect(() => {
    if (!options.some((option) => option.value === selectedDate)) {
      onSelectDate(options[0]?.value ?? selectedDate);
    }
  }, [onSelectDate, options, selectedDate]);

  return (
    <View style={styles.dateSection}>
      <View style={styles.dateHeader}>
        <View style={styles.dateHeading}>
          <Text style={[styles.sectionTitle, dark && styles.sectionTitleDark]}>{title}</Text>
          <Text style={[styles.selectedDateLabel, dark && styles.selectedDateLabelDark]}>
            Ngày chiếu:{' '}
            <Text style={[styles.selectedDateValue, dark && styles.selectedDateValueDark]}>
              {formatFullDate(selectedDate)}
            </Text>
          </Text>
        </View>

        {canIncludePast && onToggleIncludePast ? (
          <View style={styles.includePast}>
            <Text style={[styles.includePastText, dark && styles.includePastTextDark]}>
              Quá khứ
            </Text>
            <Switch
              ios_backgroundColor="#d0d5dd"
              onValueChange={onToggleIncludePast}
              thumbColor={colors.surface}
              trackColor={{ false: '#d0d5dd', true: '#0b6fa4' }}
              value={includePast}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.dateRail}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {options.map((option) => {
          const selected = option.value === selectedDate;

          return (
            <AnimatedPressable
              contentStyle={[
                styles.dateChip,
                dark && styles.dateChipDark,
                selected && styles.dateChipSelected,
                selected && dark && styles.dateChipSelectedDark,
                option.isPast && !selected && styles.dateChipPast,
              ]}
              key={option.value}
              onPress={() => onSelectDate(option.value)}
              pressedScale={0.96}>
              <Text
                style={[
                  styles.dateText,
                  dark && styles.dateTextDark,
                  selected && styles.dateTextSelected,
                  selected && dark && styles.dateTextSelectedDark,
                ]}>
                {option.dateLabel}
              </Text>
              <Text
                style={[
                  styles.dayText,
                  dark && styles.dayTextDark,
                  selected && styles.dayTextSelected,
                  selected && dark && styles.dayTextSelectedDark,
                ]}>
                {option.dayLabel}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
