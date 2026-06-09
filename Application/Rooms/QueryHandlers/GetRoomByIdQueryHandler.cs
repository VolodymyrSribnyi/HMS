using Application.Common.Interfaces;
using Application.DTOs.Room;
using Application.ErrorHandling;
using Application.Rooms.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.QueryHandlers
{
    public class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, Result<GetRoomDTO>>
    {
        private readonly IHmsDbContext _context;

        public GetRoomByIdQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<GetRoomDTO>> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
        {
            var room = await _context.Rooms
                .AsNoTracking()
                .Include(existingRoom => existingRoom.RoomType)
                .Where(existingRoom => existingRoom.Id == request.Id)
                .Select(existingRoom => new GetRoomDTO
                {
                    Id = existingRoom.Id,
                    RoomNumber = existingRoom.RoomNumber,
                    Floor = existingRoom.Floor,
                    Status = existingRoom.Status.ToString(),
                    RoomTypeId = existingRoom.RoomTypeId,
                    RoomTypeName = existingRoom.RoomType.Name,
                    BasePrice = existingRoom.RoomType.BasePrice,
                    RowVersion = Convert.ToBase64String(existingRoom.Version)
                })
                .FirstOrDefaultAsync(cancellationToken);

            return room == null
                ? Result<GetRoomDTO>.Failure(Errors.RoomNotFound)
                : Result<GetRoomDTO>.Success(room);
        }
    }
}
