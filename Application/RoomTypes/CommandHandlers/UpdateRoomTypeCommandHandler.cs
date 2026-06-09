using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.RoomTypes.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.RoomTypes.CommandHandlers
{
    public class UpdateRoomTypeCommandHandler : IRequestHandler<UpdateRoomTypeCommand, Result>
    {
        private readonly IHmsDbContext _context;

        public UpdateRoomTypeCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result> Handle(UpdateRoomTypeCommand request, CancellationToken cancellationToken)
        {
            var roomType = await _context.RoomTypes.FindAsync(new object[] { request.Id }, cancellationToken);

            if (roomType == null)
            {
                return Result.Failure(Errors.RoomTypeNotFound);
            }

            var nameExists = await _context.RoomTypes
                .AnyAsync(rt => rt.Id != request.Id && rt.Name == request.Name, cancellationToken);

            if (nameExists)
            {
                return Result.Failure(Errors.RoomTypeExists);
            }

            roomType.Update(
                request.Name,
                request.Capacity,
                request.BasePrice,
                request.Description,
                request.Amenities);

            await _context.SaveChangesAsync(cancellationToken);

            return Result.Success();
        }
    }
}
