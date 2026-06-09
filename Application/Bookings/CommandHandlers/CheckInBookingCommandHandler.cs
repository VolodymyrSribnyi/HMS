using Application.Bookings.Commands;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Bookings.CommandHandlers
{
    public class CheckInBookingCommandHandler : IRequestHandler<CheckInBookingCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public CheckInBookingCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(CheckInBookingCommand request, CancellationToken cancellationToken)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken);

            if (booking is null)
            {
                return Result.Failure(Errors.BookingNotFound);
            }

            if (booking.Status is not (BookingStatus.Pending or BookingStatus.Confirmed))
            {
                return Result.Failure(Errors.InvalidBookingStatus);
            }

            var room = await _context.Rooms
                .FirstOrDefaultAsync(r => r.Id == request.RoomId, cancellationToken);

            if (room is null)
            {
                return Result.Failure(Errors.RoomNotFound);
            }

            if (room.RoomTypeId != booking.RoomTypeId)
            {
                return Result.Failure(Errors.RoomTypeMismatch);
            }

            if (room.Status != RoomStatus.Available)
            {
                return Result.Failure(Errors.RoomNotAvailable);
            }

            var roomHasOverlappingBooking = await _context.Bookings
                .AnyAsync(b =>
                    b.Id != booking.Id &&
                    b.AssignedRoomId == room.Id &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.CheckedOut &&
                    b.CheckInDate < booking.CheckOutDate &&
                    b.CheckOutDate > booking.CheckInDate,
                    cancellationToken);

            if (roomHasOverlappingBooking)
            {
                return Result.Failure(Errors.RoomIsBooked);
            }

            booking.CheckIn(room.Id);
            room.MarkOccupied();

            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                return Result.Success();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Result.Failure(Errors.ConcurrencyConflict);
            }
        }
    }
}
