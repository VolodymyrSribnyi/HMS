using Application.Common.Interfaces;
using Application.ErrorHandling;
using Application.RoomTypes.Commands;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.RoomTypes.CommandHandlers
{
    public class CreateRoomTypeCommandHandler : IRequestHandler<CreateRoomTypeCommand, Result<Guid>>
    {
        private readonly IHmsDbContext _context;

        public CreateRoomTypeCommandHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<Guid>> Handle(CreateRoomTypeCommand request, CancellationToken cancellationToken)
        {
            var nameExists = await _context.RoomTypes
                .AnyAsync(rt => rt.Name == request.Name, cancellationToken);

            if (nameExists)
            {
                return Result<Guid>.Failure(Errors.RoomTypeExists);
            }

            var roomType = RoomType.Create(
                request.Name,
                request.Capacity,
                request.BasePrice,
                request.Description,
                request.Amenities);

            await _context.RoomTypes.AddAsync(roomType, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(roomType.Id);
        }
    }
}
