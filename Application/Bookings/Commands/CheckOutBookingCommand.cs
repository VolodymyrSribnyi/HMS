using Application.DTOs.Billing;
using Application.ErrorHandling;
using MediatR;

namespace Application.Bookings.Commands
{
    public record CheckOutBookingCommand : IRequest<Result<InvoiceDTO>>
    {
        public Guid BookingId { get; set; }
        public decimal Discount { get; set; }
    }
}
