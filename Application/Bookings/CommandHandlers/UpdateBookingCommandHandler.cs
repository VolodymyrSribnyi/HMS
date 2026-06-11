using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities.Enums;
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

            if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
                return Result<bool>.Failure(Errors.InvalidBookingStatus);

            if (booking.GuestId != request.GuestId)
                return Result<bool>.Failure(Errors.UnauthorizedBookingAccess);

            if (await _repository.IsBookingDateInPast(request.CheckInDate.Date, request.CheckOutDate.Date))
                return Result<bool>.Failure(Errors.BookingDateInPast);

            if (await _repository.IsBookingCheckInDateLaterThanCheckOut(request.CheckInDate.Date, request.CheckOutDate.Date))
                return Result<bool>.Failure(Errors.BookingCheckInDateLaterThanCheckOut);

            bool isAvailable = await _repository.IsRoomAvailableAsync(request.RoomId, request.CheckInDate.Date, request.CheckOutDate.Date, request.BookingId, cancellationToken);

            if (!isAvailable)
                return Result<bool>.Failure(Errors.RoomIsBooked);

            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);

            if (room == null)
                return Result<bool>.Failure(Errors.RoomNotFound);

            decimal totalPrice = room.CalculateTotalPrice(request.CheckInDate, request.CheckOutDate);

            booking.Update(request.CheckInDate, request.CheckOutDate, totalPrice, room.RoomTypeId);
            booking.AssignRoom(room.Id);

            await _context.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);

        }
    }
}
