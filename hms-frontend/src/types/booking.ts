export interface BookingDto {
  id: string;
  roomId?: string;
  assignedRoomId: string | null;
  roomTypeName: string; 
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string | number;
  assignedRoomNumber?: string | null;
}
