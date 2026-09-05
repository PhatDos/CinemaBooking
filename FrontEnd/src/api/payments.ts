import { apiFetch } from '@/src/api/client';
import type { Payment } from '@/src/types';

export function getPayment(paymentId: string) {
  return apiFetch<Payment>(`/api/payments/${paymentId}`);
}

export function getPaymentByBooking(bookingId: string) {
  return apiFetch<Payment>(`/api/payments/by-booking/${bookingId}`);
}

export function getPaymentByHold(holdId: string) {
  return apiFetch<Payment>(`/api/payments/by-hold/${holdId}`);
}

export function payBooking(bookingId: string) {
  return apiFetch<Payment>('/api/payments', {
    method: 'POST',
    body: { bookingId },
  });
}

export function payHold(holdId: string) {
  return apiFetch<Payment>('/api/payments', {
    method: 'POST',
    body: { holdId },
  });
}
