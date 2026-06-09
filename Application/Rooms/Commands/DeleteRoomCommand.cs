using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Commands
{
    public record DeleteRoomCommand : IRequest<Result>
    {
        public Guid Id { get; set; }
        public string? RowVersion { get; set; }
    }
}
