using Abp.Domain.Uow;
using Application.Common.Interfaces;
using Application.ErrorHandling;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;
using RoomTypes.Commands;
using Microsoft.EntityFrameworkCore;

namespace RoomTypes.CommandHandlers
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
            bool nameExists = await _context.RoomTypes
                .AnyAsync(rt => rt.Name == request.Name, cancellationToken);

            if (nameExists)
            {
                return Result<Guid>.Failure(Errors.RoomTypeExists);
            }

            var roomType = RoomType.Create(
                request.Name, request.Capacity, request.BasePrice,
                request.Description, request.Amenities);

            await _context.RoomTypes.AddAsync(roomType, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(roomType.Id);
        }
    }
}
