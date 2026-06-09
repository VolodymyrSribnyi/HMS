export interface BookingDto {
  id: string;
  roomId: string;
  roomTypeName: string; 
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  status: string;
}