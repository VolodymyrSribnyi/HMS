using Application.DTOs.Booking;
using Application.ErrorHandling;
using MediatR;

namespace Application.Bookings.Queries
{
    public record GetReceptionDashboardBookingsQuery : IRequest<Result<IEnumerable<GetBookingDTO>>>
    {
    }
}
