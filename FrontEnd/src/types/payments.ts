export type PaymentStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Cancelled';

export type PaymentFulfillmentStatus = 'Pending' | 'Fulfilled' | 'Conflict';

export type Payment = {
  id: string;
  bookingId: string | null;
  holdId: string | null;
  showtimeId: string | null;
  orderCode: number | null;
  amount: number;
  status: PaymentStatus;
  fulfillmentStatus: PaymentFulfillmentStatus;
  fulfillmentLastError: string | null;
  provider: string;
  paymentLinkId: string | null;
  checkoutUrl: string | null;
  qrCode: string | null;
  createdAt: string;
  expiresAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  fulfilledAt: string | null;
  fulfillmentFailedAt: string | null;
};
