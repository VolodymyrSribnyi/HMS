import { apiClient } from "../../lib/axios";
import { type BookingDto } from "../../types/booking";

export const getMyBookings = async (): Promise<BookingDto[]> => {
    const response = await apiClient.get("booking/my-bookings");

    return response.data.value;
}
