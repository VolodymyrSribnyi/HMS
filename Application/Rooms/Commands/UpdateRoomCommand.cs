using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Commands
{
    public record UpdateRoomCommand : IRequest<Result>
    {
        public Guid Id { get; set; }
        public string RoomNumber { get; set; }
        public int Floor { get; set; }
        public string Status { get; set; }
        public Guid RoomTypeId { get; set; }
        public string? RowVersion { get; set; }
    }
}
