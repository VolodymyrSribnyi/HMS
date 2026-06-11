using Application.DTOs.Booking;
using Application.ErrorHandling;
using MediatR;

namespace Application.Bookings.Queries
{
    public record GetBookingByIdQuery : IRequest<Result<GetBookingDTO>>
    {
        public Guid BookingId { get; set; }
        public Guid RequesterId { get; set; }
        public bool CanViewAllBookings { get; set; }
    }
}
