using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.RoomTypes.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.RoomTypes.CommandHandlers
{
    public class DeleteRoomTypeCommandHandler : IRequestHandler<DeleteRoomTypeCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public DeleteRoomTypeCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(DeleteRoomTypeCommand request, CancellationToken cancellationToken)
        {
            var roomType = await _context.RoomTypes.FindAsync(new object[] { request.Id }, cancellationToken);

            if (roomType == null)
            {
                return Result.Failure(Errors.RoomTypeNotFound);
            }

            var hasRooms = await _context.Rooms
                .AnyAsync(room => room.RoomTypeId == request.Id, cancellationToken);

            if (hasRooms)
            {
                return Result.Failure(Errors.RoomTypeInUse);
            }

            _context.RoomTypes.Remove(roomType);
            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
    }
}
