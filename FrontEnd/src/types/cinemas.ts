export type SeatType = 'Standard' | 'VIP' | 'Couple';

export type Seat = {
  id: string;
  roomId: string;
  row: string;
  number: number;
  type: SeatType;
};

export type Room = {
  id: string;
  cinemaId: string;
  name: string;
  isActive: boolean;
  seats?: Seat[];
};

export type Cinema = {
  id: string;
  name: string;
  address: string;
  city: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  rooms?: Room[];
  provinceCode?: string | null;
  provinceName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  addressLine?: string | null;
};
