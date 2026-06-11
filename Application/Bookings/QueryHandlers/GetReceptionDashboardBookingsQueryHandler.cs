using Application.Bookings.Queries;
using Application.Common.Interfaces;
using Application.DTOs.Booking;
using Application.ErrorHandling;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.QueryHandlers
{
    public class GetReceptionDashboardBookingsQueryHandler
        : IRequestHandler<GetReceptionDashboardBookingsQuery, Result<IEnumerable<GetBookingDTO>>>
    {
        private readonly IHmsDbContext _context;

        public GetReceptionDashboardBookingsQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetBookingDTO>>> Handle(
            GetReceptionDashboardBookingsQuery request,
            CancellationToken cancellationToken)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var bookings = await _context.Bookings
                .AsNoTracking()
                .Where(b =>
                    ((b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed) &&
                        (b.CheckInDate.Date == today || b.CheckInDate.Date == tomorrow)) ||
                    (b.Status == BookingStatus.CheckedIn &&
                        (b.CheckOutDate.Date == today || b.CheckOutDate.Date == tomorrow)))
                .OrderBy(b => b.CheckInDate)
                .ThenBy(b => b.CheckOutDate)
                .Select(b => new GetBookingDTO
                {
                    Id = b.Id,
                    CheckInDate = b.CheckInDate,
                    CheckOutDate = b.CheckOutDate,
                    Status = b.Status,
                    TotalPrice = b.TotalPrice,
                    RoomTypeName = b.RoomType.Name,
                    AssignedRoomId = b.AssignedRoomId,
                    AssignedRoomNumber = b.AssignedRoom != null ? b.AssignedRoom.RoomNumber : null,
                    GuestId = b.GuestId,
                    GuestFullName = b.Guest != null ? (b.Guest.FirstName + " " + b.Guest.LastName).Trim() : null
                })
                .ToListAsync(cancellationToken);

            return Result<IEnumerable<GetBookingDTO>>.Success(bookings);
        }
    }
}
