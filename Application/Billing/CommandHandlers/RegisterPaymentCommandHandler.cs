using Application.Billing.Commands;
using Application.Common.Interfaces;
using Application.DTOs.Billing;
using Application.ErrorHandling;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Billing.CommandHandlers
{
    public class RegisterPaymentCommandHandler : IRequestHandler<RegisterPaymentCommand, Result<PaymentDTO>>
    {
        private readonly IHmsDbContext _context;

        public RegisterPaymentCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PaymentDTO>> Handle(RegisterPaymentCommand request, CancellationToken cancellationToken)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == request.InvoiceId, cancellationToken);

            if (invoice is null)
            {
                return Result<PaymentDTO>.Failure(Errors.InvoiceNotFound);
            }

            if (invoice.IsClosed)
            {
                return Result<PaymentDTO>.Failure(Errors.InvoiceAlreadyClosed);
            }

            var paidAmount = invoice.Payments.Sum(payment => payment.Amount);
            var remainingAmount = invoice.TotalAmount - paidAmount;

            if (request.Amount > remainingAmount)
            {
                return Result<PaymentDTO>.Failure(Errors.PaymentExceedsInvoiceBalance);
            }

            var payment = Payment.Create(invoice.Id, request.Amount, request.PaymentMethod);
            await _context.Payments.AddAsync(payment, cancellationToken);

            var newRemainingAmount = remainingAmount - request.Amount;
            if (newRemainingAmount == 0)
            {
                invoice.Close();
            }

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<PaymentDTO>.Failure(Errors.ConcurrencyConflict);
            }

            return Result<PaymentDTO>.Success(new PaymentDTO
            {
                Id = payment.Id,
                InvoiceId = invoice.Id,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                PaymentDate = payment.PaymentDate,
                RemainingAmount = newRemainingAmount,
                IsInvoiceClosed = invoice.IsClosed
            });
        }
    }
}
