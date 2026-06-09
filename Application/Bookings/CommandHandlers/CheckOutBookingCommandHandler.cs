using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.DTOs.Billing;
using Application.ErrorHandling;
using Domain.Entities;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.CommandHandlers
{
    public class CheckOutBookingCommandHandler : IRequestHandler<CheckOutBookingCommand, Result<InvoiceDTO>>
    {
        private readonly IHmsDbContext _context;

        public CheckOutBookingCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<InvoiceDTO>> Handle(CheckOutBookingCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .Include(b => b.AssignedRoom)
                    .ThenInclude(room => room!.RoomType)
                .Include(b => b.RoomType)
                .Include(b => b.Invoice)
                    .ThenInclude(invoice => invoice.Payments)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

            if (booking is null)
            {
                return Result<InvoiceDTO>.Failure(Errors.BookingNotFound);
            }

            if (booking.Status != BookingStatus.CheckedIn || booking.AssignedRoom is null)
            {
                return Result<InvoiceDTO>.Failure(Errors.InvalidBookingStatus);
            }

            var nights = (booking.CheckOutDate.Date - booking.CheckInDate.Date).Days;
            if (nights <= 0)
            {
                return Result<InvoiceDTO>.Failure(Errors.InvalidData);
            }

            var roomType = booking.AssignedRoom.RoomType ?? booking.RoomType;
            var baseAmount = nights * roomType.BasePrice;

            if (request.Discount > baseAmount)
            {
                return Result<InvoiceDTO>.Failure(Errors.InvalidDiscount);
            }

            var totalAmount = baseAmount - request.Discount;
            var invoice = Invoice.Create(booking.Id, totalAmount, request.Discount);

            booking.CheckOut();
            booking.AssignedRoom.MarkNeedsCleaning();
            await _context.Invoices.AddAsync(invoice, cancellationToken);

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result<InvoiceDTO>.Failure(Errors.ConcurrencyConflict);
            }

            return Result<InvoiceDTO>.Success(new InvoiceDTO
            {
                Id = invoice.Id,
                BookingId = booking.Id,
                RoomTypeName = roomType.Name,
                CheckInDate = booking.CheckInDate,
                CheckOutDate = booking.CheckOutDate,
                Nights = nights,
                BaseAmount = baseAmount,
                Discount = invoice.Discount,
                TotalAmount = invoice.TotalAmount,
                PaidAmount = 0,
                RemainingAmount = invoice.TotalAmount,
                IsClosed = invoice.IsClosed
            });
        }
    }
}
