using Application.DTOs.Room;
using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Queries
{
    public record GetAllRoomsQuery : IRequest<Result<IEnumerable<GetRoomDTO>>>;
}
