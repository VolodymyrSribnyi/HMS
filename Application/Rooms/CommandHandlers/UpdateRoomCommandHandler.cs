using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.Rooms.Commands;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.CommandHandlers
{
    public class UpdateRoomCommandHandler : IRequestHandler<UpdateRoomCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public UpdateRoomCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(UpdateRoomCommand request, CancellationToken cancellationToken)
        {
            if (!Enum.TryParse<RoomStatus>(request.Status, true, out var status))
            {
                return Result.Failure(Errors.InvalidRoomStatus);
            }

            var room = await _context.Rooms.FindAsync(new object[] { request.Id }, cancellationToken);

            if (room == null)
            {
                return Result.Failure(Errors.RoomNotFound);
            }

            var roomTypeExists = await _context.RoomTypes
                .AnyAsync(rt => rt.Id == request.RoomTypeId, cancellationToken);

            if (!roomTypeExists)
            {
                return Result.Failure(Errors.RoomTypeNotFound);
            }

            var roomNumberExists = await _context.Rooms
                .AnyAsync(existingRoom => existingRoom.Id != request.Id && existingRoom.RoomNumber == request.RoomNumber, cancellationToken);

            if (roomNumberExists)
            {
                return Result.Failure(Errors.RoomExists);
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

            room.Update(request.RoomNumber, request.Floor, status, request.RoomTypeId);

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
