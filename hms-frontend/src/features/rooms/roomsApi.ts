import { apiClient } from '../../lib/axios';
import {
  type RoomDto,
  type RoomPayload,
  type RoomTypeDto,
  type RoomTypePayload,
} from '../../types/rooms';

export const getRooms = async (): Promise<RoomDto[]> => {
  const response = await apiClient.get('/room');
  return response.data;
};

export const createRoom = async (payload: RoomPayload): Promise<void> => {
  await apiClient.post('/room', payload);
};

export const updateRoom = async (id: string, payload: RoomPayload): Promise<void> => {
  await apiClient.put(`/room/${id}`, payload);
};

export const deleteRoom = async (id: string, rowVersion?: string): Promise<void> => {
  await apiClient.delete(`/room/${id}`, {
    params: { rowVersion },
  });
};

export const getRoomTypes = async (): Promise<RoomTypeDto[]> => {
  const response = await apiClient.get('/roomtype');
  return response.data;
};

export const createRoomType = async (payload: RoomTypePayload): Promise<void> => {
  await apiClient.post('/roomtype', payload);
};

export const updateRoomType = async (id: string, payload: RoomTypePayload): Promise<void> => {
  await apiClient.put(`/roomtype/${id}`, payload);
};

export const deleteRoomType = async (id: string): Promise<void> => {
  await apiClient.delete(`/roomtype/${id}`);
};
