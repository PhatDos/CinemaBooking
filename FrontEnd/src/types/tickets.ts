export type TicketStatus = 'Valid' | 'Used' | 'Cancelled';

export type Ticket = {
  id: string;
  bookingId: string;
  showtimeId: string;
  seatId: string;
  code: string;
  status: TicketStatus;
};

export type CheckInTicketResponse = {
  ticketId: string;
  bookingId: string;
  showtimeId: string;
  seatId: string;
  status: 'Used';
  usedAt: string;
};
