using Application.DTOs.Booking;
using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.Queries
{
    public record GetGuestsBookingsQuery : IRequest<Result<IEnumerable<GetBookingDTO>>>
    {
        public Guid GuestId { get; set; }
    }
}
