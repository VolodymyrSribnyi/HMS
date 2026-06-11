import { apiClient } from '../../lib/axios';
import type { BookingDto } from '../../types/booking';

type RawBooking = Partial<BookingDto> & {
  Id?: string;
  RoomId?: string;
  AssignedRoomId?: string | null;
  RoomTypeName?: string;
  CheckInDate?: string;
  CheckOutDate?: string;
  TotalPrice?: number;
  Status?: string | number;
  AssignedRoomNumber?: string | null;
  GuestId?: string;
  GuestFullName?: string | null;
};

const unwrapResponse = (data: unknown): RawBooking[] => {
  if (Array.isArray(data)) return data as RawBooking[];

  if (typeof data === 'object' && data !== null && 'value' in data) {
    const value = (data as { value?: unknown }).value;
    return Array.isArray(value) ? (value as RawBooking[]) : [];
  }

  return [];
};

const mapBooking = (booking: RawBooking): BookingDto => ({
  id: booking.id ?? booking.Id ?? '',
  roomId: booking.roomId ?? booking.RoomId,
  assignedRoomId: booking.assignedRoomId ?? booking.AssignedRoomId ?? null,
  roomTypeName: booking.roomTypeName ?? booking.RoomTypeName ?? 'Невідомий тип',
  checkInDate: booking.checkInDate ?? booking.CheckInDate ?? '',
  checkOutDate: booking.checkOutDate ?? booking.CheckOutDate ?? '',
  totalPrice: booking.totalPrice ?? booking.TotalPrice ?? 0,
  status: booking.status ?? booking.Status ?? 'Pending',
  assignedRoomNumber: booking.assignedRoomNumber ?? booking.AssignedRoomNumber ?? null,
  guestId: booking.guestId ?? booking.GuestId,
  guestFullName: booking.guestFullName ?? booking.GuestFullName ?? null,
});

export const getReceptionBookings = async (): Promise<BookingDto[]> => {
  const response = await apiClient.get('/booking/reception-dashboard');
  return unwrapResponse(response.data).map(mapBooking);
};

export const checkInBooking = async (bookingId: string, roomId: string): Promise<void> => {
  await apiClient.post(`/booking/${bookingId}/checkin`, { roomId });
};

export const checkOutBooking = async (bookingId: string): Promise<void> => {
  await apiClient.post(`/booking/${bookingId}/checkout`);
};
