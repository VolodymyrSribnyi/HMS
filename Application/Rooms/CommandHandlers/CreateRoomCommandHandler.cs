using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.Rooms.Commands;
using Domain.Entities;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.CommandHandlers
{
    public class CreateRoomCommandHandler : IRequestHandler<CreateRoomCommand, Result<Guid>>
    {
        private readonly IHmsDbContext _context;

        public CreateRoomCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<Guid>> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            if (!Enum.TryParse<RoomStatus>(request.Status, true, out var status))
            {
                return Result<Guid>.Failure(Errors.InvalidRoomStatus);
            }

            var roomTypeExists = await _context.RoomTypes
                .AnyAsync(rt => rt.Id == request.RoomTypeId, cancellationToken);

            if (!roomTypeExists)
            {
                return Result<Guid>.Failure(Errors.RoomTypeNotFound);
            }

            var roomNumberExists = await _context.Rooms
                .AnyAsync(room => room.RoomNumber == request.RoomNumber, cancellationToken);

            if (roomNumberExists)
            {
                return Result<Guid>.Failure(Errors.RoomExists);
            }

            var room = Room.Create(request.RoomNumber, request.Floor, status, request.RoomTypeId);

            await _context.Rooms.AddAsync(room, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(room.Id);
        }
    }
}
