using Application.Billing.CommandHandlers;
using Application.Billing.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using MockQueryable.NSubstitute;
using NSubstitute;
using Xunit;

namespace Application.UnitTests.Billing.Commands;

public class RegisterPaymentCommandHandlerTests
{
    [Fact]
    public async Task Handle_PartialPayment_AddsPaymentButKeepsInvoiceOpen()
    {
        var invoice = Invoice.Create(Guid.NewGuid(), totalAmount: 1000m, discount: 0m);
        var context = CreateContext([invoice]);
        var handler = new RegisterPaymentCommandHandler(context);
        var command = new RegisterPaymentCommand
        {
            InvoiceId = invoice.Id,
            Amount = 500m,
            PaymentMethod = "Cash"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.False(invoice.IsClosed);
        Assert.False(result.Value.IsInvoiceClosed);
        Assert.Equal(500m, result.Value.RemainingAmount);

        await context.Payments.Received(1).AddAsync(
            Arg.Is<Payment>(payment =>
                payment.InvoiceId == invoice.Id &&
                payment.Amount == command.Amount &&
                payment.PaymentMethod == command.PaymentMethod),
            Arg.Any<CancellationToken>());
        await context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_FullPayment_ClosesInvoice()
    {
        var invoice = Invoice.Create(Guid.NewGuid(), totalAmount: 1000m, discount: 0m);
        var context = CreateContext([invoice]);
        var handler = new RegisterPaymentCommandHandler(context);
        var command = new RegisterPaymentCommand
        {
            InvoiceId = invoice.Id,
            Amount = 1000m,
            PaymentMethod = "Card"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.True(invoice.IsClosed);
        Assert.True(result.Value.IsInvoiceClosed);
        Assert.Equal(0m, result.Value.RemainingAmount);
        await context.Payments.Received(1).AddAsync(Arg.Any<Payment>(), Arg.Any<CancellationToken>());
        await context.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_PaymentForAlreadyClosedInvoice_ReturnsFailure()
    {
        var invoice = Invoice.Create(Guid.NewGuid(), totalAmount: 1000m, discount: 0m);
        invoice.Close();

        var context = CreateContext([invoice]);
        var handler = new RegisterPaymentCommandHandler(context);
        var command = new RegisterPaymentCommand
        {
            InvoiceId = invoice.Id,
            Amount = 100m,
            PaymentMethod = "Cash"
        };

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(Errors.InvoiceAlreadyClosed, result.Error);
        await context.Payments.Received(0).AddAsync(Arg.Any<Payment>(), Arg.Any<CancellationToken>());
        await context.Received(0).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    private static IHmsDbContext CreateContext(IReadOnlyCollection<Invoice> invoices)
    {
        var context = Substitute.For<IHmsDbContext>();

        var invoiceSet = invoices.ToList().BuildMockDbSet();
        var paymentSet = new List<Payment>().BuildMockDbSet();

        paymentSet
            .AddAsync(Arg.Any<Payment>(), Arg.Any<CancellationToken>())
            .Returns(new ValueTask<EntityEntry<Payment>>((EntityEntry<Payment>)null!));

        context.Invoices.Returns(invoiceSet);
        context.Payments.Returns(paymentSet);
        context.SaveChangesAsync(Arg.Any<CancellationToken>()).Returns(1);

        return context;
    }
}
