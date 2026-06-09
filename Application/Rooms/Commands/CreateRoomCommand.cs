using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Commands
{
    public record CreateRoomCommand : IRequest<Result<Guid>>
    {
        public string RoomNumber { get; set; }
        public int Floor { get; set; }
        public string Status { get; set; } = "Available";
        public Guid RoomTypeId { get; set; }
    }
}
