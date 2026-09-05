import { apiFetch } from '@/src/api/client';
import type { Payment } from '@/src/types';

export function getPayment(paymentId: string) {
  return apiFetch<Payment>(`/api/payments/${paymentId}`);
}

export function getPaymentByBooking(bookingId: string) {
  return apiFetch<Payment>(`/api/bookings/${bookingId}/payment`);
}

export function payBooking(bookingId: string) {
  return apiFetch<Payment>('/api/payments', {
    method: 'POST',
    body: { bookingId },
  });
}
