using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Bookings.CommandHandlers
{
    public class UpdateBookingCommandHandler : IRequestHandler<UpdateBookingCommand, Result<bool>>
    {
        private readonly IHmsDbContext _context;
        private readonly IBookingRepository _repository;

        public UpdateBookingCommandHandler(IHmsDbContext context, IBookingRepository repository)
        {
            _context = context;
            _repository = repository;
        }

        public async Task<Result<bool>> Handle(UpdateBookingCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings.FindAsync(new object[] { request.BookingId }, cancellationToken);

            if (booking == null)
                return Result<bool>.Failure(Errors.BookingNotFound);

            if (booking.GuestId != request.GuestId)
                return Result<bool>.Failure(Errors.UnauthorizedBookingAccess);

            if (await _repository.IsBookingDateInPast(request.CheckInDate.Date, request.CheckOutDate.Date))
                return Result<bool>.Failure(Errors.BookingDateInPast);

            if (await _repository.IsBookingCheckInDateLaterThanCheckOut(request.CheckInDate.Date, request.CheckOutDate.Date))
                return Result<bool>.Failure(Errors.BookingCheckInDateLaterThanCheckOut);

            bool isOccupied = await _repository.IsRoomAvailableAsync(request.RoomId, request.CheckInDate.Date, request.CheckOutDate.Date, request.BookingId, cancellationToken);

            if (isOccupied)
                return Result<bool>.Failure(Errors.RoomIsBooked);

            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);

            if (room == null)
                return Result<bool>.Failure(Errors.RoomNotFound);

            decimal totalPrice = room.CalculateTotalPrice(request.CheckInDate, request.CheckOutDate);

            // 7. Оновлюємо сутність (припускаю, що у тебе є або буде метод Update у класі Booking)
            booking.Update(request.RoomId, request.CheckInDate, request.CheckOutDate, totalPrice, room.RoomTypeId);

            // 8. Магія конкурентності (щоб ніхто не забронював цей номер у цю ж мілісекунду)
            _context.Entry(room).State = EntityState.Modified;

            // Ніяких try-catch! Зберігаємо зміни.
            await _context.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);

        }
    }
}
