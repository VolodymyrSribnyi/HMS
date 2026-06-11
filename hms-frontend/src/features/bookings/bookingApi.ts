import { apiClient } from "../../lib/axios";
import { type BookingDto } from "../../types/booking";

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
    InvoiceId?: string | null;
    InvoiceTotalAmount?: number | null;
    InvoicePaidAmount?: number | null;
    InvoiceRemainingAmount?: number | null;
    InvoiceIsClosed?: boolean | null;
};

const unwrapResponse = (data: unknown): unknown => {
    if (typeof data === 'object' && data !== null && 'value' in data) {
        return (data as { value?: unknown }).value;
    }

    return data;
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
    invoiceId: booking.invoiceId ?? booking.InvoiceId ?? null,
    invoiceTotalAmount: booking.invoiceTotalAmount ?? booking.InvoiceTotalAmount ?? null,
    invoicePaidAmount: booking.invoicePaidAmount ?? booking.InvoicePaidAmount ?? null,
    invoiceRemainingAmount: booking.invoiceRemainingAmount ?? booking.InvoiceRemainingAmount ?? null,
    invoiceIsClosed: booking.invoiceIsClosed ?? booking.InvoiceIsClosed ?? null,
});

const mapBookings = (data: unknown): BookingDto[] => {
    const unwrapped = unwrapResponse(data);
    return Array.isArray(unwrapped) ? unwrapped.map((booking) => mapBooking(booking as RawBooking)) : [];
};

export const getMyBookings = async (): Promise<BookingDto[]> => {
    const response = await apiClient.get("booking/my");

    return mapBookings(response.data);
};

export const getAllBookings = async (): Promise<BookingDto[]> => {
    const response = await apiClient.get("booking");

    return mapBookings(response.data);
};

export const getBookingById = async (id: string): Promise<BookingDto> => {
    const response = await apiClient.get(`booking/${id}`);

    return mapBooking(unwrapResponse(response.data) as RawBooking);
};

interface UpdateBookingDatesPayload {
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
}

export const updateBookingDates = async (
    bookingId: string,
    payload: UpdateBookingDatesPayload,
): Promise<void> => {
    await apiClient.put(`booking/${bookingId}`, payload);
};

export const cancelBooking = async (bookingId: string): Promise<void> => {
    await apiClient.delete(`booking/${bookingId}`);
};
