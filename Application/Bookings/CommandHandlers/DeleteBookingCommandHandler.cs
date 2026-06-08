using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.CommandHandlers
{
    public class DeleteBookingCommandHandler : IRequestHandler<DeleteBookingCommand, Result<bool>>
    {
        private readonly IHmsDbContext _context;

        public DeleteBookingCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<bool>> Handle(DeleteBookingCommand request, CancellationToken cancellationToken)
        {
            // 1. Знаходимо бронювання (і підтягуємо Room для Concurrency)
            var booking = await _context.Bookings
                .Include(b => b.AssignedRoom)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

            if (booking == null)
                return Result<bool>.Failure(Errors.BookingNotFound);

            // 2. Перевірка безпеки
            if (booking.GuestId != request.GuestId)
                return Result<bool>.Failure(Errors.UnauthorizedBookingAccess);

            // 3. Видаляємо бронювання (або міняємо статус на Cancelled, якщо ти використовуєш Soft Delete)
            _context.Bookings.Remove(booking);

            // 4. Магія конкурентності: оновлюємо версію номеру, оскільки він тепер звільнився
            if (booking.AssignedRoom != null)
            {
                _context.Entry(booking.AssignedRoom).State = EntityState.Modified;
            }

            // Ніяких try-catch!
            await _context.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
    }
}
