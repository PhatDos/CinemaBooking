import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { BottomNav } from '@/src/components/BottomNav';
import { ConfirmDialog } from '@/src/components/ConfirmDialog';
import { FadeInView } from '@/src/components/FadeInView';
import { LogoutButton } from '@/src/auth/components/LogoutButton';

import { BookingCard } from './components/BookingCard';
import { CheckoutCard } from './components/CheckoutCard';
import { useBookings } from './hooks/useBookings';
import { styles } from './styles';

type BookingsScreenProps = {
  userEmail?: string;
};

export function BookingsScreen({ userEmail }: BookingsScreenProps) {
  const {
    bookingToCancel,
    cancellingBookingId,
    cancellingHoldId,
    cancelSelectedBooking,
    cancelSelectedCheckout,
    checkoutToCancel,
    error,
    listItems,
    loadBookings,
    loading,
    payingHoldId,
    payCheckout,
    refreshing,
    refreshBookings,
    reservationDisplays,
    setBookingToCancel,
    setCheckoutToCancel,
  } = useBookings();

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.heading}>My Bookings</Text>
          <Text style={styles.subtitle}>{userEmail}</Text>
        </View>

        <View style={styles.actions}>
          <AnimatedPressable
            contentStyle={styles.actionButton}
            onPress={() => router.replace('/movies')}>
            <Text style={styles.actionText}>Movies</Text>
          </AnimatedPressable>

          <LogoutButton style={styles.actionButton} textStyle={styles.actionText} />
        </View>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadBookings()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={
            listItems.length === 0 ? styles.emptyList : styles.list
          }
          data={listItems}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>
                Choose a movie and reserve your first seats.
              </Text>
              <Pressable
                onPress={() => router.replace('/movies')}
                style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Browse movies</Text>
              </Pressable>
            </View>
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void refreshBookings()}
              refreshing={refreshing}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInView delay={index * 45}>
              {item.type === 'booking' ? (
                <BookingCard
                  booking={item.booking}
                  cancelling={cancellingBookingId === item.booking.id}
                  display={reservationDisplays[item.id]}
                  onCancel={() => setBookingToCancel(item.booking)}
                />
              ) : (
                <CheckoutCard
                  cancelling={cancellingHoldId === item.checkout.holdId}
                  checkout={item.checkout}
                  display={reservationDisplays[item.id]}
                  onCancel={() => setCheckoutToCancel(item.checkout)}
                  onPay={() => void payCheckout(item.checkout)}
                  paying={payingHoldId === item.checkout.holdId}
                />
              )}
            </FadeInView>
          )}
        />
      )}

      <BottomNav />
      <ConfirmDialog
        cancelLabel="Keep booking"
        confirmLabel="Cancel booking"
        destructive
        loading={cancellingBookingId !== null}
        message="This will release the selected seats for other customers."
        onCancel={() => {
          if (!cancellingBookingId) {
            setBookingToCancel(null);
          }
        }}
        onConfirm={cancelSelectedBooking}
        title="Cancel pending booking?"
        visible={bookingToCancel !== null}
      />
      <ConfirmDialog
        cancelLabel="Keep checkout"
        confirmLabel="Cancel checkout"
        destructive
        loading={cancellingHoldId !== null}
        message={
          checkoutToCancel?.payment?.status === 'Pending'
            ? 'This will cancel the PayOS payment link first. Seats are released only if payment cancellation succeeds.'
            : 'This will cancel this checkout and release the selected seats.'
        }
        onCancel={() => {
          if (!cancellingHoldId) {
            setCheckoutToCancel(null);
          }
        }}
        onConfirm={cancelSelectedCheckout}
        title="Cancel checkout?"
        visible={checkoutToCancel !== null}
      />
    </View>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}
