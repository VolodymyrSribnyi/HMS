using Application.ErrorHandling;
using MediatR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.Commands
{
    public class DeleteBookingCommand : IRequest<Result<bool>>
    {
        public Guid BookingId { get; set; }
        public Guid GuestId { get; set; } // ID поточного користувача з токена
    }
}
