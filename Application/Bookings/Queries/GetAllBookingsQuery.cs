using Application.DTOs.Booking;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.Queries
{
    public record GetAllBookingsQuery : IRequest<Result<IEnumerable<GetBookingDTO>>>
    {

    }
}
