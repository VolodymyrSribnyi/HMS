using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Interfaces
{
    public interface IBookingRepository
    {
        Task<bool> IsRoomAvailableAsync(Guid roomId, DateTime checkIn, DateTime checkOut, Guid? excludeBookingId = null, CancellationToken cancellationToken = default);
        Task<bool> IsBookingDateInPast(DateTime checkInDate, DateTime checkOutDate);
        Task<bool> IsBookingCheckInDateLaterThanCheckOut(DateTime checkInDate, DateTime checkOutDate);
    }
}
