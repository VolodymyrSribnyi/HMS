import { apiClient } from '../../lib/axios';
import type { BookingDto } from '../../types/booking';

export const getReceptionBookings = async (): Promise<BookingDto[]> => {
  const response = await apiClient.get('/booking');
  return response.data;
};

export const checkInBooking = async (bookingId: string, roomId: string): Promise<void> => {
  await apiClient.post(`/booking/${bookingId}/checkin`, { roomId });
};

export const checkOutBooking = async (bookingId: string): Promise<void> => {
  await apiClient.post(`/booking/${bookingId}/checkout`);
};
