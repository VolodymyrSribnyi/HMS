using Application.DTOs.Room;
using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Queries
{
    public record GetRoomByIdQuery : IRequest<Result<GetRoomDTO>>
    {
        public Guid Id { get; set; }
    }
}
