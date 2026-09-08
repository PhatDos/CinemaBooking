import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import type { Booking } from '@/src/types';

import { styles } from '../styles';
import {
  formatCurrency,
  formatDate,
  formatSeatFallback,
  getStatusLabel,
  isPendingStatus,
  normalizeStatus,
  type ReservationDisplay,
} from '../utils';

type BookingCardProps = {
  booking: Booking;
  cancelling: boolean;
  display?: ReservationDisplay;
  onCancel: () => void;
};

export function BookingCard({
  booking,
  cancelling,
  display,
  onCancel,
}: BookingCardProps) {
  const seatLabels = display?.seatLabels ?? [];

  return (
    <AnimatedPressable
      contentStyle={styles.card}
      onPress={() =>
        router.push({
          pathname: '/checkout/[bookingId]',
          params: { bookingId: booking.id },
        })
      }>
      <View style={styles.cardHeader}>
        <View style={styles.bookingTitleBlock}>
          <Text style={styles.bookingId}>Booking</Text>
          <Text style={styles.date}>Created: {formatDate(booking.createdAt)}</Text>
        </View>
        <View style={[styles.badge, getStatusBadgeStyle(booking.status)]}>
          <Text style={[styles.badgeText, getStatusBadgeTextStyle(booking.status)]}>
            {getStatusLabel(booking.status)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingMetaGrid}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Seats</Text>
          {seatLabels.length > 0 ? (
            <View style={styles.seatPills}>
              {seatLabels.map((seatLabel) => (
                <View key={seatLabel} style={styles.seatPill}>
                  <Text style={styles.seatPillText}>{seatLabel}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.metaValue}>
              {formatSeatFallback(booking.seatIds.length)}
            </Text>
          )}
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Showtime</Text>
          <Text numberOfLines={3} style={styles.metaValue}>
            {display?.showtimeLabel ?? 'Loading details...'}
          </Text>
        </View>
      </View>

      <Text style={styles.total}>{formatCurrency(booking.totalAmount)}</Text>

      {isPendingStatus(booking.status) ? (
        <View style={styles.cardActions}>
          <AnimatedPressable
            contentStyle={styles.cancelBookingButton}
            disabled={cancelling}
            onPress={(event) => {
              event.stopPropagation();
              onCancel();
            }}>
            {cancelling ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <Text style={styles.cancelBookingText}>Cancel booking</Text>
            )}
          </AnimatedPressable>
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

function getStatusBadgeStyle(status: Booking['status']) {
  switch (normalizeStatus(status)) {
    case 'confirmed':
      return styles.badgeConfirmed;
    case 'expired':
      return styles.badgeExpired;
    case 'cancelled':
      return styles.badgeCancelled;
    default:
      return styles.badgePending;
  }
}

function getStatusBadgeTextStyle(status: Booking['status']) {
  switch (normalizeStatus(status)) {
    case 'confirmed':
      return styles.badgeTextConfirmed;
    case 'expired':
      return styles.badgeTextExpired;
    case 'cancelled':
      return styles.badgeTextCancelled;
    default:
      return styles.badgeTextPending;
  }
}
