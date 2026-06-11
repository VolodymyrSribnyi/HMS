using Application.Common.Interfaces;
using Application.ErrorHandling;

namespace Application.Bookings.Commands
{
    public record CheckInBookingCommand : IAuditableCommand<Result>
    {
        public Guid BookingId { get; set; }
        public Guid RoomId { get; set; }
    }
}
