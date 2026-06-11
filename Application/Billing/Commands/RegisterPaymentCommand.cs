using Application.Common.Interfaces;
using Application.DTOs.Billing;
using Application.ErrorHandling;

namespace Application.Billing.Commands
{
    public record RegisterPaymentCommand : IAuditableCommand<Result<PaymentDTO>>
    {
        public Guid InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
    }
}
