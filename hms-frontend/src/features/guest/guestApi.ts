import { apiClient } from '../../lib/axios';
import type { RoomDto } from '../../types/rooms';

export interface SearchRoomsParams {
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
}

export interface CreateGuestBookingPayload {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
}

export const searchAvailableRooms = async (params: SearchRoomsParams): Promise<RoomDto[]> => {
  const response = await apiClient.get('/room/available', { params });
  return response.data;
};

export const getRoomById = async (roomId: string): Promise<RoomDto> => {
  const response = await apiClient.get(`/room/${roomId}`);
  return response.data;
};

export const createGuestBooking = async (payload: CreateGuestBookingPayload): Promise<void> => {
  await apiClient.post('/booking', payload);
};
