using Application.Common.Interfaces;
using Application.DTOs.Room;
using Application.ErrorHandling;
using Application.Rooms.Queries;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.QueryHandlers
{
    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, Result<IEnumerable<GetRoomDTO>>>
    {
        private readonly IHmsDbContext _context;

        public GetAllRoomsQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetRoomDTO>>> Handle(GetAllRoomsQuery request, CancellationToken cancellationToken)
        {
            var rooms = await _context.Rooms
                .AsNoTracking()
                .Include(room => room.RoomType)
                .OrderBy(room => room.Floor)
                .ThenBy(room => room.RoomNumber)
                .Select(room => new GetRoomDTO
                {
                    Id = room.Id,
                    RoomNumber = room.RoomNumber,
                    Floor = room.Floor,
                    Status = room.Status.ToString(),
                    RoomTypeId = room.RoomTypeId,
                    RoomTypeName = room.RoomType.Name,
                    BasePrice = room.RoomType.BasePrice,
                    RowVersion = Convert.ToBase64String(room.Version)
                })
                .ToListAsync(cancellationToken);

            return Result<IEnumerable<GetRoomDTO>>.Success(rooms);
        }
    }
}
