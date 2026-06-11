using Application.Common.Interfaces;
using Application.DTOs.Billing;
using Application.ErrorHandling;

namespace Application.Bookings.Commands
{
    public record CheckOutBookingCommand : IAuditableCommand<Result<InvoiceDTO>>
    {
        public Guid BookingId { get; set; }
        public decimal Discount { get; set; }
    }
}
