using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.Rooms.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.CommandHandlers
{
    public class DeleteRoomCommandHandler : IRequestHandler<DeleteRoomCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public DeleteRoomCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(DeleteRoomCommand request, CancellationToken cancellationToken)
        {
            var room = await _context.Rooms.FindAsync(new object[] { request.Id }, cancellationToken);

            if (room == null)
            {
                return Result.Failure(Errors.RoomNotFound);
            }

            var hasBookings = await _context.Bookings
                .AnyAsync(booking => booking.AssignedRoomId == request.Id, cancellationToken);

            if (hasBookings)
            {
                return Result.Failure(Errors.RoomHasBookings);
            }

            if (!string.IsNullOrWhiteSpace(request.RowVersion))
            {
                try
                {
                    _context.Entry(room).Property(nameof(room.Version)).OriginalValue = Convert.FromBase64String(request.RowVersion);
                }
                catch (FormatException)
                {
                    return Result.Failure(Errors.InvalidData);
                }
            }

            _context.Rooms.Remove(room);

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
