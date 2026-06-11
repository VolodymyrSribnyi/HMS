using Application.DTOs.Room;
using Application.ErrorHandling;
using MediatR;

namespace Application.Rooms.Queries
{
    public class GetAvailableRoomsQuery : IRequest<Result<IEnumerable<GetRoomDTO>>>
    {
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int GuestCount { get; set; }
    }
}
