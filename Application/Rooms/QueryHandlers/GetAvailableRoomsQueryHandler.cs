using Application.Common.Interfaces;
using Application.DTOs.Room;
using Application.ErrorHandling;
using Application.Rooms.Queries;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Rooms.QueryHandlers
{
    public class GetAvailableRoomsQueryHandler : IRequestHandler<GetAvailableRoomsQuery, Result<IEnumerable<GetRoomDTO>>>
    {
        private readonly IHmsDbContext _context;

        public GetAvailableRoomsQueryHandler(IHmsDbContext context)
        {
            _context = context;
        }

        public async Task<Result<IEnumerable<GetRoomDTO>>> Handle(GetAvailableRoomsQuery request, CancellationToken cancellationToken)
        {
            if (request.CheckInDate.Date < DateTime.UtcNow.Date)
            {
                return Result<IEnumerable<GetRoomDTO>>.Failure(Errors.BookingDateInPast);
            }

            if (request.CheckOutDate <= request.CheckInDate)
            {
                return Result<IEnumerable<GetRoomDTO>>.Failure(Errors.BookingCheckInDateLaterThanCheckOut);
            }

            if (request.GuestCount <= 0)
            {
                return Result<IEnumerable<GetRoomDTO>>.Failure(Errors.InvalidData);
            }

            var rooms = await _context.Rooms
                .AsNoTracking()
                .Include(room => room.RoomType)
                .Where(room =>
                    room.Status != RoomStatus.OutOfOrder &&
                    room.Status != RoomStatus.NeedsCleaning &&
                    room.RoomType.Capacity >= request.GuestCount &&
                    !_context.Bookings.Any(booking =>
                        booking.AssignedRoomId == room.Id &&
                        booking.Status != BookingStatus.Cancelled &&
                        booking.Status != BookingStatus.CheckedOut &&
                        booking.CheckInDate < request.CheckOutDate &&
                        booking.CheckOutDate > request.CheckInDate))
                .OrderBy(room => room.RoomType.BasePrice)
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
