using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.Commands
{
    public record UpdateBookingCommand : IRequest<Result<bool>>
    {
        public Guid BookingId { get; set; }
        public Guid GuestId { get; set; }
        public Guid RoomId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
    }
}
