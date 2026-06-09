using Application.ErrorHandling;
using MediatR;

namespace Application.Bookings.Commands
{
    public record CheckInBookingCommand : IRequest<Result>
    {
        public Guid BookingId { get; set; }
        public Guid RoomId { get; set; }
    }
}
