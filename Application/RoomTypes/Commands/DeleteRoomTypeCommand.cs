using Application.ErrorHandling;
using MediatR;

namespace Application.RoomTypes.Commands
{
    public record DeleteRoomTypeCommand : IRequest<Result>
    {
        public Guid Id { get; set; }
    }
}
