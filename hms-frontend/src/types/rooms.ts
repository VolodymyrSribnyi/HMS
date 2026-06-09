export type RoomStatus = 'Available' | 'Occupied' | 'NeedsCleaning' | 'OutOfOrder';

export interface RoomTypeDto {
  id: string;
  name: string;
  capacity: number;
  basePrice: number;
  description: string | null;
  amenities: string | null;
}

export interface RoomDto {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomTypeId: string;
  roomTypeName: string;
  basePrice: number;
  rowVersion: string;
}

export interface RoomTypePayload {
  name: string;
  capacity: number;
  basePrice: number;
  description?: string | null;
  amenities?: string | null;
}

export interface RoomPayload {
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomTypeId: string;
  rowVersion?: string;
}
