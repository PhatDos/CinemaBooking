import { router } from 'expo-router';
import { ActivityIndicator, Linking, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import type { Checkout } from '@/src/types';

import { styles } from '../styles';
import {
  formatCurrency,
  formatDate,
  formatSeatFallback,
  getCheckoutStatusLabel,
  type ReservationDisplay,
} from '../utils';

type CheckoutCardProps = {
  cancelling: boolean;
  checkout: Checkout;
  display?: ReservationDisplay;
  onCancel: () => void;
  onPay: () => void;
  paying: boolean;
};

export function CheckoutCard({
  cancelling,
  checkout,
  display,
  onCancel,
  onPay,
  paying,
}: CheckoutCardProps) {
  const seatLabels = display?.seatLabels ?? [];
  const canPay = checkout.status === 'Held';
  const canOpenPayOS =
    checkout.status === 'PaymentPending' && Boolean(checkout.checkoutUrl);
  const canCancel =
    checkout.status === 'Held' || checkout.status === 'PaymentPending';

  return (
    <AnimatedPressable
      contentStyle={styles.card}
      onPress={() =>
        router.push({
          pathname: '/checkout/hold/[holdId]',
          params: {
            amount: checkout.amount.toString(),
            expiresAt: checkout.expiresAt,
            holdId: checkout.holdId,
            seatCount: checkout.seatIds.length.toString(),
            showtimeId: checkout.showtimeId,
          },
        })
      }>
      <View style={styles.cardHeader}>
        <View style={styles.bookingTitleBlock}>
          <Text style={styles.bookingId}>Checkout</Text>
          <Text style={styles.date}>Expires: {formatDate(checkout.expiresAt)}</Text>
        </View>
        <View style={[styles.badge, getCheckoutBadgeStyle(checkout.status)]}>
          <Text style={[styles.badgeText, getCheckoutBadgeTextStyle(checkout.status)]}>
            {getCheckoutStatusLabel(checkout.status)}
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
              {formatSeatFallback(checkout.seatIds.length)}
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

      <Text style={styles.total}>{formatCurrency(checkout.amount)}</Text>

      <View style={styles.cardActions}>
        {canPay ? (
          <AnimatedPressable
            contentStyle={styles.payButton}
            disabled={paying}
            onPress={(event) => {
              event.stopPropagation();
              onPay();
            }}>
            {paying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.payButtonText}>Pay now</Text>
            )}
          </AnimatedPressable>
        ) : null}

        {canOpenPayOS ? (
          <AnimatedPressable
            contentStyle={styles.openPaymentButton}
            onPress={(event) => {
              event.stopPropagation();
              void Linking.openURL(checkout.checkoutUrl!);
            }}>
            <Text style={styles.openPaymentText}>Open PayOS</Text>
          </AnimatedPressable>
        ) : null}

        {checkout.status === 'PaymentProcessing' ? (
          <Text style={styles.processingText}>Processing tickets</Text>
        ) : null}

        {canCancel ? (
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
              <Text style={styles.cancelBookingText}>Cancel checkout</Text>
            )}
          </AnimatedPressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

function getCheckoutBadgeStyle(status: Checkout['status']) {
  switch (status) {
    case 'PaymentProcessing':
      return styles.badgeConfirmed;
    case 'PaymentConflict':
    case 'PaymentFailed':
      return styles.badgeExpired;
    case 'Cancelled':
      return styles.badgeCancelled;
    default:
      return styles.badgePending;
  }
}

function getCheckoutBadgeTextStyle(status: Checkout['status']) {
  switch (status) {
    case 'PaymentProcessing':
      return styles.badgeTextConfirmed;
    case 'PaymentConflict':
    case 'PaymentFailed':
      return styles.badgeTextExpired;
    case 'Cancelled':
      return styles.badgeTextCancelled;
    default:
      return styles.badgeTextPending;
  }
}
