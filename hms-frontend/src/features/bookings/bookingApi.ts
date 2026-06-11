import { apiClient } from "../../lib/axios";
import { type BookingDto } from "../../types/booking";

export const getMyBookings = async (): Promise<BookingDto[]> => {
    const response = await apiClient.get("booking/my-bookings");

    return response.data.value ?? response.data;
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
