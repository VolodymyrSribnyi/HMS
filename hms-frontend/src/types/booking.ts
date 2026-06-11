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
  guestId?: string;
  guestFullName?: string | null;
  invoiceId?: string | null;
  invoiceTotalAmount?: number | null;
  invoicePaidAmount?: number | null;
  invoiceRemainingAmount?: number | null;
  invoiceIsClosed?: boolean | null;
}
