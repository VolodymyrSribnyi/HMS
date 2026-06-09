using Application.DTOs.Billing;
using Application.ErrorHandling;
using MediatR;

namespace Application.Billing.Commands
{
    public record RegisterPaymentCommand : IRequest<Result<PaymentDTO>>
    {
        public Guid InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
    }
}
